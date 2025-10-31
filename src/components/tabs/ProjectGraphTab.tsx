import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setIsProcessing, setStatus } from '../../store/appSlice';

interface GraphNode {
  id: string;
  type: string;
  properties: any;
  position?: { x: number; y: number };
  selected?: boolean;
}

interface GraphEdge {
  from: string;
  to: string;
  type: string;
  properties: any;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  embedding_content: any[];
  stats: {
    total_nodes: number;
    total_edges: number;
    embedding_entries: number;
  };
}

interface GraphExportResult {
  success: boolean;
  message: string;
  data?: GraphData;
}

const ProjectGraphTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isProcessing } = useAppSelector((state) => state.app);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [projectJson, setProjectJson] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'hierarchy' | 'dependencies' | 'semantic'>('overview');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatProcessing, setIsChatProcessing] = useState<boolean>(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      setCanvasContext(ctx);
      if (ctx && graphData) {
        drawGraph(ctx, graphData);
      }
    }
  }, [canvasRef.current, graphData, viewMode, filterType]);

  const handleExportProject = async () => {
    dispatch(setIsProcessing(true));
    dispatch(setStatus('Exporting project...'));
    addLog('🚀 Starting project export');

    try {
      const result = await new Promise<string>((resolve, reject) => {
        const script = `exportProjectToJSON()`;

        if ((window as any).CSInterface) {
          const csInterface = new (window as any).CSInterface();
          csInterface.evalScript(script, (result: string) => {
            resolve(result);
          });
        } else {
          reject(new Error('CSInterface not available'));
        }
      });

      const parsed = JSON.parse(result);
      
      if (parsed && !parsed.error) {
        setProjectJson(parsed);
        addLog(`✅ Project JSON exported successfully`);
        dispatch(setStatus(`Project JSON exported`));
      } else {
        addLog(`❌ Export failed: ${parsed?.error || 'Unknown error'}`);
        dispatch(setStatus('Export failed'));
      }
    } catch (error) {
      addLog(`❌ Export error: ${error}`);
      dispatch(setStatus('Export error'));
    }
    
    dispatch(setIsProcessing(false));
  };

  const convertJsonToGraph = async () => {
    if (!projectJson) return;
    
    addLog('🔄 Converting JSON to HelixDB graph...');
    dispatch(setIsProcessing(true));
    
    try {
      // Check if Graph Navigator service is available
      const healthCheck = await fetch('http://127.0.0.1:5003/health', {
        method: 'GET',
      });
      
      if (healthCheck.ok) {
        addLog('✅ Graph Navigator service detected');
        addLog('🔄 Initializing HelixDB connection...');
        
        // Initialize HelixDB connection
        const initResponse = await fetch('http://127.0.0.1:5003/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: 'graph_ui_session' })
        });
        
        if (initResponse.ok) {
          const initResult = await initResponse.json();
          addLog(`📊 HelixDB connection established: ${initResult.connection_id}`);
        }
      } else {
        throw new Error('Graph Navigator service not available');
      }
      
      // Create local graph for visualization  
      const localGraph = await createLocalGraphData();
      setGraphData(localGraph);
      
      // Upload graph data to HelixDB
      addLog('🔄 Uploading graph data to HelixDB...');
      try {
        const uploadResponse = await fetch('http://127.0.0.1:5003/upload_graph', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: 'graph_ui_session',
            nodes: localGraph.nodes,
            edges: localGraph.edges,
            embedding_content: localGraph.embedding_content || []
          })
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          addLog(`📊 Graph data uploaded: ${uploadResult.nodes_added || 0} nodes, ${uploadResult.edges_added || 0} edges`);
          addLog('✅ Graph created and uploaded to HelixDB successfully');
          dispatch(setStatus('Graph created with HelixDB integration'));
        } else {
          throw new Error(`Upload failed: ${uploadResponse.status}`);
        }
      } catch (uploadError) {
        addLog(`⚠️ HelixDB upload failed: ${uploadError}`);
        addLog('✅ Graph created (local visualization only)');
        dispatch(setStatus('Graph created (local mode)'));
      }
      
    } catch (error) {
      addLog(`⚠️ HelixDB service unavailable: ${error}`);
      
      // Create local graph only
      addLog('🔄 Creating local graph visualization...');
      const localGraph = await createLocalGraphData();
      setGraphData(localGraph);
      addLog('✅ Graph created (local visualization)');
      dispatch(setStatus('Graph created (local mode)'));
    }
    
    dispatch(setIsProcessing(false));
  };

  const createLocalGraphData = async (): Promise<GraphData> => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const embedding_content: any[] = [];
    
    // Debug logging
    console.log('🔍 Project JSON structure:', projectJson);
    console.log('🔍 Project JSON keys:', Object.keys(projectJson || {}));
    console.log('🔍 Project items:', projectJson?.items);
    console.log('🔍 Project items length:', projectJson?.items?.length);
    
    addLog(`🔍 Debug: Project JSON keys: ${Object.keys(projectJson || {}).join(', ')}`);
    addLog(`🔍 Debug: Project items array exists: ${!!projectJson?.items}`);
    addLog(`🔍 Debug: Project items length: ${projectJson?.items?.length || 0}`);
    
    // Create project root node
    nodes.push({
      id: 'project_root',
      type: 'Project',
      properties: {
        name: projectJson.project?.name || 'Untitled Project',
        num_items: projectJson.project?.numItems || 0
      }
    });
    
    console.log('🔍 Created project root node:', nodes[0]);
    addLog(`🔍 Debug: Created project root node: ${nodes[0].properties.name}`);
    
    // Convert items to nodes and edges
    if (projectJson.items) {
      console.log('🔍 Processing items, count:', projectJson.items.length);
      addLog(`🔍 Debug: Processing ${projectJson.items.length} project items`);
      projectJson.items.forEach((item: any, index: number) => {
        console.log(`🔍 Processing item ${index}:`, item);
        addLog(`🔍 Debug: Item ${index + 1}: ${item.name || 'Unnamed'} (${item.type || 'Unknown type'})`);
        const itemId = `item_${item.id || index}`;
        
        nodes.push({
          id: itemId,
          type: item.type || 'Item',
          properties: {
            name: item.name || 'Unnamed',
            index: index + 1,
            ...item
          }
        });
        
        edges.push({
          from: 'project_root',
          to: itemId,
          type: 'CONTAINS',
          properties: { index: index + 1 }
        });
        
        embedding_content.push({
          id: itemId,
          field: 'name',
          content: item.name || 'Unnamed',
          type: 'name'
        });
        
        console.log(`🔍 Created node for item ${index}:`, nodes[nodes.length - 1]);
        
        // Convert layers if composition
        if (item.layers) {
          item.layers.forEach((layer: any, layerIndex: number) => {
            const layerId = `${itemId}_layer_${layerIndex}`;
            
            nodes.push({
              id: layerId,
              type: layer.type || 'Layer',
              properties: {
                name: layer.name || `Layer ${layerIndex + 1}`,
                index: layerIndex + 1,
                ...layer
              }
            });
            
            edges.push({
              from: itemId,
              to: layerId,
              type: 'CONTAINS',
              properties: { index: layerIndex + 1 }
            });
            
            embedding_content.push({
              id: layerId,
              field: 'name',
              content: layer.name || `Layer ${layerIndex + 1}`,
              type: 'name'
            });
          });
        }
      });
    } else {
      console.log('🔍 No items found in projectJson');
      addLog(`🔍 Debug: No items found in project JSON - empty project or export issue`);
    }
    
    console.log('🔍 Final graph data:', { 
      nodes: nodes.length, 
      edges: edges.length, 
      embedding_content: embedding_content.length 
    });
    console.log('🔍 All nodes:', nodes);
    console.log('🔍 All edges:', edges);
    
    addLog(`🔍 Debug: Final graph - ${nodes.length} nodes, ${edges.length} edges created`);
    
    return {
      nodes,
      edges,
      embedding_content,
      stats: {
        total_nodes: nodes.length,
        total_edges: edges.length,
        embedding_entries: embedding_content.length
      }
    };
  };


  const drawGraph = (ctx: CanvasRenderingContext2D, data: GraphData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter nodes based on current filter
    const filteredNodes = data.nodes.filter(node => {
      if (filterType === 'all') return true;
      return node.type === filterType;
    });

    // Calculate layout
    const layout = calculateLayout(filteredNodes, data.edges, viewMode);
    
    // Draw edges first
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    data.edges.forEach(edge => {
      const fromNode = layout.find(n => n.id === edge.from);
      const toNode = layout.find(n => n.id === edge.to);
      
      if (fromNode && toNode && fromNode.position && toNode.position) {
        ctx.beginPath();
        ctx.moveTo(fromNode.position.x, fromNode.position.y);
        ctx.lineTo(toNode.position.x, toNode.position.y);
        ctx.stroke();

        // Draw edge type label
        const midX = (fromNode.position.x + toNode.position.x) / 2;
        const midY = (fromNode.position.y + toNode.position.y) / 2;
        ctx.fillStyle = '#999';
        ctx.font = '10px Arial';
        ctx.fillText(edge.type, midX, midY);
      }
    });

    // Draw nodes
    layout.forEach(node => {
      if (!node.position) return;
      
      const radius = getNodeRadius(node.type);
      const color = getNodeColor(node.type);
      
      // Draw node circle
      ctx.fillStyle = node.selected ? '#ff6b6b' : color;
      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw node border
      ctx.strokeStyle = node.selected ? '#ff0000' : '#333';
      ctx.lineWidth = node.selected ? 3 : 1;
      ctx.stroke();
      
      // Draw node label
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        node.properties.name || node.id, 
        node.position.x, 
        node.position.y + radius + 15
      );
    });
  };

  const calculateLayout = (nodes: GraphNode[], edges: GraphEdge[], mode: string): GraphNode[] => {
    const canvas = canvasRef.current;
    if (!canvas) return nodes;

    const width = canvas.width;
    const height = canvas.height;

    switch (mode) {
      case 'hierarchy':
        return calculateHierarchicalLayout(nodes, edges, width, height);
      case 'dependencies':
        return calculateForceDirectedLayout(nodes, edges, width, height);
      default:
        return calculateCircularLayout(nodes, width, height);
    }
  };

  const calculateCircularLayout = (nodes: GraphNode[], width: number, height: number): GraphNode[] => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    return nodes.map((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      return {
        ...node,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        }
      };
    });
  };

  const calculateHierarchicalLayout = (nodes: GraphNode[], edges: GraphEdge[], width: number, height: number): GraphNode[] => {
    // Group nodes by type hierarchy
    const levels: { [key: string]: GraphNode[] } = {
      'Project': [],
      'Composition': [],
      'Layer': [],
      'Property': []
    };

    nodes.forEach(node => {
      if (node.type === 'Project') levels['Project'].push(node);
      else if (node.type === 'Composition' || node.type === 'FootageItem' || node.type === 'ProjectFolder') levels['Composition'].push(node);
      else if (node.type.includes('Layer')) levels['Layer'].push(node);
      else levels['Property'].push(node);
    });

    const result: GraphNode[] = [];
    const levelKeys = Object.keys(levels);
    const levelHeight = height / levelKeys.length;

    levelKeys.forEach((levelKey, levelIndex) => {
      const levelNodes = levels[levelKey];
      const nodeWidth = width / (levelNodes.length + 1);

      levelNodes.forEach((node, nodeIndex) => {
        result.push({
          ...node,
          position: {
            x: (nodeIndex + 1) * nodeWidth,
            y: (levelIndex + 0.5) * levelHeight
          }
        });
      });
    });

    return result;
  };

  const calculateForceDirectedLayout = (nodes: GraphNode[], edges: GraphEdge[], width: number, height: number): GraphNode[] => {
    // Simple force-directed layout simulation
    const result = nodes.map(node => ({
      ...node,
      position: {
        x: Math.random() * width,
        y: Math.random() * height
      }
    }));

    // Run simple spring simulation
    for (let iteration = 0; iteration < 50; iteration++) {
      result.forEach(node => {
        let fx = 0, fy = 0;

        // Repulsion from other nodes
        result.forEach(other => {
          if (node.id !== other.id && node.position && other.position) {
            const dx = node.position.x - other.position.x;
            const dy = node.position.y - other.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 1000 / (distance * distance);
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
          }
        });

        // Attraction from connected nodes
        edges.forEach(edge => {
          if (edge.from === node.id || edge.to === node.id) {
            const otherId = edge.from === node.id ? edge.to : edge.from;
            const other = result.find(n => n.id === otherId);
            if (other && other.position && node.position) {
              const dx = other.position.x - node.position.x;
              const dy = other.position.y - node.position.y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = distance * 0.01;
              fx += (dx / distance) * force;
              fy += (dy / distance) * force;
            }
          }
        });

        // Update position
        if (node.position) {
          node.position.x += fx * 0.01;
          node.position.y += fy * 0.01;
          
          // Keep within bounds
          node.position.x = Math.max(50, Math.min(width - 50, node.position.x));
          node.position.y = Math.max(50, Math.min(height - 50, node.position.y));
        }
      });
    }

    return result;
  };

  const getNodeRadius = (type: string): number => {
    switch (type) {
      case 'Project': return 25;
      case 'Composition': return 20;
      case 'FootageItem': return 15;
      case 'TextLayer':
      case 'ShapeLayer':
      case 'AVLayer': return 12;
      default: return 8;
    }
  };

  const getNodeColor = (type: string): string => {
    switch (type) {
      case 'Project': return '#ff6b6b';
      case 'Composition': return '#4ecdc4';
      case 'FootageItem': return '#45b7d1';
      case 'TextLayer': return '#f9ca24';
      case 'ShapeLayer': return '#6c5ce7';
      case 'AVLayer': return '#a0e7e5';
      case 'Effect': return '#fd79a8';
      case 'Property': return '#fdcb6e';
      default: return '#b2bec3';
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !graphData) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked node
    const layout = calculateLayout(graphData.nodes, graphData.edges, viewMode);
    const clickedNode = layout.find(node => {
      if (!node.position) return false;
      const radius = getNodeRadius(node.type);
      const distance = Math.sqrt(
        Math.pow(x - node.position.x, 2) + Math.pow(y - node.position.y, 2)
      );
      return distance <= radius;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      addLog(`🎯 Selected: ${clickedNode.properties.name || clickedNode.id} (${clickedNode.type})`);
      
      // Update node selection for redraw
      const updatedNodes = graphData.nodes.map(node => ({
        ...node,
        selected: node.id === clickedNode.id
      }));
      setGraphData({ ...graphData, nodes: updatedNodes });
    }
  };

  const getUniqueNodeTypes = (): string[] => {
    if (!graphData) return [];
    const typeSet = new Set(graphData.nodes.map(node => node.type));
    const types = Array.from(typeSet);
    return ['all', ...types];
  };

  const getFilteredStats = () => {
    if (!graphData) return null;
    
    const filteredNodes = graphData.nodes.filter(node => 
      filterType === 'all' || node.type === filterType
    );
    
    return {
      nodes: filteredNodes.length,
      edges: graphData.edges.filter(edge => 
        filteredNodes.some(n => n.id === edge.from) && 
        filteredNodes.some(n => n.id === edge.to)
      ).length
    };
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    addLog(`📂 Loading graph file: ${file.name}`);
    
    try {
      const text = await file.text();
      const uploadedData = JSON.parse(text);
      
      // Validate the uploaded data structure
      if (uploadedData.nodes && uploadedData.edges) {
        setGraphData(uploadedData);
        addLog(`✅ Graph loaded successfully: ${uploadedData.nodes.length} nodes, ${uploadedData.edges.length} edges`);
        dispatch(setStatus('Graph loaded from file'));
      } else if (uploadedData.project || uploadedData.items) {
        // If it's a project JSON, convert it
        setProjectJson(uploadedData);
        addLog(`📄 Project JSON loaded, converting to graph...`);
        await convertJsonToGraph();
      } else {
        throw new Error('Invalid file format. Expected graph JSON with nodes/edges or project JSON.');
      }
    } catch (error) {
      addLog(`❌ Failed to load file: ${error}`);
      dispatch(setStatus('File load failed'));
    }
    
    // Clear the file input
    event.target.value = '';
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatProcessing) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setIsChatProcessing(true);

    // Add user message
    setChatMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    try {
      // Send to autonomous agent with graph navigation capabilities
      const response = await fetch('http://localhost:3002/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Based on the project graph data, please answer this question: ${userMessage}`,
          useGraphNavigation: true,
          projectData: graphData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response reader available');

      let assistantResponse = '';
      
      // Add initial assistant message
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      // Stream the response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantResponse += data.content;
                
                // Update the last message
                setChatMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: assistantResponse
                  };
                  return updated;
                });
              }
            } catch (err) {
              // Skip invalid JSON
            }
          }
        }
      }

    } catch (error) {
      addLog(`❌ Chat error: ${error}`);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error while processing your question: ${error}`,
        timestamp: new Date()
      }]);
    }

    setIsChatProcessing(false);
  };

  return (
    <div className="tab-content">
      <div className="section">
        <h2>🕸️ Project Knowledge Graph</h2>
        <p>Visual representation of your After Effects project as an intelligent knowledge graph</p>
      </div>

      {/* Controls */}
      <div className="section">
        <div className="graph-controls">
          <button
            className="primary-btn"
            onClick={handleExportProject}
            disabled={isProcessing}
          >
            {isProcessing ? '🔄 Exporting...' : '📤 Export Project JSON'}
          </button>
          
          {projectJson && (
            <button
              className="primary-btn"
              onClick={convertJsonToGraph}
              disabled={isProcessing}
            >
              {isProcessing ? '🔄 Creating Graph...' : '🕸️ Create Graph'}
            </button>
          )}

          <div className="upload-section">
            <label className="upload-btn" htmlFor="graph-upload">
              📂 Upload Graph JSON
            </label>
            <input
              id="graph-upload"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
          
          {graphData && (
            <>
              <div className="control-group">
                <label>View Mode:</label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as any)}
                  className="control-select"
                >
                  <option value="overview">Overview</option>
                  <option value="hierarchy">Hierarchy</option>
                  <option value="dependencies">Dependencies</option>
                  <option value="semantic">Semantic</option>
                </select>
              </div>

              <div className="control-group">
                <label>Filter Type:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="control-select"
                >
                  {getUniqueNodeTypes().map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="control-group">
                <input
                  type="text"
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Graph Canvas */}
      {graphData && (
        <div className="section">
          <h3>🕸️ Interactive Graph Visualization</h3>
          <div className="graph-container">
            <canvas
              ref={canvasRef}
              className="graph-canvas"
              width={800}
              height={600}
              onClick={handleCanvasClick}
            />
          </div>
        </div>
      )}

      {/* Graph Chat Interface */}
      {graphData && (
        <div className="section">
          <h3>💬 Ask Questions About Your Project</h3>
          <p>Chat with AI about your project structure using graph navigation</p>
          
          <div className="chat-container">
            <div className="chat-messages">
              {chatMessages.length === 0 ? (
                <div className="chat-empty">
                  <p>Ask me anything about your project structure!</p>
                  <div className="example-questions">
                    <p><strong>Try asking:</strong></p>
                    <ul>
                      <li>"How many compositions are in this project?"</li>
                      <li>"What layers are in the main composition?"</li>
                      <li>"Show me all text layers"</li>
                      <li>"What effects are used in this project?"</li>
                    </ul>
                  </div>
                </div>
              ) : (
                chatMessages.map((message, index) => (
                  <div key={index} className={`chat-message ${message.role}`}>
                    <div className="chat-message-header">
                      <span className="chat-role">
                        {message.role === 'user' ? '👤 You' : '🤖 AI Assistant'}
                      </span>
                      <span className="chat-timestamp">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="chat-message-content">
                      {message.content || (message.role === 'assistant' && isChatProcessing ? '🤔 Thinking...' : '')}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={handleChatSubmit} className="chat-input-form">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your project structure..."
                className="chat-input"
                disabled={isChatProcessing}
              />
              <button
                type="submit"
                disabled={isChatProcessing || !chatInput.trim()}
                className="chat-submit"
              >
                {isChatProcessing ? '🔄' : '📤'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* JSON Data Display */}
      {projectJson && (
        <div className="section">
          <h3>📄 Exported Project JSON</h3>
          <div className="json-container">
            <pre className="json-display">{JSON.stringify(projectJson, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Graph Stats */}
      {graphData && (
        <div className="section">
          <h3>📊 Graph Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Nodes:</span>
              <span className="stat-value">{graphData.stats.total_nodes}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Edges:</span>
              <span className="stat-value">{graphData.stats.total_edges}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Embeddings:</span>
              <span className="stat-value">{graphData.stats.embedding_entries}</span>
            </div>
            {getFilteredStats() && (
              <>
                <div className="stat-item">
                  <span className="stat-label">Filtered Nodes:</span>
                  <span className="stat-value">{getFilteredStats()?.nodes}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Filtered Edges:</span>
                  <span className="stat-value">{getFilteredStats()?.edges}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="section">
          <h3>🎯 Selected Node</h3>
          <div className="node-details">
            <div className="detail-row">
              <span className="detail-label">ID:</span>
              <span className="detail-value">{selectedNode.id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Type:</span>
              <span className="detail-value">{selectedNode.type}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{selectedNode.properties.name || 'Unnamed'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Properties:</span>
              <pre className="properties-json">{JSON.stringify(selectedNode.properties, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="section">
        <div className="section-header">
          <h3>Processing Logs</h3>
          <button className="secondary-btn small" onClick={clearLogs}>Clear</button>
        </div>
        <div className="log-container">
          {logs.length === 0 ? (
            <div className="log-empty">No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="log-entry">{log}</div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .graph-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .control-group label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
        }
        
        .control-select {
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          background: white;
        }
        
        .search-input {
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          width: 200px;
        }
        
        .graph-container {
          display: flex;
          justify-content: center;
          margin: 20px 0;
          border: 2px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          background: #f9f9f9;
        }
        
        .graph-canvas {
          cursor: crosshair;
          background: white;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin: 16px 0;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #007bff;
        }
        
        .stat-label {
          font-weight: 500;
          color: #666;
        }
        
        .stat-value {
          font-weight: 600;
          color: #333;
          font-size: 18px;
        }
        
        .node-details {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        
        .detail-row {
          display: flex;
          margin-bottom: 8px;
          align-items: flex-start;
        }
        
        .detail-label {
          font-weight: 600;
          color: #495057;
          min-width: 80px;
          margin-right: 12px;
        }
        
        .detail-value {
          color: #333;
          flex: 1;
        }
        
        .properties-json {
          background: #2d3748;
          color: #e2e8f0;
          padding: 8px;
          border-radius: 4px;
          font-size: 12px;
          margin: 0;
          white-space: pre-wrap;
          max-height: 200px;
          overflow-y: auto;
          flex: 1;
        }
        
        .log-container {
          max-height: 200px;
          overflow-y: auto;
          background: #1e1e1e;
          border-radius: 6px;
          padding: 12px;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
        }
        
        .log-entry {
          color: #e6e6e6;
          margin-bottom: 4px;
          word-break: break-word;
        }
        
        .log-empty {
          color: #888;
          font-style: italic;
          text-align: center;
          padding: 20px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .primary-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .primary-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .primary-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }
        
        .secondary-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .secondary-btn:hover {
          background: #5a6268;
        }
        
        .secondary-btn.small {
          padding: 4px 8px;
          font-size: 11px;
        }
        
        .upload-section {
          display: flex;
          align-items: center;
        }
        
        .upload-btn {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-block;
        }
        
        .upload-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .json-container {
          max-height: 300px;
          overflow-y: auto;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 16px;
        }
        
        .json-display {
          margin: 0;
          background: transparent;
          border: none;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 12px;
          line-height: 1.4;
          color: #495057;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .chat-container {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          background: white;
          max-height: 500px;
          display: flex;
          flex-direction: column;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          max-height: 400px;
          min-height: 200px;
        }
        
        .chat-empty {
          text-align: center;
          color: #6c757d;
          padding: 40px 20px;
        }
        
        .example-questions {
          margin-top: 20px;
          text-align: left;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .example-questions p {
          margin-bottom: 8px;
          color: #495057;
        }
        
        .example-questions ul {
          list-style: none;
          padding: 0;
        }
        
        .example-questions li {
          background: #f8f9fa;
          margin: 4px 0;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 14px;
          color: #6c757d;
        }
        
        .chat-message {
          margin-bottom: 16px;
          max-width: 100%;
        }
        
        .chat-message.user {
          margin-left: 20%;
        }
        
        .chat-message.assistant {
          margin-right: 20%;
        }
        
        .chat-message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
          font-size: 12px;
        }
        
        .chat-role {
          font-weight: 600;
          color: #495057;
        }
        
        .chat-timestamp {
          color: #6c757d;
          font-size: 11px;
        }
        
        .chat-message-content {
          background: #f8f9fa;
          padding: 12px 16px;
          border-radius: 12px;
          line-height: 1.4;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        .chat-message.user .chat-message-content {
          background: #007bff;
          color: white;
          margin-left: auto;
        }
        
        .chat-message.assistant .chat-message-content {
          background: #e9ecef;
          color: #333;
        }
        
        .chat-input-form {
          display: flex;
          padding: 12px;
          border-top: 1px solid #e9ecef;
          background: #f8f9fa;
          border-radius: 0 0 8px 8px;
        }
        
        .chat-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 20px;
          outline: none;
          font-size: 14px;
        }
        
        .chat-input:focus {
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
        
        .chat-submit {
          margin-left: 8px;
          padding: 8px 12px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          min-width: 40px;
        }
        
        .chat-submit:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .chat-submit:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ProjectGraphTab;