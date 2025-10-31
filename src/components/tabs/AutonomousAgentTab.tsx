import React, { useState, useRef, useEffect } from 'react';
import useAutonomousAgent from '../../hooks/useAutonomousAgent';

const AutonomousAgentTab: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const {
    agentState,
    messages,
    isConnected,
    error,
    runAutonomousTask,
    pauseAgent,
    resumeAgent,
    stopAgent,
    clearMessages
  } = useAutonomousAgent({ 
    model: 'claude',
    maxIterations: 15,
    evaluationThreshold: 0.8
  });

  // Auto-resize textarea
  const autoResizeInput = () => {
    const input = inputRef.current;
    if (input) {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 258) + 'px';
    }
  };

  useEffect(() => {
    autoResizeInput();
  }, [inputValue]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStartTask = async () => {
    if (!inputValue.trim() || agentState.isActive) return;

    try {
      await runAutonomousTask(inputValue);
      setInputValue('');
    } catch (err) {
      console.error('Failed to start autonomous task:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !agentState.isActive) {
      e.preventDefault();
      handleStartTask();
    }
  };

  const shouldDisableStart = !inputValue.trim() || agentState.isActive;

  const getStatusColor = () => {
    if (error) return '#dc3545';
    if (agentState.isActive) return '#28a745';
    if (isConnected) return '#007bff';
    return '#6c757d';
  };

  const getStatusText = () => {
    if (error) return `Error: ${error}`;
    if (agentState.isPlanning) return 'Planning task execution...';
    if (agentState.isExecuting) return 'Executing autonomous task...';
    if (agentState.isEvaluating) return 'Evaluating progress...';
    if (agentState.isActive) return 'Agent active';
    if (isConnected) return 'Ready for autonomous tasks';
    return 'Connecting...';
  };

  return (
    <div className="tab-content">
      <style>{`
        .agent-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 600px;
        }
        
        .agent-header {
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px 8px 0 0;
          margin-bottom: 8px;
        }
        
        .agent-title {
          font-size: 16px;
          font-weight: bold;
          margin: 0 0 4px 0;
        }
        
        .agent-subtitle {
          font-size: 12px;
          opacity: 0.9;
          margin: 0;
        }
        
        .agent-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 4px;
          margin-bottom: 8px;
          font-size: 12px;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        .agent-controls {
          display: flex;
          gap: 8px;
        }
        
        .control-btn {
          padding: 4px 8px;
          border: none;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .control-btn:hover {
          opacity: 0.8;
        }
        
        .control-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .pause-btn { background: #ff6b35; color: white; }
        .resume-btn { background: #28a745; color: white; }
        .stop-btn { background: #dc3545; color: white; }
        
        .agent-progress {
          margin-bottom: 8px;
        }
        
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
          font-size: 12px;
        }
        
        .progress-bar {
          width: 100%;
          height: 6px;
          background: #e9ecef;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #28a745, #20c997);
          transition: width 0.3s ease;
        }
        
        .plan-details {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          margin-bottom: 8px;
          overflow: hidden;
        }
        
        .plan-header {
          padding: 8px 12px;
          background: #e9ecef;
          border-bottom: 1px solid #dee2e6;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          font-weight: bold;
        }
        
        .plan-content {
          padding: 12px;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .plan-step {
          padding: 6px 8px;
          margin-bottom: 4px;
          border-radius: 4px;
          font-size: 11px;
          border-left: 3px solid #dee2e6;
        }
        
        .plan-step.current {
          background: #fff3cd;
          border-left-color: #ffc107;
        }
        
        .plan-step.completed {
          background: #d4edda;
          border-left-color: #28a745;
          opacity: 0.7;
        }
        
        .plan-step.pending {
          background: #f8f9fa;
          border-left-color: #6c757d;
        }
        
        .agent-messages {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          margin-bottom: 8px;
          min-height: 200px;
        }
        
        .agent-message {
          margin-bottom: 12px;
          padding: 8px;
          border-radius: 6px;
        }
        
        .agent-message.user {
          background: #e3f2fd;
          margin-left: 20px;
        }
        
        .agent-message.agent {
          background: #f3e5f5;
          margin-right: 20px;
        }
        
        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        
        .message-author {
          font-weight: bold;
          font-size: 12px;
        }
        
        .message-timestamp {
          font-size: 10px;
          color: #6c757d;
        }
        
        .message-content {
          font-size: 13px;
          line-height: 1.4;
        }
        
        .message-metadata {
          font-size: 10px;
          color: #6c757d;
          margin-top: 4px;
          font-style: italic;
        }
        
        .agent-input-area {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .input-container {
          display: flex;
          gap: 8px;
        }
        
        .task-input {
          flex: 1;
          padding: 12px;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          resize: vertical;
          min-height: 60px;
          font-size: 13px;
          font-family: inherit;
        }
        
        .task-input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
        
        .start-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        
        .start-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
        }
        
        .start-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .example-tasks {
          font-size: 11px;
          color: #6c757d;
          line-height: 1.4;
        }
        
        .example-task {
          padding: 4px 8px;
          background: #f8f9fa;
          border-radius: 4px;
          margin: 2px 0;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .example-task:hover {
          background: #e9ecef;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div className="agent-container">
        {/* Header */}
        <div className="agent-header">
          <div className="agent-title">🤖 Autonomous AI Agent</div>
          <div className="agent-subtitle">
            Intelligent task execution with planning, reasoning, and self-evaluation
          </div>
        </div>

        {/* Status Bar */}
        <div className="agent-status-bar">
          <div className="status-indicator">
            <div 
              className="status-dot" 
              style={{ backgroundColor: getStatusColor() }}
            ></div>
            <span>{getStatusText()}</span>
          </div>
          
          <div className="agent-controls">
            {agentState.isActive ? (
              <>
                <button 
                  className="control-btn pause-btn"
                  onClick={pauseAgent}
                  title="Pause agent execution"
                >
                  ⏸️ Pause
                </button>
                <button 
                  className="control-btn stop-btn"
                  onClick={stopAgent}
                  title="Stop agent and clear current task"
                >
                  ⏹️ Stop
                </button>
              </>
            ) : (
              <button 
                className="control-btn resume-btn"
                onClick={resumeAgent}
                disabled={!agentState.currentPlan}
                title="Resume paused agent execution"
              >
                ▶️ Resume
              </button>
            )}
            <button 
              className="control-btn"
              onClick={clearMessages}
              title="Clear conversation history"
              style={{ background: '#6c757d', color: 'white' }}
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        {agentState.isActive && (
          <div className="agent-progress">
            <div className="progress-header">
              <span>Progress: {Math.round(agentState.progress)}%</span>
              <span>Iteration: {agentState.iteration}/{agentState.maxIterations}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${agentState.progress}%` }}
              ></div>
            </div>
            {agentState.reasoning && (
              <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
                {agentState.reasoning}
              </div>
            )}
          </div>
        )}

        {/* Plan Details */}
        {agentState.currentPlan && (
          <div className="plan-details">
            <div 
              className="plan-header"
              onClick={() => setShowPlanDetails(!showPlanDetails)}
            >
              <span>Execution Plan ({agentState.currentPlan.steps.length} steps)</span>
              <span>{showPlanDetails ? '▼' : '▶'}</span>
            </div>
            {showPlanDetails && (
              <div className="plan-content">
                <div style={{ fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}>
                  Task: {agentState.currentPlan.task}
                </div>
                {agentState.currentPlan.steps.map((step, index) => (
                  <div 
                    key={step.id}
                    className={`plan-step ${
                      index === agentState.currentPlan!.currentStepIndex ? 'current' :
                      step.isComplete ? 'completed' : 'pending'
                    }`}
                  >
                    <div style={{ fontWeight: 'bold' }}>
                      Step {index + 1}: {step.description}
                    </div>
                    <div style={{ fontSize: '10px', marginTop: '2px' }}>
                      Expected: {step.expectedOutcome}
                    </div>
                    {step.result && (
                      <div style={{ fontSize: '10px', marginTop: '2px', color: '#28a745' }}>
                        Result: {step.result}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="agent-messages" ref={messagesRef}>
          {messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#6c757d', 
              fontStyle: 'italic',
              marginTop: '40px'
            }}>
              🤖 Ready to execute autonomous tasks
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                Describe a complex After Effects task and the agent will plan and execute it automatically
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`agent-message ${message.role}`}>
                <div className="message-header">
                  <span className="message-author">
                    {message.role === 'user' ? '👤 You' : 
                     message.role === 'agent' ? '🤖 Agent' : '🔧 System'}
                  </span>
                  <span className="message-timestamp">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">
                  {message.content}
                </div>
                {(message as any).agentData && (
                  <div className="message-metadata">
                    Type: {(message as any).agentData.type}
                    {(message as any).agentData.reasoning && (
                      <span> | Reasoning: {(message as any).agentData.reasoning}</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="agent-input-area">
          <div className="input-container">
            <textarea
              ref={inputRef}
              className="task-input"
              placeholder="Describe a complex After Effects task for autonomous execution...

Examples:
• Create an animated logo sequence with keyframes and effects
• Optimize my project by removing unused assets and organizing layers
• Generate a script to batch process compositions with specific effects
• Set up a complex animation workflow with multiple compositions"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={agentState.isActive}
            />
            <button
              className="start-btn"
              onClick={handleStartTask}
              disabled={shouldDisableStart}
            >
              {agentState.isActive ? '🔄 Running...' : '🚀 Start Task'}
            </button>
          </div>
          
          {!agentState.isActive && (
            <div className="example-tasks">
              <strong>Quick Examples:</strong>
              <div 
                className="example-task"
                onClick={() => setInputValue("Create a bouncing ball animation with realistic physics and timing")}
              >
                • Create a bouncing ball animation with realistic physics
              </div>
              <div 
                className="example-task"
                onClick={() => setInputValue("Analyze my current project and suggest performance optimizations")}
              >
                • Analyze my current project and suggest optimizations
              </div>
              <div 
                className="example-task"
                onClick={() => setInputValue("Set up a text animation template with customizable properties")}
              >
                • Set up a text animation template with customizable properties
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutonomousAgentTab;