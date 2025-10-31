  /**
   * Main entry point for chat conversations
   */
  async streamChat(message, options = {}) {
    const {
      model = 'claude',
      conversation = [],
      onContentDelta = () => {},
      onToolCall = () => {},
      onToolResult = () => {},
      onComplete = () => {},
      onError = () => {}
    } = options;

    try {
      console.log(`🎯 AI Router: Starting chat with ${model}`);
      console.log(`🎯 AI Router: Message preview: "${message.substring(0, 100)}..."`);
      
      // Check if this is an autonomous agent request
      const isAutonomousMode = message.includes('AUTONOMOUS AGENT MODE:');
      console.log(`🎯 AI Router: Contains 'AUTONOMOUS AGENT MODE:': ${isAutonomousMode}`);
      
      if (isAutonomousMode) {
        console.log('🤖 AUTONOMOUS MODE DETECTED - Using autonomous chat handler');
        return await this.handleAutonomousChat(message, options);
      } else {
        console.log('📝 Regular chat mode detected - using simple chat handler');
        return await this.handleSimpleChat(message, options);
      }
      
    } catch (error) {
      console.error('❌ AI Router error:', error);
      onError(error);
    }
  }