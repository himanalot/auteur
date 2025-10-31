import { useCallback } from 'react';
import { AgentPlan, AgentStep } from './useAutonomousAgent';

export interface EvaluationResult {
  isComplete: boolean;
  confidence: number; // 0-1
  quality: number; // 0-1
  shouldContinue: boolean;
  reasoning: string;
  recommendations: string[];
  finalResult?: string;
  nextAction?: string;
  issuesFound: string[];
  improvementSuggestions: string[];
}

export interface EvaluationCriteria {
  minimumConfidence: number;
  qualityThreshold: number;
  mustMeetAllCriteria: boolean;
  allowPartialCompletion: boolean;
}

const useAgentEvaluator = () => {

  // Main evaluation function
  const evaluateCompletion = useCallback(async (
    plan: AgentPlan,
    currentResult: string,
    criteria: EvaluationCriteria = {
      minimumConfidence: 0.8,
      qualityThreshold: 0.7,
      mustMeetAllCriteria: true,
      allowPartialCompletion: false
    }
  ): Promise<EvaluationResult> => {
    try {
      // Analyze current progress
      const progressAnalysis = analyzeProgress(plan);
      
      // Evaluate task completion
      const completionEvaluation = await evaluateTaskCompletion(
        plan.task,
        currentResult,
        plan.completionCriteria
      );
      
      // Assess result quality
      const qualityAssessment = assessResultQuality(
        plan.task,
        currentResult,
        plan.steps
      );
      
      // Make final determination
      const finalEvaluation = makeFinalDecision(
        progressAnalysis,
        completionEvaluation,
        qualityAssessment,
        criteria
      );
      
      return finalEvaluation;
      
    } catch (error) {
      console.error('Evaluation error:', error);
      return {
        isComplete: false,
        confidence: 0,
        quality: 0,
        shouldContinue: true,
        reasoning: `Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendations: ['Retry evaluation', 'Check system status'],
        issuesFound: ['Evaluation system error'],
        improvementSuggestions: ['Ensure all systems are functioning properly']
      };
    }
  }, []);

  // Analyze current progress through completed steps
  const analyzeProgress = (plan: AgentPlan) => {
    const totalSteps = plan.steps.length;
    const completedSteps = plan.steps.filter(step => step.isComplete).length;
    const currentStepIndex = plan.currentStepIndex;
    
    // Calculate progress metrics
    const completionPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    const progressRatio = totalSteps > 0 ? currentStepIndex / totalSteps : 0;
    
    // Analyze step quality
    const stepResults = plan.steps
      .filter(step => step.isComplete && step.result)
      .map(step => ({ id: step.id, result: step.result!, description: step.description }));
    
    // Check for issues in completed steps
    const issuesFound = [];
    const successfulSteps = [];
    
    for (const step of stepResults) {
      if (step.result.toLowerCase().includes('error') || 
          step.result.toLowerCase().includes('failed') ||
          step.result.toLowerCase().includes('unable')) {
        issuesFound.push(`Step ${step.id}: ${step.result}`);
      } else {
        successfulSteps.push(step.id);
      }
    }
    
    return {
      totalSteps,
      completedSteps,
      currentStepIndex,
      completionPercentage,
      progressRatio,
      stepResults,
      issuesFound,
      successfulSteps,
      hasErrors: issuesFound.length > 0
    };
  };

  // Evaluate if the task meets completion criteria
  const evaluateTaskCompletion = async (
    originalTask: string,
    currentResult: string,
    completionCriteria: string[]
  ) => {
    // Create evaluation prompt
    const evaluationPrompt = `
You are evaluating whether an AI agent has successfully completed a task.

ORIGINAL TASK: ${originalTask}

CURRENT RESULT: ${currentResult}

COMPLETION CRITERIA:
${completionCriteria.map((criterion, index) => `${index + 1}. ${criterion}`).join('\n')}

EVALUATION QUESTIONS:
1. Has the original task been fulfilled? (Consider the intent, not just literal completion)
2. Are all completion criteria satisfied?
3. Is the result functionally correct and usable?
4. Would a user be satisfied with this outcome?
5. What is your confidence level in this assessment? (0-1)

Provide your assessment as JSON:
{
  "taskFulfilled": boolean,
  "criteriaMatched": [boolean array matching completion criteria],
  "functionallyCorrect": boolean,
  "userSatisfaction": number (0-1),
  "confidence": number (0-1),
  "reasoning": "detailed explanation",
  "missingElements": ["what's missing if incomplete"],
  "strengths": ["what was done well"],
  "weaknesses": ["what could be improved"]
}
`;

    // For now, return mock evaluation - real implementation would call AI service
    return new Promise<any>((resolve) => {
      setTimeout(() => {
        // Mock analysis based on simple heuristics
        const hasError = currentResult.toLowerCase().includes('error');
        const hasSuccess = currentResult.toLowerCase().includes('success') || 
                          currentResult.toLowerCase().includes('complete');
        
        resolve({
          taskFulfilled: hasSuccess && !hasError,
          criteriaMatched: completionCriteria.map(() => hasSuccess),
          functionallyCorrect: !hasError,
          userSatisfaction: hasSuccess ? 0.85 : 0.4,
          confidence: 0.8,
          reasoning: hasSuccess ? 
            'Task appears to be completed successfully based on result content' :
            'Task may be incomplete or have issues based on result content',
          missingElements: hasSuccess ? [] : ['Complete implementation', 'Error resolution'],
          strengths: hasSuccess ? ['Task completion', 'Functional result'] : [],
          weaknesses: hasError ? ['Error handling', 'Robustness'] : []
        });
      }, 500);
    });
  };

  // Assess the quality of the result
  const assessResultQuality = (
    originalTask: string,
    currentResult: string,
    steps: AgentStep[]
  ) => {
    const taskLower = originalTask.toLowerCase();
    const resultLower = currentResult.toLowerCase();
    
    let qualityScore = 0.5; // Base score
    const qualityFactors = [];
    const issues = [];
    
    // Positive quality indicators
    if (resultLower.includes('success') || resultLower.includes('complete')) {
      qualityScore += 0.2;
      qualityFactors.push('Successful completion indicated');
    }
    
    if (resultLower.includes('test') && resultLower.includes('pass')) {
      qualityScore += 0.15;
      qualityFactors.push('Tests passed');
    }
    
    if (resultLower.includes('optim') || resultLower.includes('improve')) {
      qualityScore += 0.1;
      qualityFactors.push('Optimization/improvement mentioned');
    }
    
    // Negative quality indicators
    if (resultLower.includes('error') || resultLower.includes('fail')) {
      qualityScore -= 0.3;
      issues.push('Errors detected in result');
    }
    
    if (resultLower.includes('partial') || resultLower.includes('incomplete')) {
      qualityScore -= 0.2;
      issues.push('Incomplete implementation');
    }
    
    if (resultLower.includes('warning') || resultLower.includes('issue')) {
      qualityScore -= 0.1;
      issues.push('Warnings or issues detected');
    }
    
    // Task-specific quality assessment
    if (taskLower.includes('script') || taskLower.includes('code')) {
      if (resultLower.includes('syntax') && resultLower.includes('valid')) {
        qualityScore += 0.15;
        qualityFactors.push('Valid syntax');
      }
      if (resultLower.includes('function') && resultLower.includes('work')) {
        qualityScore += 0.15;
        qualityFactors.push('Functions working correctly');
      }
    }
    
    if (taskLower.includes('automat') || taskLower.includes('batch')) {
      if (resultLower.includes('process') && resultLower.includes('all')) {
        qualityScore += 0.15;
        qualityFactors.push('Batch processing completed');
      }
    }
    
    // Ensure score is within bounds
    qualityScore = Math.max(0, Math.min(1, qualityScore));
    
    return {
      score: qualityScore,
      factors: qualityFactors,
      issues,
      assessment: qualityScore > 0.8 ? 'excellent' : 
                 qualityScore > 0.6 ? 'good' : 
                 qualityScore > 0.4 ? 'acceptable' : 'poor'
    };
  };

  // Make final completion decision
  const makeFinalDecision = (
    progressAnalysis: any,
    completionEvaluation: any,
    qualityAssessment: any,
    criteria: EvaluationCriteria
  ): EvaluationResult => {
    const { minimumConfidence, qualityThreshold, mustMeetAllCriteria, allowPartialCompletion } = criteria;
    
    // Calculate overall confidence
    const confidence = Math.min(
      completionEvaluation.confidence,
      progressAnalysis.hasErrors ? 0.6 : 0.9,
      qualityAssessment.score > qualityThreshold ? 0.9 : 0.7
    );
    
    // Determine if task is complete
    let isComplete = false;
    let shouldContinue = true;
    let reasoning = '';
    
    if (completionEvaluation.taskFulfilled && 
        qualityAssessment.score >= qualityThreshold && 
        confidence >= minimumConfidence) {
      isComplete = true;
      shouldContinue = false;
      reasoning = `Task completed successfully. Confidence: ${(confidence * 100).toFixed(1)}%, Quality: ${(qualityAssessment.score * 100).toFixed(1)}%`;
    } else if (allowPartialCompletion && 
               progressAnalysis.completionPercentage >= 80 && 
               qualityAssessment.score >= qualityThreshold * 0.8) {
      isComplete = true;
      shouldContinue = false;
      reasoning = `Task sufficiently completed (${progressAnalysis.completionPercentage.toFixed(1)}% progress). Quality acceptable.`;
    } else {
      reasoning = `Task not yet complete. Issues: ${
        confidence < minimumConfidence ? 'Low confidence. ' : ''
      }${
        qualityAssessment.score < qualityThreshold ? 'Quality below threshold. ' : ''
      }${
        !completionEvaluation.taskFulfilled ? 'Task requirements not met. ' : ''
      }`;
    }
    
    // Generate recommendations
    const recommendations = [];
    if (!isComplete) {
      if (confidence < minimumConfidence) {
        recommendations.push('Improve confidence through additional verification');
      }
      if (qualityAssessment.score < qualityThreshold) {
        recommendations.push('Address quality issues identified');
      }
      if (progressAnalysis.hasErrors) {
        recommendations.push('Resolve errors from previous steps');
      }
      if (progressAnalysis.completionPercentage < 50) {
        recommendations.push('Continue with remaining planned steps');
      }
    } else {
      recommendations.push('Task completed successfully');
    }
    
    // Compile all issues
    const allIssues = [
      ...progressAnalysis.issuesFound,
      ...qualityAssessment.issues,
      ...(completionEvaluation.missingElements || [])
    ];
    
    // Generate improvement suggestions
    const improvementSuggestions = [
      ...qualityAssessment.factors.map((factor: string) => `Maintain: ${factor}`),
      ...(completionEvaluation.strengths || []).map((strength: string) => `Leverage: ${strength}`),
      ...(completionEvaluation.weaknesses || []).map((weakness: string) => `Improve: ${weakness}`)
    ];
    
    return {
      isComplete,
      confidence,
      quality: qualityAssessment.score,
      shouldContinue,
      reasoning,
      recommendations,
      finalResult: isComplete ? completionEvaluation.reasoning : undefined,
      nextAction: isComplete ? undefined : recommendations[0],
      issuesFound: allIssues,
      improvementSuggestions
    };
  };

  // Evaluate individual step completion
  const evaluateStepCompletion = useCallback((
    step: AgentStep,
    result: string
  ): { isComplete: boolean; quality: number; issues: string[] } => {
    const resultLower = result.toLowerCase();
    
    // Check for completion indicators
    const completionIndicators = ['complete', 'success', 'done', 'finished'];
    const errorIndicators = ['error', 'fail', 'unable', 'cannot'];
    
    const hasCompletion = completionIndicators.some(indicator => 
      resultLower.includes(indicator)
    );
    const hasErrors = errorIndicators.some(indicator => 
      resultLower.includes(indicator)
    );
    
    let quality = 0.5;
    const issues = [];
    
    if (hasCompletion && !hasErrors) {
      quality = 0.9;
    } else if (hasCompletion && hasErrors) {
      quality = 0.6;
      issues.push('Completed with errors');
    } else if (hasErrors) {
      quality = 0.2;
      issues.push('Failed with errors');
    }
    
    return {
      isComplete: hasCompletion || quality > 0.6,
      quality,
      issues
    };
  }, []);

  // Check if agent should continue or stop
  const shouldContinueExecution = useCallback((
    plan: AgentPlan,
    currentIteration: number,
    maxIterations: number,
    lastEvaluation?: EvaluationResult
  ): { shouldContinue: boolean; reason: string } => {
    // Check iteration limit
    if (currentIteration >= maxIterations) {
      return {
        shouldContinue: false,
        reason: 'Maximum iterations reached'
      };
    }
    
    // Check if task is complete
    if (lastEvaluation?.isComplete) {
      return {
        shouldContinue: false,
        reason: 'Task completed successfully'
      };
    }
    
    // Check if all steps are done
    if (plan.currentStepIndex >= plan.steps.length) {
      return {
        shouldContinue: false,
        reason: 'All planned steps completed'
      };
    }
    
    // Check for critical errors
    if (lastEvaluation?.confidence && lastEvaluation.confidence < 0.2) {
      return {
        shouldContinue: false,
        reason: 'Critical errors detected, manual intervention required'
      };
    }
    
    return {
      shouldContinue: true,
      reason: 'Continuing with next step'
    };
  }, []);

  return {
    evaluateCompletion,
    evaluateStepCompletion,
    shouldContinueExecution,
    assessResultQuality
  };
};

export default useAgentEvaluator;