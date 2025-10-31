import { useState, useRef, useCallback, useEffect } from 'react';

// Agent State Types
export interface AgentStep {
  id: string;
  description: string;
  requiredTools: string[];
  expectedOutcome: string;
  isComplete: boolean;
  result?: string;
  reasoning?: string;
}

export interface AgentPlan {
  id: string;
  task: string;
  steps: AgentStep[];
  completionCriteria: string[];
  estimatedIterations: number;
  currentStepIndex: number;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'agent';
  content: string;
  timestamp: number;
  agentData?: {
    type: 'planning' | 'execution' | 'evaluation' | 'reasoning';
    stepId?: string;
    planId?: string;
    reasoning?: string;
    toolCalls?: any[];
  };
}

export interface AgentState {
  isActive: boolean;
  isPlanning: boolean;
  isExecuting: boolean;
  isEvaluating: boolean;
  currentPlan?: AgentPlan;
  currentStep?: AgentStep;
  iteration: number;
  maxIterations: number;
  reasoning: string;
  progress: number; // 0-100
}

export interface AgentConfig {
  maxIterations?: number;
  maxToolCallsPerIteration?: number;
  evaluationThreshold?: number; // 0-1, confidence threshold for completion
  model?: string;
}

const useAutonomousAgent = (config: AgentConfig = {}) => {
  const {
    maxIterations = 10,
    maxToolCallsPerIteration = 5,
    evaluationThreshold = 0.8,
    model = 'claude'
  } = config;

  // State Management
  const [agentState, setAgentState] = useState<AgentState>({
    isActive: false,
    isPlanning: false,
    isExecuting: false,
    isEvaluating: false,
    iteration: 0,
    maxIterations,
    reasoning: '',
    progress: 0
  });

  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for WebSocket and state management
  const wsRef = useRef<WebSocket | null>(null);
  const agentStateRef = useRef(agentState);
  agentStateRef.current = agentState;

  // WebSocket Connection Management
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
      
      ws.onopen = () => {
        console.log('🔌 Autonomous agent WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('🔌 Autonomous agent WebSocket disconnected');
        setIsConnected(false);
        
        // Auto-reconnect after 3 seconds if agent is active
        if (agentStateRef.current.isActive) {
          setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      setError('Failed to connect to backend');
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Handle WebSocket Messages
  const handleWebSocketMessage = (data: any) => {
    const { type, content, timestamp } = data;
    
    switch (type) {
      case 'agent_plan_created':
        handlePlanCreated(data.plan);
        break;
        
      case 'agent_step_started':
        handleStepStarted(data.step);
        break;
        
      case 'agent_step_completed':
        handleStepCompleted(data.step, data.result);
        break;
        
      case 'agent_evaluation_complete':
        handleEvaluationComplete(data.evaluation);
        break;
        
      case 'agent_task_complete':
        handleTaskComplete(data.result);
        break;
        
      case 'content_delta':
        handleContentDelta(content);
        break;
        
      case 'tool_call_start':
        handleToolCallStart(data.toolCalls);
        break;
        
      case 'tool_call_complete':
        handleToolCallComplete(data.toolCall, data.result);
        break;
        
      case 'error':
        setError(data.error);
        break;
    }
  };

  // Agent Plan Creation
  const createPlan = async (task: string): Promise<AgentPlan> => {
    const planningPrompt = `
    You are an autonomous AI agent that helps with After Effects scripting and automation tasks.
    
    Task: ${task}
    
    Create a detailed execution plan by breaking this task into specific, actionable steps.
    Each step should:
    1. Have a clear description of what needs to be done
    2. Specify which tools might be needed (if any)
    3. Define the expected outcome
    4. Be executable independently
    
    Provide your response as a JSON object with this structure:
    {
      "task": "${task}",
      "steps": [
        {
          "id": "step_1",
          "description": "Specific action to take",
          "requiredTools": ["tool_name"],
          "expectedOutcome": "What should happen"
        }
      ],
      "completionCriteria": ["criterion1", "criterion2"],
      "estimatedIterations": 5
    }
    
    Focus on After Effects scripting, automation, project optimization, or documentation tasks.
    `;

    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      // Send planning request
      wsRef.current.send(JSON.stringify({
        type: 'agent_create_plan',
        data: {
          task,
          planningPrompt,
          model
        }
      }));

      // Create temporary plan while waiting for response
      const tempPlan: AgentPlan = {
        id: `plan_${Date.now()}`,
        task,
        steps: [],
        completionCriteria: [],
        estimatedIterations: maxIterations,
        currentStepIndex: 0
      };

      resolve(tempPlan);
    });
  };

  // Start Autonomous Task Execution
  const runAutonomousTask = async (task: string) => {
    try {
      console.log('🤖 useAutonomousAgent: runAutonomousTask called with:', task);
      
      setError(null);
      setAgentState(prev => ({
        ...prev,
        isActive: true,
        isPlanning: true,
        iteration: 0,
        progress: 0,
        reasoning: 'Starting autonomous execution...'
      }));

      // Add initial user message
      const userMessage: AgentMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: task,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMessage]);

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error('🤖 useAutonomousAgent: WebSocket not connected!');
        throw new Error('WebSocket not connected');
      }

      const autonomousMessage = `AUTONOMOUS AGENT MODE: Execute this task autonomously with multiple steps and tool calls as needed: ${task}`;
      console.log('🤖 useAutonomousAgent: Sending autonomous message:', autonomousMessage);

      // Send autonomous task request directly to backend
      wsRef.current.send(JSON.stringify({
        type: 'chat_start',
        data: {
          message: autonomousMessage,
          model,
          conversation: []
        }
      }));

      console.log('🤖 useAutonomousAgent: Autonomous task request sent!');

    } catch (err) {
      console.error('Error running autonomous task:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setAgentState(prev => ({
        ...prev,
        isActive: false,
        isPlanning: false,
        isExecuting: false
      }));
    }
  };

  // Autonomous Execution Loop
  const executeAutonomously = async (plan: AgentPlan) => {
    let iteration = 0;
    
    while (iteration < maxIterations && !isTaskComplete(plan)) {
      setAgentState(prev => ({
        ...prev,
        iteration: iteration + 1,
        progress: (iteration / maxIterations) * 100
      }));

      // Get current step
      const currentStep = getCurrentStep(plan);
      if (!currentStep) break;

      // Execute current step
      const stepResult = await executeStep(currentStep);
      
      // Evaluate progress
      const evaluation = await evaluateProgress(plan, stepResult);
      
      // Update plan based on evaluation
      if (evaluation.shouldContinue) {
        plan.currentStepIndex++;
      }
      
      if (evaluation.isComplete) {
        await completeTask(plan, evaluation.finalResult);
        break;
      }
      
      iteration++;
    }

    // Final evaluation if max iterations reached
    if (iteration >= maxIterations) {
      await handleMaxIterationsReached(plan);
    }
  };

  // Execute Individual Step
  const executeStep = async (step: AgentStep): Promise<string> => {
    setAgentState(prev => ({
      ...prev,
      currentStep: step,
      reasoning: `Executing: ${step.description}`
    }));

    // Add step execution message
    const stepMessage: AgentMessage = {
      id: `msg_${Date.now()}`,
      role: 'agent',
      content: `**Executing Step:** ${step.description}`,
      timestamp: Date.now(),
      agentData: {
        type: 'execution',
        stepId: step.id,
        reasoning: step.description
      }
    };
    setMessages(prev => [...prev, stepMessage]);

    return new Promise((resolve) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        resolve('WebSocket not available');
        return;
      }

      // Send autonomous task execution request
      wsRef.current.send(JSON.stringify({
        type: 'agent_autonomous_task',
        data: {
          task: step.description,
          model,
          maxIterations: 1, // Single iteration for individual step
          maxToolCalls: maxToolCallsPerIteration
        }
      }));

      // Set up response listener for this specific step
      const handleStepResponse = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'agent_task_complete') {
            wsRef.current?.removeEventListener('message', handleStepResponse);
            resolve(data.result.result || `Completed: ${step.description}`);
          } else if (data.type === 'error') {
            wsRef.current?.removeEventListener('message', handleStepResponse);
            resolve(`Error: ${data.error}`);
          }
        } catch (err) {
          // Ignore parsing errors for other messages
        }
      };

      wsRef.current.addEventListener('message', handleStepResponse);

      // Timeout fallback
      setTimeout(() => {
        wsRef.current?.removeEventListener('message', handleStepResponse);
        resolve(`Timeout: ${step.description}`);
      }, 30000);
    });
  };

  // Evaluate Progress and Completion
  const evaluateProgress = async (plan: AgentPlan, stepResult: string) => {
    setAgentState(prev => ({
      ...prev,
      isEvaluating: true,
      reasoning: 'Evaluating progress and completion...'
    }));

    const evaluationPrompt = `
    Original task: ${plan.task}
    Current progress: ${stepResult}
    Steps completed: ${plan.currentStepIndex + 1}/${plan.steps.length}
    
    Evaluate:
    1. Is the task sufficiently complete? (confidence 0-1)
    2. Should we continue with more steps?
    3. What is the quality of current work? (0-1)
    4. Final result if complete, or next action if not
    
    Respond in JSON format:
    {
      "isComplete": boolean,
      "confidence": number,
      "shouldContinue": boolean,
      "quality": number,
      "reasoning": "explanation",
      "finalResult": "result if complete",
      "nextAction": "what to do next if not complete"
    }
    `;

    // For now, return mock evaluation
    const mockEvaluation = {
      isComplete: plan.currentStepIndex >= plan.steps.length - 1,
      confidence: 0.9,
      shouldContinue: plan.currentStepIndex < plan.steps.length - 1,
      quality: 0.85,
      reasoning: 'Step completed successfully',
      finalResult: stepResult,
      nextAction: 'Continue with next step'
    };

    setAgentState(prev => ({
      ...prev,
      isEvaluating: false
    }));

    return mockEvaluation;
  };

  // Helper Functions
  const getCurrentStep = (plan: AgentPlan): AgentStep | null => {
    return plan.steps[plan.currentStepIndex] || null;
  };

  const isTaskComplete = (plan: AgentPlan): boolean => {
    return plan.currentStepIndex >= plan.steps.length;
  };

  const completeTask = async (plan: AgentPlan, result: string) => {
    setAgentState(prev => ({
      ...prev,
      isActive: false,
      isExecuting: false,
      progress: 100,
      reasoning: 'Task completed successfully'
    }));

    const completionMessage: AgentMessage = {
      id: `msg_${Date.now()}`,
      role: 'agent',
      content: `**Task Completed:** ${result}`,
      timestamp: Date.now(),
      agentData: {
        type: 'evaluation',
        planId: plan.id,
        reasoning: 'Task completed autonomously'
      }
    };
    setMessages(prev => [...prev, completionMessage]);
  };

  const handleMaxIterationsReached = async (plan: AgentPlan) => {
    setAgentState(prev => ({
      ...prev,
      isActive: false,
      isExecuting: false,
      reasoning: 'Maximum iterations reached'
    }));

    const limitMessage: AgentMessage = {
      id: `msg_${Date.now()}`,
      role: 'agent',
      content: `**Max iterations reached:** Task partially completed. Please review progress and continue manually if needed.`,
      timestamp: Date.now(),
      agentData: {
        type: 'evaluation',
        reasoning: 'Iteration limit reached'
      }
    };
    setMessages(prev => [...prev, limitMessage]);
  };

  // Event Handlers
  const handlePlanCreated = (plan: AgentPlan) => {
    setAgentState(prev => ({
      ...prev,
      currentPlan: plan,
      isPlanning: false
    }));
  };

  const handleStepStarted = (step: AgentStep) => {
    setAgentState(prev => ({
      ...prev,
      currentStep: step
    }));
  };

  const handleStepCompleted = (step: AgentStep, result: string) => {
    step.isComplete = true;
    step.result = result;
  };

  const handleEvaluationComplete = (evaluation: any) => {
    setAgentState(prev => ({
      ...prev,
      isEvaluating: false,
      reasoning: evaluation.reasoning
    }));
  };

  const handleTaskComplete = (result: any) => {
    setAgentState(prev => ({
      ...prev,
      isActive: false,
      isExecuting: false,
      progress: 100
    }));
  };

  const handleContentDelta = (content: string) => {
    // Update the last agent message with streaming content, or create new one
    setMessages(prev => {
      const updated = [...prev];
      const lastMessage = updated[updated.length - 1];
      
      if (lastMessage && lastMessage.role === 'agent') {
        // Update existing agent message
        lastMessage.content = content;
      } else {
        // Create new agent message
        updated.push({
          id: `msg_${Date.now()}`,
          role: 'agent',
          content: content,
          timestamp: Date.now(),
          agentData: {
            type: 'execution',
            reasoning: 'Autonomous execution in progress'
          }
        });
      }
      
      return updated;
    });
  };

  const handleToolCallStart = (toolCalls: any[]) => {
    const toolMessage: AgentMessage = {
      id: `msg_${Date.now()}`,
      role: 'agent',
      content: `🔧 **Using tools:** ${toolCalls.map(t => t.function?.name || 'unknown').join(', ')}`,
      timestamp: Date.now(),
      agentData: {
        type: 'execution',
        toolCalls
      }
    };
    setMessages(prev => [...prev, toolMessage]);
  };

  const handleToolCallComplete = (toolCall: any, result: any) => {
    // Update agent reasoning based on tool result
    setAgentState(prev => ({
      ...prev,
      reasoning: `Tool completed: ${toolCall.function?.name}`
    }));
  };

  // Control Functions
  const pauseAgent = () => {
    setAgentState(prev => ({
      ...prev,
      isActive: false,
      isExecuting: false,
      reasoning: 'Agent paused by user'
    }));
  };

  const resumeAgent = () => {
    if (agentState.currentPlan) {
      setAgentState(prev => ({
        ...prev,
        isActive: true,
        isExecuting: true,
        reasoning: 'Agent resumed'
      }));
      executeAutonomously(agentState.currentPlan);
    }
  };

  const stopAgent = () => {
    setAgentState(prev => ({
      ...prev,
      isActive: false,
      isPlanning: false,
      isExecuting: false,
      isEvaluating: false,
      currentPlan: undefined,
      currentStep: undefined,
      reasoning: 'Agent stopped by user'
    }));
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    // State
    agentState,
    messages,
    isConnected,
    error,
    
    // Actions
    runAutonomousTask,
    pauseAgent,
    resumeAgent,
    stopAgent,
    clearMessages,
    
    // Configuration
    maxIterations,
    maxToolCallsPerIteration,
    evaluationThreshold
  };
};

export default useAutonomousAgent;