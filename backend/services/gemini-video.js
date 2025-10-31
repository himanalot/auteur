/**
 * Gemini Video Understanding Service
 * Handles video uploads, processing, and chat with Gemini models
 */

const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class GeminiVideoService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        this.uploadedFiles = new Map(); // Store uploaded file metadata
        
        // Supported models with video capabilities
        this.videoModels = {
            'gemini-2.0-flash': {
                name: 'Gemini 2.0 Flash',
                contextWindow: 1000000,
                maxVideoDuration: 3600, // 1 hour
                pricing: { input: 0.00125, output: 0.005 }
            },
            'gemini-2.5-pro': {
                name: 'Gemini 2.5 Pro',
                contextWindow: 2000000,
                maxVideoDuration: 7200, // 2 hours  
                pricing: { input: 1.25, output: 10.0 }
            },
            'gemini-2.5-flash': {
                name: 'Gemini 2.5 Flash',
                contextWindow: 1000000,
                maxVideoDuration: 3600, // 1 hour
                pricing: { input: 0.00125, output: 0.005 }
            },
            'gemini-1.5-pro': {
                name: 'Gemini 1.5 Pro',
                contextWindow: 2000000,
                maxVideoDuration: 7200, // 2 hours
                pricing: { input: 3.5, output: 10.5 }
            },
            'gemini-1.5-flash': {
                name: 'Gemini 1.5 Flash',
                contextWindow: 1000000,
                maxVideoDuration: 3600, // 1 hour
                pricing: { input: 0.075, output: 0.30 }
            }
        };
    }

    /**
     * Upload a video file to Gemini Files API
     */
    async uploadVideo(filePath, originalName, mimeType, frameRate = 1) {
        try {
            console.log('🎥 Uploading video to Gemini Files API:', originalName);
            console.log('🎥 File path:', filePath);
            console.log('🎥 MIME type:', mimeType);
            console.log('🎥 Frame rate:', frameRate);
            
            // Check if API key is available
            if (!this.apiKey) {
                throw new Error('Gemini API key not configured');
            }
            
            // Check if file exists and is readable
            try {
                const stats = fs.statSync(filePath);
                console.log('🎥 File size:', stats.size, 'bytes');
            } catch (err) {
                throw new Error(`File not accessible: ${err.message}`);
            }
            
            // Get file size for resumable upload
            const stats = fs.statSync(filePath);
            const fileSize = stats.size;
            
            console.log('🔄 Starting resumable upload process for Gemini Files API...');
            
            // Step 1: Start resumable upload session
            const uploadInitUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files`;
            const metadata = {
                file: {
                    display_name: originalName
                }
            };

            console.log('📝 Upload metadata:', JSON.stringify(metadata));
            console.log('📊 File size:', fileSize, 'bytes');

            const initResponse = await fetch(uploadInitUrl, {
                method: 'POST',
                headers: {
                    'X-Goog-Api-Key': this.apiKey,
                    'X-Goog-Upload-Protocol': 'resumable',
                    'X-Goog-Upload-Command': 'start',
                    'X-Goog-Upload-Header-Content-Length': fileSize.toString(),
                    'X-Goog-Upload-Header-Content-Type': mimeType,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metadata)
            });

            if (!initResponse.ok) {
                const errorText = await initResponse.text();
                throw new Error(`Failed to start upload session: ${initResponse.status} - ${errorText}`);
            }

            // Get upload URL from response header
            const uploadSessionUrl = initResponse.headers.get('X-Goog-Upload-URL');
            if (!uploadSessionUrl) {
                throw new Error('No upload URL returned from Gemini API');
            }

            console.log('✅ Upload session started, URL:', uploadSessionUrl);

            // Step 2: Upload the file content
            const fileBuffer = fs.readFileSync(filePath);
            
            const uploadResponse = await fetch(uploadSessionUrl, {
                method: 'POST',
                headers: {
                    'X-Goog-Upload-Offset': '0',
                    'X-Goog-Upload-Command': 'upload, finalize',
                    'Content-Length': fileSize.toString()
                },
                body: fileBuffer
            });

            console.log('📊 Upload response status:', uploadResponse.status);
            console.log('📊 Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`File upload failed: ${uploadResponse.status} - ${errorText}`);
            }

            const response = uploadResponse;

            console.log('📊 Response status:', response.status);
            console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Gemini API response error:', response.status, errorText);
                throw new Error(`Gemini upload failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('📊 Gemini upload response:', JSON.stringify(result, null, 2));
            
            if (!result.file) {
                throw new Error('Invalid Gemini API response: missing file object');
            }
            
            console.log('✅ Video uploaded successfully:', result.file.name);
            console.log('📋 File details - Name:', result.file.name, 'URI:', result.file.uri, 'State:', result.file.state);

            // Store file metadata
            const fileData = {
                fileId: result.file.name,
                displayName: originalName,
                mimeType: mimeType,
                uri: result.file.uri,
                state: result.file.state,
                frameRate: frameRate,
                uploadTime: new Date().toISOString()
            };

            this.uploadedFiles.set(result.file.name, fileData);

            return {
                success: true,
                fileId: result.file.name,
                uri: result.file.uri,
                state: result.file.state,
                ...fileData
            };

        } catch (error) {
            console.error('❌ Video upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if uploaded file is ready for processing
     */
    async checkFileState(fileId) {
        try {
            // Handle fileId that may already include 'files/' prefix
            const cleanFileId = fileId.startsWith('files/') ? fileId.substring(6) : fileId;
            const checkUrl = `${this.baseUrl}/files/${cleanFileId}`;
            
            console.log('🔍 Checking file state for:', fileId);
            console.log('🌐 Check URL:', checkUrl);
            
            const response = await fetch(checkUrl, {
                headers: {
                    'X-Goog-Api-Key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`File state check failed: ${response.status}`);
            }

            const result = await response.json();
            return {
                success: true,
                state: result.state,
                name: result.name,
                uri: result.uri
            };

        } catch (error) {
            console.error('❌ File state check error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate content with video understanding
     */
    async chatWithVideo(message, files = [], model = 'gemini-2.0-flash', conversation = [], ragService = null) {
        try {
            console.log(`🎥 Starting video chat with ${model}`);
            console.log(`📁 Files: ${files.length}`);

            // Validate model
            if (!this.videoModels[model]) {
                throw new Error(`Unsupported model: ${model}`);
            }

            // Prepare file parts for API call
            const fileParts = [];
            for (const file of files) {
                // Check file state
                const fileState = await this.checkFileState(file.fileId);
                
                let fileUri;
                if (fileState.success && fileState.state === 'ACTIVE') {
                    // Use the file state URI for actively processed files
                    fileUri = fileState.uri;
                    console.log(`✅ Using active file: ${file.fileId}`);
                } else {
                    // For pre-processed files, construct the URI directly
                    fileUri = `https://generativelanguage.googleapis.com/v1beta/${file.fileId}`;
                    console.log(`🎬 Using pre-processed file: ${file.fileId}`);
                }

                fileParts.push({
                    file_data: {
                        mime_type: file.mimeType,
                        file_uri: fileUri
                    }
                });
            }

            // Build conversation content
            const contents = [];

            // Add conversation history (text only) - Last 20 messages for rich context
            const historyMessages = conversation.slice(-20);
            console.log(`📜 CONVERSATION HISTORY RECEIVED (${historyMessages.length} messages):`);
            console.log(JSON.stringify(historyMessages, null, 2));

            for (const msg of historyMessages) {
                if (msg.role === 'user' || msg.role === 'assistant') {
                    contents.push({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }]
                    });
                    console.log(`  ↳ ${msg.role}: ${msg.content.substring(0, 60)}...`);
                }
            }

            // Add current message with files
            console.log(`📨 CURRENT MESSAGE:`, message);
            const currentParts = [{ text: message }];
            currentParts.push(...fileParts);

            contents.push({
                role: 'user',
                parts: currentParts
            });

            console.log(`📝 Sending request to ${model} with ${fileParts.length} files`);

            const requestBody = {
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    topK: 32,
                    topP: 1,
                    maxOutputTokens: 8192
                },
                // Add function calling tools for video understanding
                tools: ragService ? [
                    {
                        function_declarations: [
                            {
                                name: "search_ae_documentation",
                                description: "Search the comprehensive After Effects ExtendScript documentation for API references, methods, properties, and examples",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        query: {
                                            type: "string",
                                            description: "Search query for After Effects scripting documentation"
                                        }
                                    },
                                    required: ["query"]
                                }
                            },
                            {
                                name: "exa_search",
                                description: "Search the web for current information, tutorials, examples, and solutions",
                                parameters: {
                                    type: "object", 
                                    properties: {
                                        query: {
                                            type: "string",
                                            description: "Web search query"
                                        }
                                    },
                                    required: ["query"]
                                }
                            },
                            {
                                name: "execute_extendscript",
                                description: "Execute After Effects ExtendScript code to automate tasks, create animations, manipulate layers, etc.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        script: {
                                            type: "string",
                                            description: "The ExtendScript code to execute in After Effects"
                                        },
                                        description: {
                                            type: "string", 
                                            description: "Description of what the script does"
                                        }
                                    },
                                    required: ["script", "description"]
                                }
                            }
                        ]
                    }
                ] : [],
                safetySettings: [
                    {
                        category: 'HARM_CATEGORY_HARASSMENT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    },
                    {
                        category: 'HARM_CATEGORY_HATE_SPEECH',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    },
                    {
                        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    },
                    {
                        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    }
                ]
            };

            const response = await fetch(`${this.baseUrl}/models/${model}:generateContent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': this.apiKey
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();

            if (!result.candidates || !result.candidates[0]) {
                throw new Error('No response candidates from Gemini');
            }

            const candidate = result.candidates[0];
            if (candidate.finishReason === 'SAFETY') {
                throw new Error('Response blocked by safety filters');
            }

            // Check for function calls
            const parts = candidate.content?.parts || [];
            const functionCalls = [];
            let textContent = '';

            for (const part of parts) {
                if (part.text) {
                    textContent += part.text;
                } else if (part.functionCall) {
                    functionCalls.push({
                        name: part.functionCall.name,
                        args: part.functionCall.args,
                        id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    });
                }
            }

            // If we have function calls and ragService, execute them
            if (functionCalls.length > 0 && ragService) {
                console.log(`🔧 Executing ${functionCalls.length} function calls`);
                
                const toolResults = [];
                for (const funcCall of functionCalls) {
                    console.log(`🔧 Executing ${funcCall.name}:`, funcCall.args);
                    
                    // Convert to RAG service format
                    const toolCall = {
                        name: funcCall.name,
                        query: funcCall.args.query,
                        script: funcCall.args.script,
                        description: funcCall.args.description,
                        id: funcCall.id
                    };
                    
                    const toolResult = await ragService.executeToolCall(toolCall);
                    toolResults.push({
                        call: funcCall,
                        result: toolResult
                    });
                }

                // Prepare function response for Gemini
                const functionResponseParts = toolResults.map(tr => ({
                    functionResponse: {
                        name: tr.call.name,
                        response: {
                            result: tr.result.success ? tr.result.documentation || tr.result.content || 'Success' : tr.result.error,
                            success: tr.result.success
                        }
                    }
                }));

                // Add function responses to conversation and get final response
                const followUpContents = [...contents];
                
                // Add assistant's function calls
                followUpContents.push({
                    role: 'model',
                    parts: parts
                });
                
                // Add function responses
                followUpContents.push({
                    role: 'user',
                    parts: functionResponseParts
                });

                // Get final response
                const followUpResponse = await fetch(`${this.baseUrl}/models/${model}:generateContent`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': this.apiKey
                    },
                    body: JSON.stringify({
                        contents: followUpContents,
                        generationConfig: requestBody.generationConfig,
                        safetySettings: requestBody.safetySettings
                    })
                });

                if (followUpResponse.ok) {
                    const followUpResult = await followUpResponse.json();
                    const followUpContent = followUpResult.candidates?.[0]?.content?.parts?.[0]?.text;
                    
                    return {
                        success: true,
                        content: followUpContent || textContent,
                        model: model,
                        usage: followUpResult.usageMetadata || result.usageMetadata || {},
                        finishReason: followUpResult.candidates?.[0]?.finishReason || candidate.finishReason,
                        functionCalls: functionCalls,
                        toolResults: toolResults.map(tr => tr.result)
                    };
                }
            }

            // No function calls or no ragService
            if (!textContent) {
                throw new Error('No text content in Gemini response');
            }

            console.log('✅ Video chat response received');

            return {
                success: true,
                content: textContent.trim(),
                model: model,
                usage: result.usageMetadata || {},
                finishReason: candidate.finishReason,
                functionCalls: functionCalls
            };

        } catch (error) {
            console.error('❌ Video chat error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stream video chat response
     */
    async streamChatWithVideo(message, files = [], model = 'gemini-2.0-flash', conversation = [], onData = null) {
        try {
            console.log(`🎥 Starting streaming video chat with ${model}`);

            // Prepare the same request as non-streaming
            const fileParts = [];
            for (const file of files) {
                const fileState = await this.checkFileState(file.fileId);
                if (fileState.success && fileState.state === 'ACTIVE') {
                    fileParts.push({
                        file_data: {
                            mime_type: file.mimeType,
                            file_uri: fileState.uri
                        }
                    });
                }
            }

            const contents = [];
            // Use last 20 messages for context in streaming too
            for (const msg of conversation.slice(-20)) {
                if (msg.role === 'user' || msg.role === 'assistant') {
                    contents.push({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }]
                    });
                }
            }

            const currentParts = [{ text: message }];
            currentParts.push(...fileParts);
            contents.push({
                role: 'user',
                parts: currentParts
            });

            const requestBody = {
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    topK: 32,
                    topP: 1,
                    maxOutputTokens: 8192
                }
            };

            // Add altSSE=true for server-sent events
            const response = await fetch(`${this.baseUrl}/models/${model}:streamGenerateContent?alt=sse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': this.apiKey
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini streaming API error: ${response.status} - ${errorText}`);
            }

            let fullContent = '';
            let buffer = '';

            // Process streaming response
            response.body.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                            
                            if (text) {
                                fullContent += text;
                                if (onData) {
                                    onData({
                                        type: 'content_delta',
                                        content: text,
                                        fullContent: fullContent
                                    });
                                }
                            }

                            // Check for completion
                            if (parsed.candidates?.[0]?.finishReason) {
                                if (onData) {
                                    onData({
                                        type: 'stream_complete',
                                        content: fullContent,
                                        finishReason: parsed.candidates[0].finishReason
                                    });
                                }
                            }

                        } catch (e) {
                            // Skip invalid JSON
                            continue;
                        }
                    }
                }
            });

            response.body.on('end', () => {
                if (onData) {
                    onData({
                        type: 'stream_end',
                        content: fullContent
                    });
                }
            });

            response.body.on('error', (error) => {
                console.error('❌ Stream error:', error);
                if (onData) {
                    onData({
                        type: 'error',
                        error: error.message
                    });
                }
            });

        } catch (error) {
            console.error('❌ Streaming video chat error:', error);
            if (onData) {
                onData({
                    type: 'error',
                    error: error.message
                });
            }
        }
    }

    /**
     * List uploaded files
     */
    async listFiles() {
        try {
            const response = await fetch(`${this.baseUrl}/files`, {
                headers: {
                    'X-Goog-Api-Key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`List files failed: ${response.status}`);
            }

            const result = await response.json();
            return {
                success: true,
                files: result.files || []
            };

        } catch (error) {
            console.error('❌ List files error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete uploaded file
     */
    async deleteFile(fileId) {
        try {
            const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'X-Goog-Api-Key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`Delete file failed: ${response.status}`);
            }

            // Remove from local cache
            this.uploadedFiles.delete(fileId);

            return {
                success: true,
                message: 'File deleted successfully'
            };

        } catch (error) {
            console.error('❌ Delete file error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get supported video models
     */
    getSupportedModels() {
        return Object.entries(this.videoModels).map(([key, info]) => ({
            id: key,
            name: info.name,
            contextWindow: info.contextWindow,
            maxVideoDuration: info.maxVideoDuration,
            pricing: info.pricing
        }));
    }

    /**
     * Get file info from cache
     */
    getFileInfo(fileId) {
        return this.uploadedFiles.get(fileId) || null;
    }

    /**
     * Simple video upload based on Gemini cookbook approach
     * This is simpler than the resumable upload and follows the official cookbook pattern
     */
    async uploadVideoSimple(filePath, originalName, mimeType = 'video/mp4') {
        try {
            console.log('🎥 Uploading video (cookbook approach):', originalName);
            console.log('🎥 File path:', filePath);

            const fs = require('fs');
            
            // Read file
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            const fileStats = fs.statSync(filePath);
            const fileSize = fileStats.size;
            console.log('🎥 File size:', fileSize, 'bytes');

            // Use Node.js form-data for file upload
            const FormData = require('form-data');
            const fileStream = fs.createReadStream(filePath);
            
            const formData = new FormData();
            formData.append('file', fileStream, {
                filename: originalName,
                contentType: mimeType
            });

            const uploadResponse = await fetch('https://generativelanguage.googleapis.com/upload/v1beta/files', {
                method: 'POST',
                headers: {
                    'X-Goog-Api-Key': this.apiKey,
                    'X-Goog-Upload-Protocol': 'multipart',
                    ...formData.getHeaders()
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
            }

            const result = await uploadResponse.json();
            console.log('✅ Video uploaded:', result.file.name, 'State:', result.file.state);

            // Wait for processing (cookbook pattern)
            let videoFile = result.file;
            let attempts = 0;
            const maxAttempts = 60; // 5 minutes max

            while (videoFile.state === "PROCESSING" && attempts < maxAttempts) {
                console.log(`⏳ Waiting for video to be processed... (${attempts * 5}s)`);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                attempts++;

                // Check file state
                const fileId = videoFile.name.replace('files/', '');
                const checkResponse = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/files/${fileId}`,
                    {
                        headers: { 'X-Goog-Api-Key': this.apiKey }
                    }
                );

                if (checkResponse.ok) {
                    videoFile = await checkResponse.json();
                    console.log(`📊 Processing status: ${videoFile.state} (attempt ${attempts})`);
                } else {
                    console.warn('⚠️ Could not check file state, continuing...');
                }
            }

            if (videoFile.state === "FAILED") {
                throw new Error('Video processing failed');
            }

            if (videoFile.state === "PROCESSING") {
                console.warn('⚠️ Video still processing after timeout, but proceeding...');
            }

            console.log('🎬 Video ready for use:', videoFile.uri);
            
            // Store in cache
            const fileData = {
                fileId: videoFile.name,
                displayName: originalName,
                mimeType: mimeType,
                uri: videoFile.uri,
                state: videoFile.state,
                uploadTime: new Date().toISOString()
            };
            this.uploadedFiles.set(videoFile.name, fileData);
            
            return {
                success: true,
                fileId: videoFile.name,
                uri: videoFile.uri,
                state: videoFile.state,
                mimeType: videoFile.mimeType
            };

        } catch (error) {
            console.error('❌ Simple video upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = GeminiVideoService;