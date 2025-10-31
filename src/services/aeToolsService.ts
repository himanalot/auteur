/**
 * After Effects Tools Service - Bridge for ExtendScript tool execution
 * This service provides the same tool execution capabilities as in commit 59c2434
 */

interface ToolResult {
  success: boolean;
  message: string;
  data?: any;
}

// Use existing global CSInterface declaration from global.d.ts

class AEToolsService {
  private csInterface: any = null;
  private isInCEP: boolean = false;

  constructor() {
    this.initializeCEP();
  }

  private initializeCEP() {
    // Check if we're in CEP environment
    this.isInCEP = typeof window.CSInterface !== 'undefined';
    
    if (this.isInCEP && window.CSInterface) {
      this.csInterface = new window.CSInterface();
      console.log('🔧 AE Tools Service: CEP interface initialized');
    } else {
      console.log('⚠️ AE Tools Service: Not in CEP environment, tool execution disabled');
    }
  }

  /**
   * Execute ExtendScript code in After Effects
   */
  private executeScript(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isInCEP || !this.csInterface) {
        console.warn('⚠️ Not in CEP environment, cannot execute script');
        resolve('{"success": false, "message": "Not in CEP environment"}');
        return;
      }

      this.csInterface.evalScript(script, (result: string) => {
        if (result === 'EvalScript error.') {
          console.error('❌ ExtendScript execution error');
          reject(new Error('ExtendScript execution error'));
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Load the consolidated AE tools JSX file
   */
  private async loadAETools(): Promise<void> {
    if (!this.isInCEP || !this.csInterface) {
      throw new Error('Not in CEP environment');
    }

    const extensionPath = this.csInterface.getSystemPath(this.csInterface.SystemPath?.EXTENSION || 0);
    const loadScript = `$.evalFile("${extensionPath}/jsx/ae_tools_consolidated.jsx")`;
    
    try {
      await this.executeScript(loadScript);
      console.log('🛠️ AE Tools loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load AE Tools:', error);
      throw error;
    }
  }

  /**
   * Execute a specific AI tool with parameters
   */
  async executeAITool(toolName: string, parameters: any = {}): Promise<ToolResult> {
    try {
      // Load AE tools first
      await this.loadAETools();
      
      // Execute the comprehensive AI tool function
      const script = `executeComprehensiveAITool("${toolName}", ${JSON.stringify(parameters || {})})`;
      const result = await this.executeScript(script);
      
      const parsedResult = JSON.parse(result);
      console.log('🛠️ Tool execution result:', parsedResult);
      
      return parsedResult;
    } catch (error) {
      console.error('🛠️ Tool execution error:', error);
      return {
        success: false,
        message: 'Error executing tool: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  /**
   * Get the tool catalog - all available tools
   */
  async getToolCatalog(): Promise<ToolResult> {
    return this.executeAITool('get_tool_catalog', {});
  }

  /**
   * Get detailed information about a specific tool
   */
  async getToolInfo(toolName: string): Promise<ToolResult> {
    return this.executeAITool('get_tool_info', { tool_name: toolName });
  }

  /**
   * Get current project status
   */
  async getProjectStatus(): Promise<ToolResult> {
    return this.executeAITool('get_project_status', {});
  }

  /**
   * Check if we're in CEP environment and tools are available
   */
  isAvailable(): boolean {
    return this.isInCEP && this.csInterface !== null;
  }

  /**
   * Get tool availability status
   */
  getStatus(): { available: boolean; environment: string; message: string } {
    if (this.isInCEP && this.csInterface) {
      return {
        available: true,
        environment: 'CEP',
        message: 'After Effects tools available'
      };
    } else {
      return {
        available: false,
        environment: 'Browser',
        message: 'After Effects tools not available (not in CEP environment)'
      };
    }
  }
}

// Create singleton instance
const aeToolsService = new AEToolsService();

export default aeToolsService;
export type { ToolResult };