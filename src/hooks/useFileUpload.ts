import { useState, useCallback } from 'react';

interface UploadedFile {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  frameRate: number;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface FileUploadOptions {
  endpoint?: string;
  maxFileSize?: number;
  allowedTypes?: string[];
  frameRate?: number;
}

interface FileUploadHook {
  uploadedFiles: UploadedFile[];
  uploadProgress: Record<string, UploadProgress>;
  isUploading: boolean;
  uploadFile: (file: File, options?: { frameRate?: number }) => Promise<UploadedFile>;
  uploadFiles: (files: File[], options?: { frameRate?: number }) => Promise<UploadedFile[]>;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  formatFileSize: (bytes: number) => string;
  validateFile: (file: File) => { valid: boolean; error?: string };
}

const useFileUpload = (options: FileUploadOptions = {}): FileUploadHook => {
  const {
    endpoint = 'http://localhost:3001/api/upload/video',
    maxFileSize = 2 * 1024 * 1024 * 1024, // 2GB
    allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/webm', 'image/jpeg', 'image/png', 'image/webp'],
    frameRate: defaultFrameRate = 1
  } = options;

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    // Check file size
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${formatFileSize(maxFileSize)}`
      };
    }

    return { valid: true };
  }, [allowedTypes, maxFileSize, formatFileSize]);

  const uploadFile = useCallback(async (
    file: File, 
    options: { frameRate?: number } = {}
  ): Promise<UploadedFile> => {
    const { frameRate = defaultFrameRate } = options;
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize progress tracking
    setUploadProgress(prev => ({
      ...prev,
      [fileId]: {
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      }
    }));

    setIsUploading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('frameRate', frameRate.toString());

      // Upload file with progress tracking
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Create uploaded file object
      const uploadedFile: UploadedFile = {
        fileId: result.fileId || fileId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        frameRate: frameRate
      };

      // Update progress to completed
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: {
          fileName: file.name,
          progress: 100,
          status: 'completed'
        }
      }));

      // Add to uploaded files
      setUploadedFiles(prev => [...prev, uploadedFile]);

      return uploadedFile;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      
      // Update progress to error
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: {
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: errorMessage
        }
      }));

      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [endpoint, defaultFrameRate, validateFile]);

  const uploadFiles = useCallback(async (
    files: File[], 
    options: { frameRate?: number } = {}
  ): Promise<UploadedFile[]> => {
    const uploadPromises = files.map(file => uploadFile(file, options));
    
    try {
      const results = await Promise.allSettled(uploadPromises);
      const successfulUploads: UploadedFile[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulUploads.push(result.value);
        } else {
          errors.push(`${files[index].name}: ${result.reason.message}`);
        }
      });

      if (errors.length > 0) {
        console.warn('Some files failed to upload:', errors);
      }

      return successfulUploads;
    } catch (error) {
      console.error('Failed to upload files:', error);
      throw error;
    }
  }, [uploadFile]);

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.fileId !== fileId));
    
    // Clean up progress tracking
    setUploadProgress(prev => {
      const { [fileId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
    setUploadProgress({});
  }, []);

  return {
    uploadedFiles,
    uploadProgress,
    isUploading,
    uploadFile,
    uploadFiles,
    removeFile,
    clearFiles,
    formatFileSize,
    validateFile
  };
};

export default useFileUpload;
export type { UploadedFile, UploadProgress, FileUploadOptions, FileUploadHook };