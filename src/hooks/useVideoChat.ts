import { useState, useCallback } from 'react';
import useAIChat, { ChatMessage } from './useAIChat';
import useFileUpload, { UploadedFile } from './useFileUpload';

interface VideoChatOptions {
  model?: string;
  frameRate?: number;
  wsUrl?: string;
  uploadEndpoint?: string;
  maxFileSize?: number;
}

interface VideoChatHook {
  // Chat functionality
  messages: ChatMessage[];
  isProcessing: boolean;
  isConnected: boolean;
  connectionStatus: string;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  
  // File management
  uploadedFiles: UploadedFile[];
  isUploading: boolean;
  uploadFile: (file: File) => Promise<UploadedFile>;
  uploadFiles: (files: File[]) => Promise<UploadedFile[]>;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  
  // Model and settings
  selectedModel: string;
  setModel: (model: string) => void;
  frameRate: number;
  setFrameRate: (rate: number) => void;
  
  // Utilities
  formatMessage: (content: string) => string;
  formatFileSize: (bytes: number) => string;
  validateFile: (file: File) => { valid: boolean; error?: string };
  
  // Drag and drop
  isDragActive: boolean;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  
  error: string | null;
}

const useVideoChat = (options: VideoChatOptions = {}): VideoChatHook => {
  const {
    model: defaultModel = 'gemini-2.0-flash',
    frameRate: defaultFrameRate = 1,
    wsUrl,
    uploadEndpoint,
    maxFileSize = 2 * 1024 * 1024 * 1024 // 2GB
  } = options;

  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [frameRate, setFrameRate] = useState(defaultFrameRate);
  const [isDragActive, setIsDragActive] = useState(false);

  // Initialize AI Chat hook
  const {
    messages,
    isProcessing,
    isConnected,
    connectionStatus,
    sendMessage: aiSendMessage,
    clearChat: aiClearChat,
    formatMessage,
    error: chatError
  } = useAIChat({
    model: selectedModel,
    wsUrl,
    systemPrompt: "You are a video-understanding AI assistant. You can analyze videos, images, and answer questions about visual content."
  });

  // Initialize File Upload hook
  const {
    uploadedFiles,
    isUploading,
    uploadFile: fileUploadFile,
    uploadFiles: fileUploadFiles,
    removeFile,
    clearFiles: fileClearFiles,
    formatFileSize,
    validateFile
  } = useFileUpload({
    endpoint: uploadEndpoint,
    maxFileSize,
    allowedTypes: ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/webm', 'image/jpeg', 'image/png', 'image/webp'],
    frameRate: frameRate
  });

  // Enhanced send message that includes video files
  const sendMessage = useCallback(async (content: string): Promise<void> => {
    await aiSendMessage(content, {
      files: uploadedFiles,
      frameRate: frameRate,
      model: selectedModel
    });
  }, [aiSendMessage, uploadedFiles, frameRate, selectedModel]);

  // Enhanced clear chat that also clears files
  const clearChat = useCallback(() => {
    aiClearChat("Hi! I'm a video-understanding AI assistant powered by Gemini. I can analyze videos, images, and answer questions about visual content. Upload a video file and ask me about what I see!");
    fileClearFiles();
  }, [aiClearChat, fileClearFiles]);

  // File upload with frame rate
  const uploadFile = useCallback(async (file: File): Promise<UploadedFile> => {
    return await fileUploadFile(file, { frameRate });
  }, [fileUploadFile, frameRate]);

  const uploadFiles = useCallback(async (files: File[]): Promise<UploadedFile[]> => {
    return await fileUploadFiles(files, { frameRate });
  }, [fileUploadFiles, frameRate]);

  // Model selection with validation for video models
  const setModel = useCallback((model: string) => {
    const videoModels = [
      'gemini-2.0-flash',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ];
    
    if (videoModels.includes(model)) {
      setSelectedModel(model);
      console.log(`🎥 Video chat model changed to: ${model}`);
    } else {
      console.warn(`⚠️ Model ${model} may not support video analysis`);
      setSelectedModel(model);
    }
  }, []);

  // Frame rate management
  const setFrameRateWithValidation = useCallback((rate: number) => {
    const validRates = [0.5, 1, 2];
    if (validRates.includes(rate)) {
      setFrameRate(rate);
      console.log(`🎞️ Frame rate changed to: ${rate} FPS`);
    } else {
      console.warn(`⚠️ Invalid frame rate: ${rate}. Valid rates: ${validRates.join(', ')}`);
    }
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      try {
        await uploadFiles(files);
      } catch (error) {
        console.error('❌ Drag and drop upload failed:', error);
      }
    }
  }, [uploadFiles]);

  // Enhanced file validation for video content
  const enhancedValidateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    const baseValidation = validateFile(file);
    if (!baseValidation.valid) {
      return baseValidation;
    }

    // Additional video-specific validations
    if (file.type.startsWith('video/')) {
      // Check for common video formats
      const supportedVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/webm'];
      if (!supportedVideoTypes.includes(file.type)) {
        return {
          valid: false,
          error: `Unsupported video format: ${file.type}. Supported formats: MP4, MOV, AVI, WMV, WebM`
        };
      }
    }

    return { valid: true };
  }, [validateFile]);

  const error = chatError; // Use chat error as primary error source

  return {
    // Chat functionality
    messages,
    isProcessing,
    isConnected,
    connectionStatus,
    sendMessage,
    clearChat,
    
    // File management
    uploadedFiles,
    isUploading,
    uploadFile,
    uploadFiles,
    removeFile,
    clearFiles: fileClearFiles,
    
    // Model and settings
    selectedModel,
    setModel,
    frameRate,
    setFrameRate: setFrameRateWithValidation,
    
    // Utilities
    formatMessage,
    formatFileSize,
    validateFile: enhancedValidateFile,
    
    // Drag and drop
    isDragActive,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    
    error
  };
};

export default useVideoChat;
export type { VideoChatOptions, VideoChatHook };