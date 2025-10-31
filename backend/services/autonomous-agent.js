const AIRouterService = require('./ai-router');

class AutonomousAgentService {
  constructor() {
    this.aiRouter = new AIRouterService();
    this.maxIterations = 15;
    this.maxToolCallsPerIteration = 5;
    this.evaluationThreshold = 0.8;
  }

  /**
   * Handle agent plan creation
   */
  async createPlan(task, options = {}) {
    const { model = 'claude' } = options;
    
    console.log(`🤖 Agent: Creating plan for task: ${task}`);
    
    const planningPrompt = this.generatePlanningPrompt(task);
    
    try {
      const response = await this.aiRouter.callAI(planningPrompt, {
        model,
        tools: [], // No tools needed for planning
        maxTokens: 2000
      });
      
      // Parse the plan from the response
      const plan = this.parsePlanFromResponse(response.content, task);
      
      console.log(`📋 Agent: Created plan with ${plan.steps.length} steps`);
      return {
        success: true,
        plan
      };
      
    } catch (error) {
      console.error('❌ Agent planning error:', error);
      return {
        success: false,
        error: error.message,
        plan: this.createFallbackPlan(task)
      };
    }
  }

  /**
   * Execute a single step with autonomous decision making
   */
  async executeStep(step, context = {}) {
    const { model = 'claude', conversation = [] } = context;
    
    console.log(`🎯 Agent: Executing step - ${step.description}`);
    
    const executionPrompt = this.generateExecutionPrompt(step, context);
    
    return new Promise((resolve, reject) => {
      let stepResult = '';
      let toolCallsExecuted = 0;
      
      // Use streamChat for autonomous execution with tools
      this.aiRouter.streamChat(executionPrompt, {
        model,
        conversation,
        onContentDelta: (delta, fullContent) => {
          stepResult = fullContent;
        },
        onToolCall: (toolCalls) => {
          toolCallsExecuted += toolCalls.length;
          console.log(`🔧 Agent: Using ${toolCalls.length} tools for step execution`);
        },
        onToolResult: (toolCall, result) => {
          console.log(`✅ Agent: Tool ${toolCall.function?.name} completed`);
        },
        onComplete: (result) => {
          console.log(`✅ Agent: Step completed with ${toolCallsExecuted} tool calls`);
          resolve({
            success: true,
            result: stepResult || result.content,
            toolCallsUsed: toolCallsExecuted,
            reasoning: `Step executed with ${toolCallsExecuted} tool calls`
          });
        },
        onError: (error) => {
          console.error(`❌ Agent: Step execution failed - ${error}`);
          reject(new Error(`Step execution failed: ${error}`));
        }
      });
    });
  }

  /**
   * Evaluate task completion autonomously
   */
  async evaluateCompletion(plan, currentResult, context = {}) {
    const { model = 'claude' } = context;
    
    console.log(`🧠 Agent: Evaluating completion for task: ${plan.task}`);
    
    const evaluationPrompt = this.generateEvaluationPrompt(plan, currentResult);
    
    try {
      const response = await this.aiRouter.callAI(evaluationPrompt, {
        model,
        tools: [], // No tools needed for evaluation
        maxTokens: 1000
      });
      
      // Parse evaluation from response
      const evaluation = this.parseEvaluationFromResponse(response.content);
      
      console.log(`📊 Agent: Evaluation complete - Confidence: ${evaluation.confidence}, Complete: ${evaluation.isComplete}`);
      
      return evaluation;
      
    } catch (error) {
      console.error('❌ Agent evaluation error:', error);
      return {
        isComplete: false,
        confidence: 0.1,
        quality: 0.1,
        shouldContinue: true,
        reasoning: `Evaluation failed: ${error.message}`,
        recommendations: ['Retry evaluation', 'Check system status'],
        issuesFound: ['Evaluation system error']
      };
    }
  }

  /**
   * Stream autonomous task execution
   */
  async streamAutonomousTask(task, options = {}) {
    const {
      model = 'claude',
      maxIterations = this.maxIterations,
      onPlanCreated = () => {},
      onStepStarted = () => {},
      onStepCompleted = () => {},
      onEvaluationComplete = () => {},
      onTaskComplete = () => {},
      onError = () => {},
      onContentDelta = () => {}
    } = options;

    try {
      // Phase 1: Create Plan
      console.log(`🤖 Agent: Starting autonomous task - ${task}`);
      onContentDelta('🤖 **Starting autonomous task execution**\n\n**Phase 1: Creating execution plan...**\n');
      
      const planResult = await this.createPlan(task, { model });
      if (!planResult.success) {
        throw new Error(`Planning failed: ${planResult.error}`);
      }
      
      const plan = planResult.plan;
      onPlanCreated(plan);
      onContentDelta(`📋 **Plan created with ${plan.steps.length} steps**\n\n`);

      // Phase 2: Execute Steps
      let iteration = 0;
      let overallResult = '';
      
      while (iteration < maxIterations && plan.currentStepIndex < plan.steps.length) {
        iteration++;
        const currentStep = plan.steps[plan.currentStepIndex];
        
        console.log(`🔄 Agent: Iteration ${iteration} - Step ${plan.currentStepIndex + 1}`);
        onContentDelta(`**Step ${plan.currentStepIndex + 1}:** ${currentStep.description}\n`);
        
        onStepStarted(currentStep);
        
        try {
          // Execute current step
          const stepResult = await this.executeStep(currentStep, { model });
          
          // Mark step as complete
          currentStep.isComplete = true;
          currentStep.result = stepResult.result;
          overallResult += stepResult.result + '\n';
          
          onStepCompleted(currentStep, stepResult.result);
          onContentDelta(`✅ Step completed: ${stepResult.result}\n\n`);
          
          // Evaluate progress
          onContentDelta('🧠 **Evaluating progress...**\n');
          const evaluation = await this.evaluateCompletion(plan, overallResult, { model });
          onEvaluationComplete(evaluation);
          
          if (evaluation.isComplete && evaluation.confidence >= this.evaluationThreshold) {
            onContentDelta(`🎉 **Task completed successfully!**\n\nFinal result: ${evaluation.reasoning}\n`);
            onTaskComplete({
              success: true,
              result: overallResult,
              evaluation,
              stepsCompleted: plan.currentStepIndex + 1,
              totalSteps: plan.steps.length
            });
            return;
          } else if (!evaluation.shouldContinue) {
            onContentDelta(`⚠️ **Agent recommends stopping execution**\n\nReason: ${evaluation.reasoning}\n`);
            onTaskComplete({
              success: false,
              result: overallResult,
              evaluation,
              stepsCompleted: plan.currentStepIndex + 1,
              totalSteps: plan.steps.length,
              reason: 'Agent recommendation'
            });
            return;
          }
          
          // Move to next step
          plan.currentStepIndex++;
          onContentDelta(`⏭️ Moving to next step...\n\n`);
          
        } catch (stepError) {
          console.error(`❌ Agent: Step ${plan.currentStepIndex + 1} failed:`, stepError);
          onContentDelta(`❌ Step failed: ${stepError.message}\n\n`);
          
          // Try to recover or continue
          const shouldContinue = await this.handleStepError(stepError, currentStep, plan);
          if (!shouldContinue) {
            onTaskComplete({
              success: false,
              result: overallResult,
              error: stepError.message,
              stepsCompleted: plan.currentStepIndex,
              totalSteps: plan.steps.length,
              reason: 'Step execution failed'
            });
            return;
          }
          
          plan.currentStepIndex++;
        }
      }
      
      // Phase 3: Final evaluation if max iterations reached
      if (iteration >= maxIterations) {
        onContentDelta(`⏰ **Maximum iterations reached (${maxIterations})**\n\n`);
        const finalEvaluation = await this.evaluateCompletion(plan, overallResult, { model });
        
        onTaskComplete({
          success: finalEvaluation.confidence >= this.evaluationThreshold,
          result: overallResult,
          evaluation: finalEvaluation,
          stepsCompleted: plan.currentStepIndex,
          totalSteps: plan.steps.length,
          reason: 'Maximum iterations reached'
        });
      } else {
        onContentDelta(`✅ **All planned steps completed**\n\n`);
        const finalEvaluation = await this.evaluateCompletion(plan, overallResult, { model });
        
        onTaskComplete({
          success: true,
          result: overallResult,
          evaluation: finalEvaluation,
          stepsCompleted: plan.steps.length,
          totalSteps: plan.steps.length,
          reason: 'All steps completed'
        });
      }
      
    } catch (error) {
      console.error('❌ Agent: Autonomous task failed:', error);
      onError(error.message);
      onContentDelta(`❌ **Task execution failed:** ${error.message}\n`);
    }
  }

  /**
   * Generate planning prompt for task decomposition
   */
  generatePlanningPrompt(task) {
    return `You are an autonomous AI agent specializing in Adobe After Effects scripting and automation.

TASK: ${task}

Create a detailed, executable plan that breaks this task into specific steps. Focus on After Effects scripting, automation, project optimization, or related tasks.

AVAILABLE CAPABILITIES:
- After Effects ExtendScript API (jsx tools)
- Documentation search and analysis
- Code generation and validation  
- Project analysis and optimization
- File operations and batch processing

PLANNING REQUIREMENTS:
Break down the task into sequential steps that accomplish ALL parts of the request. Each step should be:
1. Actionable and specific  
2. Address one part of the overall task
3. Result in measurable progress toward the complete goal
4. Include appropriate tool usage when needed

For tasks with "then" or multiple parts, create separate steps for each part.
For example: "search for X, then tell me about Y" = Step 1: Search for X, Step 2: Tell about Y

OUTPUT FORMAT:
Provide a JSON response with this structure:
{
  "task": "${task}",
  "approach": "High-level approach description",
  "steps": [
    {
      "id": "step_1",
      "description": "Specific action to perform",
      "requiredTools": ["tool_name_if_any"],
      "expectedOutcome": "What should be achieved",
      "estimatedTime": "1-5 minutes"
    }
  ],
  "completionCriteria": [
    "Specific measurable criteria for task completion"
  ],
  "estimatedIterations": 5
}

Create an efficient, logical plan that accomplishes the task effectively.`;
  }

  /**
   * Generate execution prompt for individual steps
   */
  generateExecutionPrompt(step, context) {
    return `You are an autonomous AI agent executing a multi-step After Effects task.

ORIGINAL TASK: ${context.originalTask || 'Task execution'}

CURRENT STEP: ${step.description}

EXPECTED OUTCOME: ${step.expectedOutcome}

INSTRUCTIONS:
You must execute this step completely and continue until the full task is accomplished. This may require:
1. Using multiple tools in sequence
2. Performing multiple searches or operations
3. Providing multiple responses or outputs
4. Continuing until all parts of the instruction are complete

Do not stop after a single tool call or response. Keep working until this step and all its sub-tasks are fully completed.

Execute this step now and ensure all requirements are met.`;
  }

  /**
   * Generate evaluation prompt for completion assessment
   */
  generateEvaluationPrompt(plan, currentResult) {
    return `You are evaluating the completion of an autonomous After Effects task.

ORIGINAL TASK: ${plan.task}

COMPLETION CRITERIA:
${plan.completionCriteria.map((criterion, index) => `${index + 1}. ${criterion}`).join('\n')}

CURRENT RESULT: ${currentResult}

STEPS COMPLETED: ${plan.steps.filter(s => s.isComplete).length}/${plan.steps.length}

EVALUATION QUESTIONS:
1. Has the original task been fulfilled according to the completion criteria?
2. Is the result functionally correct and usable?
3. Would a user be satisfied with this outcome?
4. What is your confidence level in this assessment? (0-1)
5. Should the agent continue or is the task sufficiently complete?

Provide your assessment as JSON:
{
  "isComplete": boolean,
  "confidence": number (0-1),
  "quality": number (0-1),
  "shouldContinue": boolean,
  "reasoning": "detailed explanation of your assessment",
  "recommendations": ["what to do next"],
  "issuesFound": ["any problems identified"],
  "improvementSuggestions": ["how to improve if not complete"]
}

Be thorough and objective in your evaluation.`;
  }

  /**
   * Parse plan from AI response
   */
  parsePlanFromResponse(response, originalTask) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const planData = JSON.parse(jsonMatch[0]);
        
        return {
          id: `plan_${Date.now()}`,
          task: planData.task || originalTask,
          steps: (planData.steps || []).map((step, index) => ({
            id: step.id || `step_${index + 1}`,
            description: step.description || `Step ${index + 1}`,
            requiredTools: step.requiredTools || [],
            expectedOutcome: step.expectedOutcome || 'Progress towards completion',
            isComplete: false
          })),
          completionCriteria: planData.completionCriteria || ['Task completed successfully'],
          estimatedIterations: Math.min(20, Math.max(1, planData.estimatedIterations || 5)),
          currentStepIndex: 0
        };
      }
    } catch (error) {
      console.warn('⚠️ Agent: Failed to parse plan JSON, creating fallback');
    }
    
    return this.createFallbackPlan(originalTask);
  }

  /**
   * Parse evaluation from AI response
   */
  parseEvaluationFromResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const evaluation = JSON.parse(jsonMatch[0]);
        return {
          isComplete: evaluation.isComplete || false,
          confidence: Math.max(0, Math.min(1, evaluation.confidence || 0.5)),
          quality: Math.max(0, Math.min(1, evaluation.quality || 0.5)),
          shouldContinue: evaluation.shouldContinue !== false,
          reasoning: evaluation.reasoning || 'Evaluation completed',
          recommendations: evaluation.recommendations || [],
          issuesFound: evaluation.issuesFound || [],
          improvementSuggestions: evaluation.improvementSuggestions || []
        };
      }
    } catch (error) {
      console.warn('⚠️ Agent: Failed to parse evaluation JSON, using defaults');
    }
    
    // Fallback evaluation
    return {
      isComplete: false,
      confidence: 0.5,
      quality: 0.5,
      shouldContinue: true,
      reasoning: 'Unable to parse evaluation, continuing with caution',
      recommendations: ['Continue with next step'],
      issuesFound: [],
      improvementSuggestions: []
    };
  }

  /**
   * Create a fallback plan when parsing fails
   */
  createFallbackPlan(task) {
    return {
      id: `plan_${Date.now()}`,
      task,
      steps: [
        {
          id: 'step_1',
          description: 'Analyze the task requirements',
          requiredTools: [],
          expectedOutcome: 'Understanding of what needs to be accomplished',
          isComplete: false
        },
        {
          id: 'step_2',
          description: 'Execute the main task',
          requiredTools: [],
          expectedOutcome: 'Task completed according to requirements',
          isComplete: false
        },
        {
          id: 'step_3',
          description: 'Verify and finalize results',
          requiredTools: [],
          expectedOutcome: 'Confirmed working solution',
          isComplete: false
        }
      ],
      completionCriteria: ['Task requirements met', 'Solution is functional'],
      estimatedIterations: 3,
      currentStepIndex: 0
    };
  }

  /**
   * Handle step execution errors
   */
  async handleStepError(error, step, plan) {
    console.log(`🔧 Agent: Handling step error for step ${step.id}`);
    
    // Simple error recovery logic
    const errorMessage = error.message.toLowerCase();
    
    // If it's a tool or API error, try to continue
    if (errorMessage.includes('tool') || errorMessage.includes('api')) {
      console.log('🔧 Agent: Tool error detected, attempting to continue');
      return true;
    }
    
    // If it's a critical error, stop
    if (errorMessage.includes('critical') || errorMessage.includes('fatal')) {
      console.log('🛑 Agent: Critical error detected, stopping execution');
      return false;
    }
    
    // Default: try to continue
    return true;
  }
}

module.exports = AutonomousAgentService;