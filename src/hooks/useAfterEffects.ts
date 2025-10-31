import { useState, useEffect, useCallback } from 'react';
import afterEffectsService, { AEScriptResult, AEScriptOptions } from '../services/afterEffectsService';

interface ProjectInfo {
  name: string;
  numItems: number;
  activeItem: string | null;
  renderQueue: number;
}

interface Composition {
  name: string;
  duration: number;
  frameRate: number;
  width: number;
  height: number;
}

interface Layer {
  name: string;
  index: number;
  enabled: boolean;
  locked: boolean;
  inPoint: number;
  outPoint: number;
}

interface UseAfterEffectsHook {
  // Connection status
  isConnected: boolean;
  connectionStatus: string;
  
  // Project data
  projectInfo: ProjectInfo | null;
  compositions: Composition[];
  selectedLayers: Layer[];
  
  // Loading states
  isExecuting: boolean;
  isLoadingProject: boolean;
  isLoadingCompositions: boolean;
  isLoadingLayers: boolean;
  
  // Actions
  executeScript: (script: string, options?: AEScriptOptions) => Promise<AEScriptResult>;
  executeTool: (toolName: string, parameters?: Record<string, any>, options?: AEScriptOptions) => Promise<AEScriptResult>;
  refreshProjectInfo: () => Promise<void>;
  refreshCompositions: () => Promise<void>;
  refreshSelectedLayers: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Error handling
  lastError: string | null;
  clearError: () => void;
}

const useAfterEffects = (): UseAfterEffectsHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Checking connection...');
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [selectedLayers, setSelectedLayers] = useState<Layer[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [isLoadingCompositions, setIsLoadingCompositions] = useState(false);
  const [isLoadingLayers, setIsLoadingLayers] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Subscribe to connection changes
  useEffect(() => {
    afterEffectsService.onConnectionChange((connected) => {
      setIsConnected(connected);
      setConnectionStatus(afterEffectsService.getConnectionStatus());
      
      if (connected) {
        // Auto-refresh data when connected
        refreshAll();
      } else {
        // Clear data when disconnected
        setProjectInfo(null);
        setCompositions([]);
        setSelectedLayers([]);
      }
    });
  }, []);

  const executeScript = useCallback(async (
    script: string, 
    options?: AEScriptOptions
  ): Promise<AEScriptResult> => {
    setIsExecuting(true);
    setLastError(null);
    
    try {
      const result = await afterEffectsService.executeScript(script, options);
      
      if (!result.success && result.error) {
        setLastError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const executeTool = useCallback(async (
    toolName: string, 
    parameters: Record<string, any> = {},
    options?: AEScriptOptions
  ): Promise<AEScriptResult> => {
    setIsExecuting(true);
    setLastError(null);
    
    try {
      const result = await afterEffectsService.executeTool(toolName, parameters, options);
      
      if (!result.success && result.error) {
        setLastError(result.error);
      }
      
      // Auto-refresh data after tool execution
      if (result.success) {
        setTimeout(() => {
          refreshAll();
        }, 100);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const refreshProjectInfo = useCallback(async (): Promise<void> => {
    if (!isConnected) return;
    
    setIsLoadingProject(true);
    setLastError(null);
    
    try {
      const result = await afterEffectsService.getProjectInfo();
      
      if (result.success && result.data) {
        setProjectInfo(result.data);
      } else if (result.error) {
        setLastError(result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get project info';
      setLastError(errorMessage);
    } finally {
      setIsLoadingProject(false);
    }
  }, [isConnected]);

  const refreshCompositions = useCallback(async (): Promise<void> => {
    if (!isConnected) return;
    
    setIsLoadingCompositions(true);
    setLastError(null);
    
    try {
      const result = await afterEffectsService.getCompositions();
      
      if (result.success && result.data) {
        setCompositions(result.data);
      } else if (result.error) {
        setLastError(result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get compositions';
      setLastError(errorMessage);
    } finally {
      setIsLoadingCompositions(false);
    }
  }, [isConnected]);

  const refreshSelectedLayers = useCallback(async (): Promise<void> => {
    if (!isConnected) return;
    
    setIsLoadingLayers(true);
    setLastError(null);
    
    try {
      const result = await afterEffectsService.getSelectedLayers();
      
      if (result.success && result.data) {
        setSelectedLayers(result.data);
      } else if (result.error) {
        setLastError(result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get selected layers';
      setLastError(errorMessage);
    } finally {
      setIsLoadingLayers(false);
    }
  }, [isConnected]);

  const refreshAll = useCallback(async (): Promise<void> => {
    await Promise.all([
      refreshProjectInfo(),
      refreshCompositions(),
      refreshSelectedLayers()
    ]);
  }, [refreshProjectInfo, refreshCompositions, refreshSelectedLayers]);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  return {
    // Connection status
    isConnected,
    connectionStatus,
    
    // Project data
    projectInfo,
    compositions,
    selectedLayers,
    
    // Loading states
    isExecuting,
    isLoadingProject,
    isLoadingCompositions,
    isLoadingLayers,
    
    // Actions
    executeScript,
    executeTool,
    refreshProjectInfo,
    refreshCompositions,
    refreshSelectedLayers,
    refreshAll,
    
    // Error handling
    lastError,
    clearError
  };
};

export default useAfterEffects;
export type { 
  UseAfterEffectsHook, 
  ProjectInfo, 
  Composition, 
  Layer 
};