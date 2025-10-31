import { useCallback } from 'react';
import { AgentPlan, AgentStep } from './useAutonomousAgent';

export interface PlanningOptions {
  model: string;
  maxSteps: number;
  focusArea: 'scripting' | 'automation' | 'optimization' | 'general';
  complexity: 'simple' | 'medium' | 'complex';
}

export interface PlanningResult {
  success: boolean;
  plan?: AgentPlan;
  error?: string;
  reasoning?: string;
}

const useAgentPlanner = () => {

  // Main planning function
  const createExecutionPlan = useCallback(async (
    task: string, 
    options: PlanningOptions = {
      model: 'claude',
      maxSteps: 8,
      focusArea: 'general',
      complexity: 'medium'
    }
  ): Promise<PlanningResult> => {
    try {
      // Analyze task complexity and type
      const taskAnalysis = analyzeTask(task);
      
      // Generate context-aware planning prompt
      const planningPrompt = generatePlanningPrompt(task, taskAnalysis, options);
      
      // Call AI to create structured plan
      const planResponse = await callPlanningAI(planningPrompt, options.model);
      
      // Validate and structure the plan
      const plan = validateAndStructurePlan(planResponse, task);
      
      return {
        success: true,
        plan,
        reasoning: `Created ${plan.steps.length}-step plan for ${taskAnalysis.category} task`
      };
      
    } catch (error) {
      console.error('Planning error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown planning error'
      };
    }
  }, []);

  // Analyze task to determine category, complexity, and approach
  const analyzeTask = (task: string) => {
    const taskLower = task.toLowerCase();
    
    // Determine task category
    let category = 'general';
    if (taskLower.includes('script') || taskLower.includes('jsx') || taskLower.includes('code')) {
      category = 'scripting';
    } else if (taskLower.includes('automat') || taskLower.includes('batch') || taskLower.includes('process')) {
      category = 'automation';
    } else if (taskLower.includes('optim') || taskLower.includes('performance') || taskLower.includes('speed')) {
      category = 'optimization';
    } else if (taskLower.includes('effect') || taskLower.includes('animation') || taskLower.includes('layer')) {
      category = 'effects';
    }
    
    // Estimate complexity
    let complexity = 'medium';
    const complexIndicators = ['multiple', 'complex', 'advanced', 'integration', 'system'];
    const simpleIndicators = ['simple', 'basic', 'quick', 'small', 'single'];
    
    if (complexIndicators.some(indicator => taskLower.includes(indicator))) {
      complexity = 'complex';
    } else if (simpleIndicators.some(indicator => taskLower.includes(indicator))) {
      complexity = 'simple';
    }
    
    // Identify key components
    const components = [];
    if (taskLower.includes('layer')) components.push('layers');
    if (taskLower.includes('comp') || taskLower.includes('composition')) components.push('compositions');
    if (taskLower.includes('effect')) components.push('effects');
    if (taskLower.includes('text')) components.push('text');
    if (taskLower.includes('render')) components.push('rendering');
    if (taskLower.includes('import') || taskLower.includes('export')) components.push('files');
    
    return {
      category,
      complexity,
      components,
      estimatedSteps: complexity === 'simple' ? 3 : complexity === 'complex' ? 8 : 5
    };
  };

  // Generate context-aware planning prompt
  const generatePlanningPrompt = (task: string, analysis: any, options: PlanningOptions) => {
    const basePrompt = `
You are an autonomous AI agent specializing in Adobe After Effects scripting and automation.

TASK: ${task}

CONTEXT:
- Task Category: ${analysis.category}
- Complexity: ${analysis.complexity}
- Components: ${analysis.components.join(', ') || 'general'}
- Focus Area: ${options.focusArea}

PLANNING INSTRUCTIONS:
Create a detailed, executable plan that breaks this task into specific steps. Each step should be:
1. Actionable and specific
2. Independently executable
3. Result in measurable progress
4. Include appropriate tool usage when needed

AVAILABLE TOOLS AND CAPABILITIES:
- After Effects ExtendScript API (jsx tools)
- Documentation search (RAG system)
- Code generation and validation
- Project analysis and optimization
- File operations and batch processing

OUTPUT FORMAT:
Provide a JSON response with this exact structure:
{
  "task": "${task}",
  "approach": "High-level approach description",
  "steps": [
    {
      "id": "step_1",
      "description": "Specific action to perform",
      "requiredTools": ["tool_name_if_any"],
      "expectedOutcome": "What should be achieved",
      "dependencies": ["previous_step_ids"],
      "estimatedTime": "1-5 minutes",
      "validationCriteria": "How to verify success"
    }
  ],
  "completionCriteria": [
    "Specific measurable criteria for task completion"
  ],
  "successMetrics": [
    "How to measure if the task was successful"
  ],
  "estimatedIterations": ${Math.min(options.maxSteps, analysis.estimatedSteps)},
  "fallbackPlan": "What to do if primary approach fails"
}

SPECIALIZATION GUIDANCE:`;

    // Add specialized guidance based on task category
    switch (analysis.category) {
      case 'scripting':
        return basePrompt + `
- Focus on ExtendScript best practices
- Include code validation and testing steps
- Consider error handling and user feedback
- Plan for incremental development and testing`;

      case 'automation':
        return basePrompt + `
- Design for batch processing and efficiency
- Include progress tracking and user feedback
- Plan for error recovery and continuation
- Consider file system operations and safety`;

      case 'optimization':
        return basePrompt + `
- Include analysis and measurement steps
- Plan for before/after comparisons
- Focus on performance metrics
- Include verification of maintained functionality`;

      case 'effects':
        return basePrompt + `
- Consider layer hierarchies and dependencies
- Plan for property manipulation and keyframes
- Include preview and review steps
- Account for render impacts`;

      default:
        return basePrompt + `
- Break down into logical, sequential steps
- Include validation and feedback at each stage
- Plan for user review and approval points
- Consider After Effects project structure`;
    }
  };

  // Call AI service to generate plan
  const callPlanningAI = async (prompt: string, model: string): Promise<any> => {
    // For now, return a mock response - in real implementation, this would call the WebSocket
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          task: "Mock planning task",
          approach: "Systematic step-by-step approach",
          steps: [
            {
              id: "step_1",
              description: "Analyze current project structure",
              requiredTools: ["project_analyzer"],
              expectedOutcome: "Understanding of project components",
              dependencies: [],
              estimatedTime: "2 minutes",
              validationCriteria: "Project structure is documented"
            },
            {
              id: "step_2", 
              description: "Implement requested changes",
              requiredTools: ["script_generator"],
              expectedOutcome: "Changes applied to project",
              dependencies: ["step_1"],
              estimatedTime: "3-5 minutes",
              validationCriteria: "Changes are visible and functional"
            }
          ],
          completionCriteria: ["Task objective is achieved", "No errors in execution"],
          successMetrics: ["User satisfaction", "Functional result"],
          estimatedIterations: 3,
          fallbackPlan: "Manual step-by-step guidance if automation fails"
        });
      }, 1000);
    });
  };

  // Validate and structure the AI response into a proper AgentPlan
  const validateAndStructurePlan = (response: any, originalTask: string): AgentPlan => {
    // Ensure we have required fields
    const steps: AgentStep[] = (response.steps || []).map((step: any, index: number) => ({
      id: step.id || `step_${index + 1}`,
      description: step.description || `Step ${index + 1}`,
      requiredTools: Array.isArray(step.requiredTools) ? step.requiredTools : [],
      expectedOutcome: step.expectedOutcome || 'Progress towards task completion',
      isComplete: false,
      result: undefined,
      reasoning: step.validationCriteria || undefined
    }));

    const plan: AgentPlan = {
      id: `plan_${Date.now()}`,
      task: response.task || originalTask,
      steps,
      completionCriteria: Array.isArray(response.completionCriteria) 
        ? response.completionCriteria 
        : ['Task completed successfully'],
      estimatedIterations: Math.max(1, Math.min(20, response.estimatedIterations || steps.length)),
      currentStepIndex: 0
    };

    // Validate that we have at least one step
    if (plan.steps.length === 0) {
      plan.steps.push({
        id: 'step_1',
        description: originalTask,
        requiredTools: [],
        expectedOutcome: 'Task completed',
        isComplete: false
      });
    }

    return plan;
  };

  // Update plan based on execution results
  const updatePlan = useCallback((
    plan: AgentPlan, 
    stepId: string, 
    result: string, 
    shouldAddSteps: boolean = false
  ): AgentPlan => {
    const updatedPlan = { ...plan };
    
    // Mark current step as complete
    const stepIndex = updatedPlan.steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      updatedPlan.steps[stepIndex] = {
        ...updatedPlan.steps[stepIndex],
        isComplete: true,
        result
      };
    }
    
    // Add additional steps if needed based on execution results
    if (shouldAddSteps) {
      const additionalSteps = generateAdditionalSteps(result, updatedPlan);
      updatedPlan.steps.push(...additionalSteps);
    }
    
    return updatedPlan;
  }, []);

  // Generate additional steps based on execution results
  const generateAdditionalSteps = (result: string, plan: AgentPlan): AgentStep[] => {
    // Analyze result to determine if additional steps are needed
    const resultLower = result.toLowerCase();
    const additionalSteps: AgentStep[] = [];
    
    // Example logic for common scenarios
    if (resultLower.includes('error') || resultLower.includes('failed')) {
      additionalSteps.push({
        id: `error_recovery_${Date.now()}`,
        description: 'Analyze and recover from error',
        requiredTools: ['error_analyzer'],
        expectedOutcome: 'Error resolved or alternative approach identified',
        isComplete: false
      });
    }
    
    if (resultLower.includes('partial') || resultLower.includes('incomplete')) {
      additionalSteps.push({
        id: `completion_step_${Date.now()}`,
        description: 'Complete remaining work',
        requiredTools: [],
        expectedOutcome: 'Task fully completed',
        isComplete: false
      });
    }
    
    return additionalSteps;
  };

  // Evaluate plan completion
  const evaluatePlanCompletion = useCallback((plan: AgentPlan): {
    isComplete: boolean;
    completionPercentage: number;
    remainingSteps: AgentStep[];
    reasoning: string;
  } => {
    const completedSteps = plan.steps.filter(step => step.isComplete);
    const completionPercentage = (completedSteps.length / plan.steps.length) * 100;
    const remainingSteps = plan.steps.filter(step => !step.isComplete);
    
    const isComplete = completionPercentage === 100;
    
    let reasoning = '';
    if (isComplete) {
      reasoning = 'All planned steps have been completed successfully';
    } else {
      reasoning = `${completedSteps.length}/${plan.steps.length} steps completed. ${remainingSteps.length} steps remaining.`;
    }
    
    return {
      isComplete,
      completionPercentage,
      remainingSteps,
      reasoning
    };
  }, []);

  return {
    createExecutionPlan,
    updatePlan,
    evaluatePlanCompletion,
    analyzeTask
  };
};

export default useAgentPlanner;