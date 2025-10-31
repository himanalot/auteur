// Global type declarations for CEP extension

declare global {
  interface Window {
    simpleChatManager: {
      sendMessage: (message: string, model?: string) => Promise<string>;
      clearChat: () => void;
      currentModel: string;
    };
    SimpleChatManager: new () => any;
    geminiChat: {
      sendMessage: (message: string) => Promise<string>;
      clearConversation: () => void;
    };
    GeminiChat: new () => any;
    scriptRunner: {
      runScript: (script: string) => Promise<string>;
    };
    ragTool: {
      query: (query: string) => Promise<string>;
    };
    CSInterface: any;
  }
}

export {};