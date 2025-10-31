import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppState {
  activeTab: string;
  apiKeys: {
    gemini: string;
    openai: string;
    claude: string;
  };
  selectedModel: string;
  debugMode: boolean;
  isProcessing: boolean;
  status: string;
}

const initialState: AppState = {
  activeTab: 'ai',
  apiKeys: {
    gemini: localStorage.getItem('gemini_api_key') || '',
    openai: localStorage.getItem('openai_api_key') || '',
    claude: localStorage.getItem('claude_api_key') || '',
  },
  selectedModel: 'gemini',
  debugMode: false,
  isProcessing: false,
  status: 'Ready',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setApiKey: (state, action: PayloadAction<{ provider: keyof AppState['apiKeys']; key: string }>) => {
      state.apiKeys[action.payload.provider] = action.payload.key;
      localStorage.setItem(`${action.payload.provider}_api_key`, action.payload.key);
    },
    setSelectedModel: (state, action: PayloadAction<string>) => {
      state.selectedModel = action.payload;
    },
    setDebugMode: (state, action: PayloadAction<boolean>) => {
      state.debugMode = action.payload;
    },
    setIsProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
    setStatus: (state, action: PayloadAction<string>) => {
      state.status = action.payload;
    },
  },
});

export const { setActiveTab, setApiKey, setSelectedModel, setDebugMode, setIsProcessing, setStatus } = appSlice.actions;
export default appSlice.reducer;