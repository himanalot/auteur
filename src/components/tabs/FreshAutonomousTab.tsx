import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: string[];
  iteration?: number;
  generatedScript?: string;
  scriptFilename?: string;
  executionResult?: string;
  hasScript?: boolean;
  hasExecutionError?: boolean;
  originalScript?: string;
}

const FreshAutonomousTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [totalToolCalls, setTotalToolCalls] = useState(0);
  const [thinkingMode, setThinkingMode] = useState<'enabled' | 'disabled'>('enabled');
  
  // Video mode state
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [compLayers, setCompLayers] = useState<Array<{layerId: number, layerName: string, layerType: string, sourceName: string, hasVideo: boolean, filePath: string, width: number, height: number, duration?: number}>>([]);
  const [selectedLayers, setSelectedLayers] = useState<Array<number>>([]);
  
  // Script-related state
  const [lastGeneratedScript, setLastGeneratedScript] = useState<string>('');
  const [lastScriptFilename, setLastScriptFilename] = useState<string>('');
  const [showScriptPanel, setShowScriptPanel] = useState(false);
  const [isExecutingScript, setIsExecutingScript] = useState(false);
  const [isFixingScript, setIsFixingScript] = useState(false);
  const [editingScripts, setEditingScripts] = useState<{ [key: number]: string }>({});
  const [isEditingScript, setIsEditingScript] = useState<{ [key: number]: boolean }>({});
  
  // Manual script execution
  const [manualScript, setManualScript] = useState('// Enter your ExtendScript here\nalert("Hello from manual script!");');
  const [isExecutingManualScript, setIsExecutingManualScript] = useState(false);
  const [manualScriptResult, setManualScriptResult] = useState<string>('');
  
  // Debug console state
  const [debugLogs, setDebugLogs] = useState<Array<{timestamp: string, level: 'LOG' | 'ERROR' | 'WARN', message: string}>>([]);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const debugConsoleRef = useRef<HTMLDivElement>(null);

  // Debug logging helper
  const addDebugLog = (level: 'LOG' | 'ERROR' | 'WARN', message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, { timestamp, level, message }]);
    
    // Also log to browser console
    if (level === 'ERROR') {
      console.error(`[${timestamp}] ERROR: ${message}`);
    } else if (level === 'WARN') {
      console.warn(`[${timestamp}] WARN: ${message}`);
    } else {
      console.log(`[${timestamp}] LOG: ${message}`);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-scroll debug console
  useEffect(() => {
    if (debugConsoleRef.current) {
      debugConsoleRef.current.scrollTop = debugConsoleRef.current.scrollHeight;
    }
  }, [debugLogs]);

  const connectToAgent = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket('ws://localhost:3002');
    wsRef.current = ws;

    ws.onopen = () => {
      addDebugLog('LOG', '🤖 Connected to Fresh Autonomous Agent');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addDebugLog('LOG', `📨 Received WebSocket message: ${data.type}`);
        
        switch (data.type) {
          case 'update':
            handleUpdate(data.content);
            break;
            
          case 'tool_calls':
            handleToolCalls(data.toolCalls);
            break;
            
          case 'complete':
            handleComplete(data);
            break;
            
          case 'error':
            handleError(data.error);
            break;
            
          case 'video_content_delta':
            handleUpdate(data.content);
            break;
            
          case 'video_complete':
            handleComplete({
              content: data.content,
              model: data.model || 'gemini',
              success: true
            });
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      console.log('🤖 Disconnected from Fresh Autonomous Agent');
      setIsConnected(false);
      setIsProcessing(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      setIsProcessing(false);
    };
  };

  const handleUpdate = (content: string) => {
    // Extract iteration number from content
    const iterationMatch = content.match(/Iteration (\d+):/);
    if (iterationMatch) {
      setCurrentIteration(parseInt(iterationMatch[1]));
    }

    // Check for script generation
    const scriptInfo = extractScriptFromContent(content);
    if (scriptInfo) {
      setLastGeneratedScript(scriptInfo.script);
      setLastScriptFilename(scriptInfo.filename);
      setShowScriptPanel(true);
    }

    // Update the last assistant message or create new one
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      
      if (lastMessage && lastMessage.role === 'assistant') {
        // Update existing assistant message
        return [
          ...prev.slice(0, -1),
          {
            ...lastMessage,
            content: content,
            iteration: currentIteration,
            generatedScript: scriptInfo?.script,
            scriptFilename: scriptInfo?.filename,
            hasScript: !!scriptInfo
          }
        ];
      } else {
        // Create new assistant message
        return [
          ...prev,
          {
            role: 'assistant',
            content: content,
            timestamp: new Date(),
            iteration: currentIteration,
            generatedScript: scriptInfo?.script,
            scriptFilename: scriptInfo?.filename,
            hasScript: !!scriptInfo
          }
        ];
      }
    });
  };

  const handleToolCalls = (toolCalls: string[]) => {
    setTotalToolCalls(prev => prev + toolCalls.length);
    
    // Add tool call info to the last message
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        return [
          ...prev.slice(0, -1),
          {
            ...lastMessage,
            toolCalls: [...(lastMessage.toolCalls || []), ...toolCalls]
          }
        ];
      }
      return prev;
    });
  };

  const handleComplete = (data: any) => {
    console.log('🤖 Autonomous task completed:', data);
    setIsProcessing(false);
    setCurrentIteration(0);
    
    // Ensure final response is shown
    if (data.response) {
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMessage,
              content: data.response
            }
          ];
        }
        return prev;
      });
    }
  };

  const handleError = (error: string) => {
    console.error('🤖 Autonomous agent error:', error);
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: `❌ Error: ${error}`,
        timestamp: new Date()
      }
    ]);
    setIsProcessing(false);
    setCurrentIteration(0);
  };

  // Script handling functions
  const extractScriptFromContent = (content: string): { script: string; filename: string } | null => {
    // Look for JavaScript code blocks that look like ExtendScript
    const codeBlockPattern = /```(?:javascript|jsx?)?\n([\s\S]*?)\n```/g;
    const matches: RegExpMatchArray[] = [];
    let match;
    
    // Use traditional regex matching instead of matchAll for compatibility
    while ((match = codeBlockPattern.exec(content)) !== null) {
      matches.push(match);
    }
    
    // Find the largest code block that contains ExtendScript-like content
    let bestScript = '';
    let bestFilename = 'generated_script';
    
    for (const match of matches) {
      const script = match[1];
      if (script.includes('app.') || script.includes('$.') || script.includes('beginUndoGroup')) {
        if (script.length > bestScript.length) {
          bestScript = script;
          
          // Try to extract filename from content
          const filenameMatch = content.match(/filename[:\s]*["']?([^"'\s]+)["']?/i);
          if (filenameMatch) {
            bestFilename = filenameMatch[1].replace('.jsx', '');
          } else {
            // Generate filename from content
            const taskMatch = content.match(/(?:create|generate|build|make)\s+(.{1,30})/i);
            if (taskMatch) {
              bestFilename = taskMatch[1].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            }
          }
        }
      }
    }
    
    return bestScript ? { script: bestScript, filename: bestFilename } : null;
  };

  const executeScript = async (script: string, filename: string) => {
    if (!script.trim()) return;
    
    setIsExecutingScript(true);
    try {
      console.log('🚀 Executing script in After Effects:', filename);
      
      // Use the same executeScriptSilent pattern as the Original Script Generator
      const startTime = Date.now();
      let result: string;
      
      // Debug: Check what's available
      console.log('🔍 Checking available functions:', {
        window: typeof window !== 'undefined',
        executeScriptSilent: typeof (window as any).executeScriptSilent,
        CSInterface: typeof (window as any).CSInterface,
        scriptGenerator: typeof (window as any).scriptGenerator,
        originalScriptGenerator: typeof (window as any).originalScriptGenerator
      });
      
      if (typeof window !== 'undefined' && (window as any).executeScriptSilent) {
        console.log('✅ Using executeScriptSilent function');
        result = await (window as any).executeScriptSilent(script);
        console.log('🎬 Script execution result:', result);
      } else {
        console.warn('⚠️ executeScriptSilent not available, trying direct CSInterface');
        
        // Fallback to direct CSInterface if executeScriptSilent is not available
        if (typeof (window as any).CSInterface !== 'undefined') {
          const csInterface = new (window as any).CSInterface();
          result = await new Promise<string>((resolve) => {
            csInterface.evalScript(script, (evalResult: string) => {
              console.log('🎬 Direct CSInterface result:', evalResult);
              
              if (evalResult === 'EvalScript error.') {
                resolve('{"success": false, "message": "ExtendScript evaluation error - check script syntax"}');
              } else if (!evalResult || evalResult.trim() === '') {
                resolve('{"success": true, "message": "Script executed successfully (no return value)"}');
              } else {
                // Try to parse the result - if it's valid JSON, use it; otherwise treat as success message
                try {
                  const parsed = JSON.parse(evalResult);
                  resolve(evalResult); // Return the raw JSON string
                } catch (e) {
                  // Not JSON, treat as success message
                  resolve(`{"success": true, "message": "Script completed: ${evalResult}"}`);
                }
              }
            });
          });
        } else {
          throw new Error('Neither executeScriptSilent nor CSInterface available - extension may not be properly loaded');
        }
      }
      
      const executionTime = Date.now() - startTime;
      
      // Try to parse the result to see if it's a JSON response
      let parsedResult;
      try {
        parsedResult = JSON.parse(result);
      } catch (e) {
        // Not JSON, treat as plain text
        parsedResult = { success: true, message: result || 'Script executed successfully' };
      }
      
      if (parsedResult.success === false) {
        // Handle as error with enhanced logging display
        let errorMsg = `❌ Script "${filename}" failed!\n\nError: ${parsedResult.message}\nExecution time: ${executionTime}ms`;
        
        // Include execution log if available
        if (parsedResult.executionLog) {
          errorMsg += `\n\n📋 Execution Log:\n${parsedResult.executionLog}`;
        }
        
        // Include timestamp if available
        if (parsedResult.timestamp) {
          errorMsg += `\n⏰ Completed at: ${parsedResult.timestamp}`;
        }
        
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                executionResult: errorMsg,
                hasExecutionError: true,
                originalScript: script
              }
            ];
          }
          return prev;
        });
      } else {
        // Handle as success with enhanced logging display
        let successMsg = `Result: ${parsedResult.message || 'Script completed successfully'}\nExecution time: ${executionTime}ms`;
        
        // Include execution log if available (this will show all the $.writeln progress)
        if (parsedResult.executionLog) {
          successMsg += `\n\n📋 Execution Log:\n${parsedResult.executionLog}`;
        }
        
        // Include timestamp if available
        if (parsedResult.timestamp) {
          successMsg += `\n⏰ Completed at: ${parsedResult.timestamp}`;
        }
        
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                executionResult: successMsg,
                hasExecutionError: false
              }
            ];
          }
          return prev;
        });
      }
      
    } catch (error) {
      console.error('Script execution failed:', error);
      const errorMsg = `Script execution failed: ${error}`;
      
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMessage,
              executionResult: errorMsg,
              hasExecutionError: true,
              originalScript: script
            }
          ];
        }
        return prev;
      });
    } finally {
      setIsExecutingScript(false);
    }
  };

  const executeManualScript = async () => {
    if (!manualScript.trim()) return;
    
    setIsExecutingManualScript(true);
    setManualScriptResult('');
    
    try {
      console.log('🚀 Executing manual script');
      
      // Use the same script execution logic as the main executeScript function
      const startTime = Date.now();
      let result: string;
      
      // Debug: Check what's available
      console.log('🔍 Manual script - checking available functions:', {
        window: typeof window !== 'undefined',
        executeScriptSilent: typeof (window as any).executeScriptSilent,
        CSInterface: typeof (window as any).CSInterface,
        scriptGenerator: typeof (window as any).scriptGenerator,
        originalScriptGenerator: typeof (window as any).originalScriptGenerator
      });
      
      if (typeof window !== 'undefined' && (window as any).executeScriptSilent) {
        console.log('✅ Using executeScriptSilent function');
        result = await (window as any).executeScriptSilent(manualScript);
        console.log('🎬 Manual script execution result:', result);
      } else {
        console.warn('⚠️ executeScriptSilent not available, trying direct CSInterface');
        
        // Fallback to direct CSInterface if executeScriptSilent is not available
        if (typeof (window as any).CSInterface !== 'undefined') {
          const csInterface = new (window as any).CSInterface();
          result = await new Promise<string>((resolve) => {
            csInterface.evalScript(manualScript, (evalResult: string) => {
              console.log('🎬 Direct CSInterface result:', evalResult);
              
              if (evalResult === 'EvalScript error.') {
                resolve('{"success": false, "message": "ExtendScript evaluation error - check script syntax"}');
              } else if (!evalResult || evalResult.trim() === '') {
                resolve('{"success": true, "message": "Script executed successfully (no return value)"}');
              } else {
                // Try to parse the result - if it's valid JSON, use it; otherwise treat as success message
                try {
                  const parsed = JSON.parse(evalResult);
                  resolve(evalResult); // Return the raw JSON string
                } catch (e) {
                  // Not JSON, treat as success message
                  resolve(`{"success": true, "message": "Script completed: ${evalResult}"}`);
                }
              }
            });
          });
        } else {
          throw new Error('Neither executeScriptSilent nor CSInterface available - extension may not be properly loaded');
        }
      }
      
      const executionTime = Date.now() - startTime;
      
      // Try to parse the result to see if it's a JSON response
      let parsedResult;
      try {
        parsedResult = JSON.parse(result);
      } catch (e) {
        // Not JSON, treat as plain text
        parsedResult = { success: true, message: result || 'Script executed successfully' };
      }
      
      if (parsedResult.success === false) {
        let errorMsg = `❌ Script failed!\n\nError: ${parsedResult.message}\nExecution time: ${executionTime}ms`;
        
        // Include execution log if available
        if (parsedResult.executionLog) {
          errorMsg += `\n\n📋 Execution Log:\n${parsedResult.executionLog}`;
        }
        
        // Include timestamp if available
        if (parsedResult.timestamp) {
          errorMsg += `\n⏰ Completed at: ${parsedResult.timestamp}`;
        }
        
        setManualScriptResult(errorMsg);
      } else {
        let successMsg = `Result: ${parsedResult.message || 'Script completed successfully'}\nExecution time: ${executionTime}ms`;
        
        // Include execution log if available (this will show all the $.writeln progress)
        if (parsedResult.executionLog) {
          successMsg += `\n\n📋 Execution Log:\n${parsedResult.executionLog}`;
        }
        
        // Include timestamp if available
        if (parsedResult.timestamp) {
          successMsg += `\n⏰ Completed at: ${parsedResult.timestamp}`;
        }
        
        setManualScriptResult(successMsg);
      }
      
    } catch (error) {
      console.error('Manual script execution failed:', error);
      setManualScriptResult(`❌ Script execution failed: ${error}`);
    } finally {
      setIsExecutingManualScript(false);
    }
  };

  const downloadScript = (script: string, filename: string) => {
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.jsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Script editing functions
  const toggleScriptEdit = (messageIndex: number, currentScript: string) => {
    setIsEditingScript(prev => ({
      ...prev,
      [messageIndex]: !prev[messageIndex]
    }));
    
    // Initialize editing content if starting to edit
    if (!isEditingScript[messageIndex]) {
      setEditingScripts(prev => ({
        ...prev,
        [messageIndex]: currentScript
      }));
    }
  };

  const updateEditingScript = (messageIndex: number, newScript: string) => {
    setEditingScripts(prev => ({
      ...prev,
      [messageIndex]: newScript
    }));
  };

  const saveEditedScript = (messageIndex: number) => {
    const editedScript = editingScripts[messageIndex];
    if (!editedScript) return;

    // Update the message with the edited script
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages[messageIndex] && newMessages[messageIndex].role === 'assistant') {
        newMessages[messageIndex] = {
          ...newMessages[messageIndex],
          generatedScript: editedScript
        };
      }
      return newMessages;
    });

    // Exit edit mode
    setIsEditingScript(prev => ({
      ...prev,
      [messageIndex]: false
    }));
  };

  const cancelEditScript = (messageIndex: number) => {
    setIsEditingScript(prev => ({
      ...prev,
      [messageIndex]: false
    }));
    
    // Clear the editing content
    setEditingScripts(prev => {
      const newState = { ...prev };
      delete newState[messageIndex];
      return newState;
    });
  };

  const undoAndFix = async (failedScript: string, errorMessage: string, messageIndex: number) => {
    if (!isConnected || isProcessing || isFixingScript) return;

    setIsFixingScript(true);
    
    try {
      // Step 1: Perform undo (Cmd+Z) via CSInterface
      console.log('🔄 Performing undo...');
      
      await new Promise<void>((resolve, reject) => {
        // Check if CSInterface is available
        if (typeof (window as any).CSInterface === 'undefined') {
          reject(new Error('CSInterface not available - extension not running in After Effects'));
          return;
        }
        
        const csInterface = new (window as any).CSInterface();
        
        // Execute undo command
        const undoScript = 'app.executeCommand(16); // Undo command ID';
        csInterface.evalScript(undoScript, (result: string) => {
          if (result.startsWith('EvalScript error')) {
            console.warn('Undo command may have failed:', result);
          } else {
            console.log('✅ Undo completed');
          }
          resolve(); // Continue even if undo has issues
        });
      });
      
      // Step 2: Get conversation context and build fix request
      const conversationContext = messages.slice(0, messageIndex + 1)
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');
      
      // Extract execution logs from error message if available
      const executionLogMatch = errorMessage.match(/📋 Execution Log:\n(.*?)(?:\n⏰|$)/s);
      const executionLogs = executionLogMatch ? executionLogMatch[1] : 'No execution logs captured';
      
      const fixRequest = `The script you generated had an execution error. Please fix it.

CONVERSATION CONTEXT:
${conversationContext}

FAILED SCRIPT:
\`\`\`javascript
${failedScript}
\`\`\`

EXECUTION LOGS (what the script actually did):
${executionLogs}

FULL ERROR MESSAGE:
${errorMessage}

Please analyze the execution logs to see what the script accomplished before failing, then fix the specific error. Use the execution logs to understand where the script stopped working and provide a corrected version that will complete successfully.`;

      // Step 3: Send fix request to the autonomous agent
      const fixMessage: Message = {
        role: 'user',
        content: fixRequest,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fixMessage]);
      setIsProcessing(true);
      setCurrentIteration(1);
      setTotalToolCalls(0);

      // Send to autonomous agent
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'run_autonomous',
          userMessage: fixRequest,
          thinkingMode: thinkingMode
        }));
      }
      
    } catch (error) {
      console.error('Undo and fix failed:', error);
      alert(`Undo and fix failed: ${error}`);
    } finally {
      setIsFixingScript(false);
    }
  };

  // Composition layer handling  
  const loadCompLayers = async () => {
    try {
      addDebugLog('LOG', '🎬 Loading ALL layers from active composition...');
      
      // Initialize CEP interface if not already done
      if (!(window as any).csInterface) {
        addDebugLog('LOG', '🔌 Initializing CEP interface...');
        (window as any).csInterface = new (window as any).CSInterface();
      }
      
      // Test basic ExtendScript first
      addDebugLog('LOG', '🔧 Testing basic ExtendScript function...');
      const testResponse = await new Promise<string>((resolve, reject) => {
        (window as any).csInterface.evalScript('typeof executeAITool', (result: string) => {
          addDebugLog('LOG', `📋 executeAITool type check: ${result}`);
          resolve(result);
        });
      });
      
      if (testResponse !== 'function') {
        addDebugLog('ERROR', `❌ executeAITool function not available: ${testResponse}`);
        throw new Error('executeAITool function not loaded - ExtendScript may not be initialized');
      }
      
      // Execute the get_all_comp_layers tool
      addDebugLog('LOG', '🔧 Calling executeAITool with get_all_comp_layers...');
      const response = await new Promise<string>((resolve, reject) => {
        (window as any).csInterface.evalScript('executeAITool("get_all_comp_layers", {})', (result: string) => {
          addDebugLog('LOG', `📋 Raw executeAITool result: ${JSON.stringify(result)}`);
          if (result === 'EvalScript error.') {
            reject(new Error('ExtendScript evaluation error'));
          } else if (!result || result.trim() === '') {
            reject(new Error('Empty response from ExtendScript'));
          } else {
            resolve(result);
          }
        });
      });
      addDebugLog('LOG', `📋 Raw response from AE: ${response}`);
      
      const result = JSON.parse(response);
      addDebugLog('LOG', `📊 Parsed result: ${JSON.stringify(result)}`);
      
      if (result.success) {
        setCompLayers(result.data.layers);
        addDebugLog('LOG', `✅ Found ${result.data.totalLayers} layers in composition "${result.data.compName}"`);
      } else {
        addDebugLog('ERROR', `❌ Failed to load composition layers: ${result.message}`);
        setCompLayers([]);
      }
    } catch (error) {
      addDebugLog('ERROR', `❌ Error loading composition layers: ${error}`);
      setCompLayers([]);
    }
  };

  const toggleLayerSelection = (layerId: number) => {
    setSelectedLayers(prev => {
      if (prev.includes(layerId)) {
        return prev.filter(id => id !== layerId);
      } else {
        return [...prev, layerId];
      }
    });
  };

  // Load composition layers when entering video mode
  useEffect(() => {
    if (isVideoMode) {
      loadCompLayers();
    }
  }, [isVideoMode]);

  const sendMessage = async () => {
    if (!input.trim() || isProcessing || !isConnected) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setCurrentIteration(1);
    setTotalToolCalls(0);

    // Send to autonomous agent
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      if (isVideoMode && selectedLayers.length > 0) {
        // Get selected layer data
        const selectedLayerData = compLayers.filter(layer => selectedLayers.includes(layer.layerId));
        
        addDebugLog('LOG', `🎥 Sending Gemini video understanding message with ${selectedLayers.length} selected layers`);
        
        // Send message with composition layer data to Gemini video service
        wsRef.current.send(JSON.stringify({
          type: 'project_video_chat',
          message: userMessage.content,
          videoFiles: selectedLayerData.map(layer => ({
            id: layer.layerId,
            name: layer.layerName,
            width: layer.width,
            height: layer.height,
            duration: layer.duration || 0,
            filePath: layer.filePath,
            hasVideo: layer.hasVideo,
            layerType: layer.layerType,
            sourceName: layer.sourceName
          })),
          model: 'gemini'
        }));
      } else {
        addDebugLog('LOG', `💬 Sending text chat message: "${userMessage.content}"`);
        
        // Send regular text message
        wsRef.current.send(JSON.stringify({
          type: 'run_autonomous',
          userMessage: userMessage.content,
          thinkingMode: thinkingMode
        }));
      }
    } else {
      addDebugLog('ERROR', '❌ WebSocket not connected when trying to send message');
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentIteration(0);
    setTotalToolCalls(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    connectToAgent();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="tab-content">
      <div className="fresh-autonomous-container">
        {/* Header */}
        <div className="fresh-autonomous-header">
          <h3>🤖 Fresh Autonomous Agent</h3>
          
          {/* Chat Mode Toggle */}
          <div className="chat-mode-toggle" style={{marginBottom: '12px'}}>
            <button 
              className={`mode-toggle-btn ${!isVideoMode ? 'active' : ''}`}
              onClick={() => setIsVideoMode(false)}
              disabled={isProcessing}
            >
              💬 Text Chat
            </button>
            <button 
              className={`mode-toggle-btn ${isVideoMode ? 'active' : ''}`}
              onClick={() => setIsVideoMode(true)}
              disabled={isProcessing}
            >
              🎥 Video Understanding
            </button>
          </div>

          {/* Composition Layer Selection */}
          {isVideoMode && (
            <div className="video-selection-area" style={{marginBottom: '16px'}}>
              {compLayers.length === 0 ? (
                <div className="no-videos-message">
                  <div className="upload-icon">🎬</div>
                  <div className="upload-text">
                    <div className="upload-primary">No layers found in active composition</div>
                    <div className="upload-secondary">Open a composition first</div>
                  </div>
                  <button 
                    onClick={loadCompLayers}
                    className="refresh-videos-btn"
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      background: 'rgba(52, 152, 219, 0.2)',
                      border: '1px solid rgba(52, 152, 219, 0.5)',
                      color: '#3498db',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Refresh
                  </button>
                </div>
              ) : (
                <div className="project-videos-list" style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  padding: '8px'
                }}>
                  <div className="project-videos-header" style={{
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: '#333'
                  }}>
                    <span>🎬 All Layers ({compLayers.length}) - Select any layers to analyze:</span>
                  </div>
                  {compLayers.map(layer => (
                    <div 
                      key={layer.layerId} 
                      className={`project-video-item ${selectedLayers.includes(layer.layerId) ? 'selected' : ''}`}
                      onClick={() => toggleLayerSelection(layer.layerId)}
                      style={{
                        cursor: 'pointer',
                        background: selectedLayers.includes(layer.layerId) 
                          ? 'rgba(52, 152, 219, 0.2)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        border: selectedLayers.includes(layer.layerId) 
                          ? '1px solid #3498db' 
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '8px',
                        marginBottom: '4px',
                        borderRadius: '4px',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div className="video-info" style={{ flex: 1 }}>
                        <span className="video-name" style={{
                          display: 'block',
                          fontWeight: 'bold',
                          color: '#333',
                          marginBottom: '2px'
                        }}>
                          {layer.hasVideo && '🎥 '}
                          {layer.layerType === 'Text Layer' && '📝 '}
                          {layer.layerType === 'Shape Layer' && '🔺 '}
                          {layer.layerType === 'Camera Layer' && '📹 '}
                          {layer.layerType === 'Light Layer' && '💡 '}
                          {layer.layerName}
                        </span>
                        <span className="video-details" style={{
                          display: 'block',
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          {layer.layerType} • {layer.sourceName && `${layer.sourceName} • `}{layer.width > 0 && `${layer.width} × ${layer.height}`}
                        </span>
                      </div>
                      <div className="selection-indicator" style={{
                        fontSize: '18px',
                        color: selectedLayers.includes(layer.layerId) ? '#3498db' : '#999',
                        marginLeft: '8px'
                      }}>
                        {selectedLayers.includes(layer.layerId) ? '✓' : '○'}
                      </div>
                    </div>
                  ))}
                  {selectedLayers.length > 0 && (
                    <div className="selected-count" style={{
                      marginTop: '8px',
                      padding: '4px 8px',
                      background: 'rgba(52, 152, 219, 0.1)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#3498db'
                    }}>
                      {selectedLayers.length} layer{selectedLayers.length !== 1 ? 's' : ''} selected for analysis
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="controls-row">
            <div className="thinking-mode-controls">
              <label>Thinking Mode:</label>
              <select 
                value={thinkingMode} 
                onChange={(e) => setThinkingMode(e.target.value as 'enabled' | 'disabled')}
                disabled={isProcessing}
              >
                <option value="enabled">🧠 Extended Thinking (with interleaved)</option>
                <option value="disabled">⚡ Standard (interleaved only)</option>
              </select>
            </div>
            <div className="status-bar">
              <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </span>
              {isProcessing && (
                <span className="processing-status">
                  ⚡ Iteration {currentIteration} | {totalToolCalls} tool calls
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-container" ref={messagesRef}>
          {messages.length === 0 && (
            <div className="welcome-message">
              <h4>🤖 Fresh Autonomous Agent</h4>
              <p>This agent runs continuously until it naturally completes your task.</p>
              <p>It shows its logical reasoning pathway as it works.</p>
              <p>Ask it anything about After Effects ExtendScript!</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-header">
                <strong>
                  {message.role === 'user' ? '👤 You' : '🤖 Autonomous Agent'}
                </strong>
                {message.iteration && (
                  <span className="iteration-badge">Iteration {message.iteration}</span>
                )}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <span className="tool-calls-badge">
                    🔧 {message.toolCalls.length} tool calls
                  </span>
                )}
                <span className="timestamp">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              
              <div className="message-content">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: message.content.replace(/\n/g, '<br>') 
                  }} 
                />
                
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="tool-calls-list">
                    <strong>🔧 Tool Calls:</strong>
                    <ul>
                      {message.toolCalls.map((call, i) => (
                        <li key={i}>{call}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Script Controls */}
                {message.hasScript && message.generatedScript && (
                  <div className="script-controls">
                    <div className="script-header">
                      <strong>📜 Generated Script: {message.scriptFilename || 'script'}.jsx</strong>
                    </div>
                    
                    <div className="script-preview">
                      <pre className="script-code">
                        {message.generatedScript.substring(0, 200)}
                        {message.generatedScript.length > 200 && '...'}
                      </pre>
                    </div>
                    
                    <div className="script-actions">
                      <button
                        onClick={() => executeScript(message.generatedScript!, message.scriptFilename!)}
                        disabled={isExecutingScript}
                        className="execute-script-btn"
                        title="Execute script in After Effects"
                      >
                        {isExecutingScript ? '⚡ Executing...' : '🚀 Execute Script'}
                      </button>
                      
                      <button
                        onClick={() => downloadScript(message.generatedScript!, message.scriptFilename!)}
                        className="download-script-btn"
                        title="Download script file"
                      >
                        💾 Download .jsx
                      </button>
                      
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(message.generatedScript!);
                          alert('Script copied to clipboard!');
                        }}
                        className="copy-script-btn"
                        title="Copy script to clipboard"
                      >
                        📋 Copy Script
                      </button>
                      
                      {message.hasExecutionError && message.originalScript && (
                        <button
                          onClick={() => undoAndFix(
                            message.originalScript!, 
                            message.executionResult!, 
                            index
                          )}
                          disabled={isFixingScript || isProcessing}
                          className="undo-fix-btn"
                          title="Undo changes and request a fixed version from AI"
                        >
                          {isFixingScript ? '🔄 Fixing...' : '↩️ Undo & Fix'}
                        </button>
                      )}
                    </div>
                    
                    {message.executionResult && (
                      <div className="execution-result">
                        <strong>📊 Execution Result:</strong>
                        <pre className="result-output">{message.executionResult}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="input-container">
          <div className="input-row">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isConnected 
                  ? "Ask the autonomous agent anything about After Effects..."
                  : "Connecting to autonomous agent..."
              }
              disabled={!isConnected || isProcessing}
              rows={3}
              className="message-input"
            />
            
            <div className="button-group">
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isProcessing || !isConnected}
                className="send-btn"
                title="Send message (Enter)"
              >
                {isProcessing ? '⚡' : '🚀'}
              </button>
              
              <button
                onClick={clearChat}
                disabled={isProcessing}
                className="clear-btn"
                title="Clear chat"
              >
                🗑️
              </button>
              
              <button
                onClick={connectToAgent}
                disabled={isConnected}
                className="connect-btn"
                title="Reconnect"
              >
                🔌
              </button>
            </div>
          </div>
        </div>

        {/* Manual Script Execution Section - Now below chat */}
        <div className="manual-script-section">
          <h4>🎬 Manual Script Execution</h4>
          <div className="manual-script-content">
            <textarea
              value={manualScript}
              onChange={(e) => setManualScript(e.target.value)}
              placeholder="Enter your ExtendScript here..."
              rows={6}
              className="manual-script-textarea"
            />
            <div className="manual-script-buttons">
              <button
                onClick={executeManualScript}
                disabled={isExecutingManualScript || !manualScript.trim()}
                className="manual-script-btn execute-btn"
              >
                {isExecutingManualScript ? '⏳ Running...' : '▶️ Run Script'}
              </button>
              <button
                onClick={() => {
                  setManualScript('');
                  setManualScriptResult('');
                }}
                className="manual-script-btn clear-btn"
              >
                🗑️ Clear
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(manualScript);
                }}
                disabled={!manualScript.trim()}
                className="manual-script-btn copy-btn"
              >
                📋 Copy
              </button>
            </div>
            {manualScriptResult && (
              <div className="manual-script-result">
                {manualScriptResult}
              </div>
            )}
          </div>
        </div>

        {/* Debug Console */}
        <div className="debug-console-section">
          <div className="debug-console-header">
            <h4>🐛 Debug Console</h4>
            <div className="debug-console-controls">
              <button
                onClick={() => setShowDebugConsole(!showDebugConsole)}
                className="debug-toggle-btn"
              >
                {showDebugConsole ? '📄 Hide' : '📄 Show'}
              </button>
              <button
                onClick={() => setDebugLogs([])}
                className="debug-clear-btn"
                disabled={debugLogs.length === 0}
              >
                🗑️ Clear
              </button>
              <button
                onClick={() => {
                  const logsText = debugLogs.map(log => `[${log.timestamp}] ${log.level}: ${log.message}`).join('\n');
                  navigator.clipboard.writeText(logsText);
                  addDebugLog('LOG', 'Debug logs copied to clipboard (fallback)');
                }}
                className="debug-copy-btn"
                disabled={debugLogs.length === 0}
              >
                📋 Copy
              </button>
            </div>
          </div>
          {showDebugConsole && (
            <div className="debug-console-content" ref={debugConsoleRef}>
              {debugLogs.length === 0 ? (
                <div className="debug-console-empty">Debug console initialized</div>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index} className={`debug-log-entry ${log.level.toLowerCase()}`}>
                    <span className="debug-timestamp">[{log.timestamp}]</span>
                    <span className="debug-level">{log.level}:</span>
                    <span className="debug-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .fresh-autonomous-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 100vh;
          overflow-y: auto;
        }

        .fresh-autonomous-header {
          flex-shrink: 0;
          padding: 15px;
          border-bottom: 1px solid #ddd;
          background: #f8f9fa;
        }

        .fresh-autonomous-header h3 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .thinking-mode-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .thinking-mode-controls label {
          font-weight: bold;
          color: #555;
        }

        .thinking-mode-controls select {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 11px;
          background: white;
        }

        .thinking-mode-controls select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .status-bar {
          display: flex;
          gap: 15px;
          font-size: 12px;
        }

        .connection-status.connected {
          color: #28a745;
        }

        .connection-status.disconnected {
          color: #dc3545;
        }

        .processing-status {
          color: #007bff;
          font-weight: bold;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          background: white;
          min-height: 200px;
        }

        .welcome-message {
          text-align: center;
          color: #666;
          padding: 40px 20px;
        }

        .welcome-message h4 {
          color: #333;
          margin-bottom: 15px;
        }

        .message {
          margin-bottom: 20px;
          padding: 15px;
          border-radius: 8px;
          max-width: 100%;
        }

        .message.user {
          background: #e3f2fd;
          margin-left: 20px;
        }

        .message.assistant {
          background: #f5f5f5;
          margin-right: 20px;
        }

        .message-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          font-size: 12px;
        }

        .iteration-badge {
          background: #007bff;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
        }

        .tool-calls-badge {
          background: #28a745;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
        }

        .timestamp {
          color: #666;
          margin-left: auto;
        }

        .message-content {
          line-height: 1.5;
        }

        .tool-calls-list {
          margin-top: 10px;
          padding: 10px;
          background: rgba(0, 123, 255, 0.1);
          border-radius: 5px;
          font-size: 12px;
        }

        .tool-calls-list ul {
          margin: 5px 0 0 20px;
        }

        .input-container {
          flex-shrink: 0;
          border-top: 1px solid #ddd;
          padding: 15px;
          background: #f8f9fa;
        }

        .input-row {
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }

        .message-input {
          flex: 1;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 10px;
          font-family: inherit;
          resize: vertical;
          min-height: 60px;
        }

        .message-input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .send-btn, .clear-btn, .connect-btn {
          padding: 10px 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          min-width: 45px;
        }

        .send-btn:hover:not(:disabled) {
          background: #007bff;
          color: white;
        }

        .clear-btn:hover:not(:disabled) {
          background: #dc3545;
          color: white;
        }

        .connect-btn:hover:not(:disabled) {
          background: #28a745;
          color: white;
        }

        .send-btn:disabled, .clear-btn:disabled, .connect-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Manual Script Section */
        .manual-script-section {
          flex-shrink: 0;
          border-top: 1px solid #ddd;
          padding: 15px;
          background: #2a2a2a;
          max-height: 600px;
          overflow-y: auto;
        }

        .manual-script-section h4 {
          margin: 0 0 15px 0;
          color: #fff;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .manual-script-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .manual-script-textarea {
          width: 100%;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          background: #1a1a1a;
          color: #fff;
          border: 1px solid #444;
          border-radius: 4px;
          padding: 10px;
          resize: vertical;
          min-height: 120px;
        }

        .manual-script-textarea:focus {
          outline: none;
          border-color: #007acc;
        }

        .manual-script-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .manual-script-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .manual-script-btn.execute-btn {
          background: #007acc;
          color: #fff;
        }

        .manual-script-btn.execute-btn:hover:not(:disabled) {
          background: #005a99;
        }

        .manual-script-btn.execute-btn:disabled {
          background: #666;
          cursor: not-allowed;
        }

        .manual-script-btn.clear-btn {
          background: #666;
          color: #fff;
        }

        .manual-script-btn.clear-btn:hover {
          background: #555;
        }

        .manual-script-btn.copy-btn {
          background: #666;
          color: #fff;
        }

        .manual-script-btn.copy-btn:hover:not(:disabled) {
          background: #555;
        }

        .manual-script-btn.copy-btn:disabled {
          background: #444;
          cursor: not-allowed;
        }

        .manual-script-result {
          background: #1a1a1a;
          border: 1px solid #444;
          border-radius: 4px;
          padding: 10px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #4ecdc4;
          white-space: pre-wrap;
          max-height: 300px;
          overflow-y: auto;
        }

        .manual-script-result:has-text("❌") {
          color: #ff6b6b;
        }

        /* Script Controls Styles */
        .script-controls {
          margin-top: 15px;
          padding: 15px;
          background: #f8f9ff;
          border: 1px solid #e0e4ff;
          border-radius: 8px;
          border-left: 4px solid #007bff;
        }

        .script-header {
          margin-bottom: 10px;
          color: #333;
          font-size: 14px;
        }

        .script-preview {
          margin-bottom: 15px;
          background: #2d3748;
          border-radius: 4px;
          padding: 10px;
          max-height: 150px;
          overflow-y: auto;
        }

        .script-code {
          color: #e2e8f0;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .script-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .execute-script-btn, .download-script-btn, .copy-script-btn, .undo-fix-btn {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 120px;
        }

        .execute-script-btn {
          background: #28a745;
          color: white;
          border-color: #28a745;
        }

        .execute-script-btn:hover:not(:disabled) {
          background: #218838;
          border-color: #218838;
        }

        .execute-script-btn:disabled {
          background: #6c757d;
          border-color: #6c757d;
          cursor: not-allowed;
        }

        .download-script-btn {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .download-script-btn:hover {
          background: #0056b3;
          border-color: #0056b3;
        }

        .copy-script-btn {
          background: #6c757d;
          color: white;
          border-color: #6c757d;
        }

        .copy-script-btn:hover {
          background: #545b62;
          border-color: #545b62;
        }

        .undo-fix-btn {
          background: #ffc107;
          color: #212529;
          border-color: #ffc107;
        }

        .undo-fix-btn:hover:not(:disabled) {
          background: #e0a800;
          border-color: #d39e00;
        }

        .undo-fix-btn:disabled {
          background: #6c757d;
          border-color: #6c757d;
          color: white;
          cursor: not-allowed;
        }

        .execution-result {
          margin-top: 10px;
          padding: 10px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
        }

        .result-output {
          color: #495057;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          margin: 5px 0 0 0;
          white-space: pre-wrap;
          max-height: 100px;
          overflow-y: auto;
        }

        /* Debug Console Styles */
        .debug-console-section {
          flex-shrink: 0;
          border-top: 1px solid #ddd;
          background: #1a1a1a;
        }

        .debug-console-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          background: #2d2d2d;
          border-bottom: 1px solid #444;
        }

        .debug-console-header h4 {
          margin: 0;
          color: #fff;
          font-size: 14px;
        }

        .debug-console-controls {
          display: flex;
          gap: 8px;
        }

        .debug-toggle-btn, .debug-clear-btn, .debug-copy-btn {
          padding: 4px 8px;
          border: 1px solid #555;
          border-radius: 3px;
          background: #3a3a3a;
          color: #fff;
          cursor: pointer;
          font-size: 11px;
        }

        .debug-toggle-btn:hover {
          background: #4a4a4a;
        }

        .debug-clear-btn:hover:not(:disabled) {
          background: #dc3545;
        }

        .debug-copy-btn:hover:not(:disabled) {
          background: #007bff;
        }

        .debug-clear-btn:disabled, .debug-copy-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .debug-console-content {
          max-height: 200px;
          overflow-y: auto;
          padding: 8px;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.3;
        }

        .debug-console-empty {
          color: #888;
          font-style: italic;
          padding: 10px;
          text-align: center;
        }

        .debug-log-entry {
          padding: 2px 0;
          border-bottom: 1px solid #333;
        }

        .debug-log-entry:last-child {
          border-bottom: none;
        }

        .debug-timestamp {
          color: #666;
          margin-right: 8px;
        }

        .debug-level {
          font-weight: bold;
          margin-right: 8px;
        }

        .debug-log-entry.log .debug-level {
          color: #4ecdc4;
        }

        .debug-log-entry.error .debug-level {
          color: #ff6b6b;
        }

        .debug-log-entry.warn .debug-level {
          color: #ffa500;
        }

        .debug-message {
          color: #fff;
        }

        .debug-log-entry.error .debug-message {
          color: #ffcccc;
        }

        .debug-log-entry.warn .debug-message {
          color: #ffe0b3;
        }
      `}</style>
    </div>
  );
};

export default FreshAutonomousTab;