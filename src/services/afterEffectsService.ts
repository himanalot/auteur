/**
 * After Effects Integration Service
 * Handles communication with After Effects ExtendScript (JSX) backend
 */

interface AEScriptResult {
  success: boolean;
  data?: any;
  error?: string;
  logs?: string[];
}

interface AEScriptOptions {
  undoGroupName?: string;
  timeout?: number;
  silent?: boolean;
}

class AfterEffectsService {
  private static instance: AfterEffectsService;
  private isConnected: boolean = false;
  private connectionCallbacks: Array<(connected: boolean) => void> = [];

  private constructor() {
    this.checkConnection();
  }

  public static getInstance(): AfterEffectsService {
    if (!AfterEffectsService.instance) {
      AfterEffectsService.instance = new AfterEffectsService();
    }
    return AfterEffectsService.instance;
  }

  /**
   * Check if we're connected to After Effects
   */
  private async checkConnection(): Promise<void> {
    try {
      // For now, assume we're always connected in development
      // In a real CEP extension, this would check the CSInterface
      this.isConnected = true;
      this.notifyConnectionChange();
    } catch (error) {
      this.isConnected = false;
      this.notifyConnectionChange();
    }
  }

  /**
   * Subscribe to connection status changes
   */
  public onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.push(callback);
    callback(this.isConnected); // Call immediately with current status
  }

  /**
   * Notify subscribers of connection changes
   */
  private notifyConnectionChange(): void {
    this.connectionCallbacks.forEach(callback => callback(this.isConnected));
  }

  /**
   * Execute a JSX script in After Effects
   */
  public async executeScript(
    scriptContent: string, 
    options: AEScriptOptions = {}
  ): Promise<AEScriptResult> {
    const {
      undoGroupName = 'Script Execution',
      timeout = 30000,
      silent = false
    } = options;

    if (!this.isConnected) {
      return {
        success: false,
        error: 'Not connected to After Effects'
      };
    }

    try {
      // Wrap script in undo group and error handling
      const wrappedScript = this.wrapScript(scriptContent, undoGroupName);
      
      if (!silent) {
        console.log('🎬 Executing After Effects script:', undoGroupName);
      }

      // In a real implementation, this would use CSInterface to execute
      // For now, we'll simulate the execution
      const result = await this.simulateScriptExecution(wrappedScript, timeout);
      
      if (!silent) {
        if (result.success) {
          console.log('✅ Script executed successfully');
        } else {
          console.error('❌ Script execution failed:', result.error);
        }
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Script execution error:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Execute a specific tool by name
   */
  public async executeTool(
    toolName: string, 
    parameters: Record<string, any> = {},
    options: AEScriptOptions = {}
  ): Promise<AEScriptResult> {
    const script = this.generateToolScript(toolName, parameters);
    return this.executeScript(script, {
      undoGroupName: `Execute ${toolName}`,
      ...options
    });
  }

  /**
   * Get project information
   */
  public async getProjectInfo(): Promise<AEScriptResult> {
    const script = `
      try {
        var project = app.project;
        var result = {
          name: project.file ? project.file.name : 'Untitled',
          numItems: project.numItems,
          activeItem: project.activeItem ? project.activeItem.name : null,
          renderQueue: project.renderQueue.numItems
        };
        JSON.stringify({ success: true, data: result });
      } catch (e) {
        JSON.stringify({ success: false, error: e.toString() });
      }
    `;

    return this.executeScript(script, { 
      undoGroupName: 'Get Project Info',
      silent: true 
    });
  }

  /**
   * Get composition list
   */
  public async getCompositions(): Promise<AEScriptResult> {
    const script = `
      try {
        var project = app.project;
        var comps = [];
        
        for (var i = 1; i <= project.numItems; i++) {
          var item = project.item(i);
          if (item instanceof CompItem) {
            comps.push({
              name: item.name,
              duration: item.duration,
              frameRate: item.frameRate,
              width: item.width,
              height: item.height
            });
          }
        }
        
        JSON.stringify({ success: true, data: comps });
      } catch (e) {
        JSON.stringify({ success: false, error: e.toString() });
      }
    `;

    return this.executeScript(script, { 
      undoGroupName: 'Get Compositions',
      silent: true 
    });
  }

  /**
   * Get selected layers information
   */
  public async getSelectedLayers(): Promise<AEScriptResult> {
    const script = `
      try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
          throw new Error('No active composition');
        }
        
        var layers = [];
        var selectedLayers = comp.selectedLayers;
        
        for (var i = 0; i < selectedLayers.length; i++) {
          var layer = selectedLayers[i];
          layers.push({
            name: layer.name,
            index: layer.index,
            enabled: layer.enabled,
            locked: layer.locked,
            inPoint: layer.inPoint,
            outPoint: layer.outPoint
          });
        }
        
        JSON.stringify({ success: true, data: layers });
      } catch (e) {
        JSON.stringify({ success: false, error: e.toString() });
      }
    `;

    return this.executeScript(script, { 
      undoGroupName: 'Get Selected Layers',
      silent: true 
    });
  }

  /**
   * Wrap script with error handling and undo group
   */
  private wrapScript(script: string, undoGroupName: string): string {
    return `
      app.beginUndoGroup("${undoGroupName}");
      
      try {
        ${script}
      } catch (e) {
        app.endUndoGroup();
        JSON.stringify({ 
          success: false, 
          error: e.toString(),
          line: e.line || 'unknown'
        });
      }
      
      app.endUndoGroup();
    `;
  }

  /**
   * Generate script for a specific tool
   */
  private generateToolScript(toolName: string, parameters: Record<string, any>): string {
    // This would generate the appropriate JSX script based on the tool
    // For now, we'll create a basic template
    return `
      // Execute tool: ${toolName}
      // Parameters: ${JSON.stringify(parameters)}
      
      try {
        // Tool implementation would go here
        alert("Executing ${toolName} with parameters: " + JSON.stringify(${JSON.stringify(parameters)}));
        JSON.stringify({ success: true, data: "Tool executed successfully" });
      } catch (e) {
        JSON.stringify({ success: false, error: e.toString() });
      }
    `;
  }

  /**
   * Simulate script execution for development
   */
  private async simulateScriptExecution(
    script: string, 
    timeout: number
  ): Promise<AEScriptResult> {
    return new Promise((resolve) => {
      // Simulate async execution
      setTimeout(() => {
        // For development, always return success
        resolve({
          success: true,
          data: 'Script simulation completed',
          logs: ['Script executed in simulation mode']
        });
      }, Math.random() * 1000); // Random delay 0-1 second
    });
  }

  /**
   * Check if After Effects is available
   */
  public isAfterEffectsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection status string
   */
  public getConnectionStatus(): string {
    return this.isConnected 
      ? 'Connected to After Effects' 
      : 'After Effects not available';
  }
}

// Export singleton instance
export const afterEffectsService = AfterEffectsService.getInstance();
export default afterEffectsService;

// Export types
export type { AEScriptResult, AEScriptOptions };