import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setIsProcessing, setStatus } from '../../store/appSlice';

const ManualToolTestTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isProcessing } = useAppSelector((state) => state.app);
  const [toolInput, setToolInput] = useState('{"tool": "create_shape_layer", "parameters": {"shape": "rectangle", "size": [200, 200], "fillColor": [1, 0, 0]}}');
  const [toolResults, setToolResults] = useState('');

  const handleExecuteTool = async () => {
    if (!toolInput.trim()) return;

    dispatch(setIsProcessing(true));
    dispatch(setStatus('Executing tool...'));

    try {
      // Parse the JSON input
      const toolCall = JSON.parse(toolInput);
      
      // This will be implemented with the actual tool execution logic
      // For now, just a placeholder response
      setTimeout(() => {
        const result = {
          success: true,
          tool: toolCall.tool,
          parameters: toolCall.parameters,
          result: 'Tool execution placeholder - actual implementation needed',
          timestamp: new Date().toISOString()
        };
        
        setToolResults(JSON.stringify(result, null, 2));
        dispatch(setIsProcessing(false));
        dispatch(setStatus('Tool executed'));
      }, 1000);
    } catch (error) {
      console.error('Tool execution error:', error);
      setToolResults(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, null, 2));
      dispatch(setIsProcessing(false));
      dispatch(setStatus('Execution failed'));
    }
  };

  const handleClear = () => {
    setToolInput('');
    setToolResults('');
  };

  const handleGetToolCatalog = async () => {
    dispatch(setIsProcessing(true));
    dispatch(setStatus('Getting tool catalog...'));

    try {
      // This will be implemented with the actual tool catalog logic
      setTimeout(() => {
        const catalog = {
          tools: [
            {
              name: 'create_shape_layer',
              description: 'Create a shape layer with specified properties',
              parameters: {
                shape: 'rectangle|circle|polygon',
                size: '[width, height]',
                fillColor: '[r, g, b] (0-1 range)',
                position: '[x, y] (optional)'
              }
            },
            {
              name: 'create_text_layer',
              description: 'Create a text layer with specified content',
              parameters: {
                text: 'string',
                fontSize: 'number',
                fontFamily: 'string (optional)',
                position: '[x, y] (optional)'
              }
            },
            {
              name: 'animate_layer',
              description: 'Animate layer properties over time',
              parameters: {
                layerName: 'string',
                property: 'position|rotation|scale|opacity',
                keyframes: 'array of {time, value} objects'
              }
            }
          ]
        };
        
        setToolResults(JSON.stringify(catalog, null, 2));
        dispatch(setIsProcessing(false));
        dispatch(setStatus('Tool catalog loaded'));
      }, 500);
    } catch (error) {
      console.error('Tool catalog error:', error);
      setToolResults(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, null, 2));
      dispatch(setIsProcessing(false));
      dispatch(setStatus('Catalog load failed'));
    }
  };

  return (
    <div id="manualTab" className="tab-content">
      <div className="manual-test-container">
        <h3>Manual Tool Testing</h3>
        <p>Test tools directly without AI. Paste JSON tool calls here:</p>
        
        <div className="tool-input-section">
          <label htmlFor="toolInput">Tool Call JSON:</label>
          <textarea
            id="toolInput"
            className="tool-input"
            placeholder='{"tool": "create_shape_layer", "parameters": {"shape": "rectangle", "size": [200, 200], "fillColor": [1, 0, 0]}}'
            value={toolInput}
            onChange={(e) => setToolInput(e.target.value)}
            rows={6}
          />
        </div>
        
        <div className="tool-actions">
          <button
            id="executeToolBtn"
            className="execute-btn"
            onClick={handleExecuteTool}
            disabled={isProcessing}
          >
            Execute Tool
          </button>
          <button
            id="clearToolBtn"
            className="clear-btn"
            onClick={handleClear}
          >
            Clear
          </button>
          <button
            id="getToolCatalogBtn"
            className="catalog-btn"
            onClick={handleGetToolCatalog}
            disabled={isProcessing}
          >
            Get Tool Catalog
          </button>
        </div>
        
        <div className="tool-results">
          <h4>Results:</h4>
          <div id="toolResults" className="results-output">
            <pre>{toolResults}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualToolTestTab;