#!/usr/bin/env node

require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const corsMiddleware = require('./middleware/cors');

const AIRouterService = require('./services/ai-router');
const GeminiVideoService = require('./services/gemini-video');
const AutonomousAgentService = require('./services/autonomous-agent');

const app = express();
const server = http.createServer(app);
const aiRouter = new AIRouterService();
const geminiVideoService = new GeminiVideoService();
const autonomousAgent = new AutonomousAgentService();

// Helper function to safely send WebSocket messages
const safeWebSocketSend = (ws, message) => {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      // Check for undefined or null values in the message
      if (!message || message === undefined || message === null) {
        console.error('❌ Attempted to send undefined/null WebSocket message, skipping');
        return;
      }
      
      // Deep check for undefined values in the message object
      const checkForUndefined = (obj, path = '') => {
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            if (value === undefined) {
              console.warn(`⚠️ Found undefined value at ${currentPath}, replacing with null`);
              obj[key] = null;
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
              checkForUndefined(value, currentPath);
            }
          }
        }
      };
      
      checkForUndefined(message);
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('❌ Failed to send WebSocket message:', error);
      console.error('❌ Message that failed:', message);
    }
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 File filter check:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });
    
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/webm', 'image/jpeg', 'image/png', 'image/webp'];
    
    // Check MIME type
    if (allowedTypes.includes(file.mimetype)) {
      console.log('✅ File type allowed by MIME:', file.mimetype);
      cb(null, true);
      return;
    }
    
    // Fallback: check file extension if MIME type is generic
    if (file.mimetype === 'application/octet-stream') {
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.webm', '.jpg', '.jpeg', '.png', '.webp'];
      
      if (allowedExtensions.includes(ext)) {
        console.log('✅ File type allowed by extension:', ext);
        cb(null, true);
        return;
      }
    }
    
    console.log('❌ File type rejected:', file.mimetype, 'extension:', path.extname(file.originalname));
    cb(new Error('Invalid file type. Only video and image files are allowed.'));
  }
});

// WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/api/chat/stream'
});

// Middleware
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const services = await aiRouter.testServices();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: require('./package.json').version,
      environment: process.env.NODE_ENV || 'development',
      services: services
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Test RAG endpoint
app.post('/api/test-rag', async (req, res) => {
  try {
    const { query = 'test query' } = req.body;
    const result = await aiRouter.ragService.searchDocumentation(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple connectivity test endpoint
app.get('/api/test-connection', (req, res) => {
  res.json({
    success: true,
    message: 'Backend server is reachable',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    clientInfo: {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    }
  });
});

// Video upload endpoint
app.post('/api/upload/video', upload.single('file'), async (req, res) => {
  try {
    console.log('📁 Video upload request received');
    console.log('File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
    console.log('Body:', req.body);

    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const frameRate = parseFloat(req.body.frameRate) || 1;
    console.log(`📁 Processing video upload: ${req.file.originalname} (${frameRate} FPS)`);
    console.log(`📁 File details: path=${req.file.path}, mime=${req.file.mimetype}, size=${req.file.size}`);

    // Fix MIME type if it was detected as octet-stream
    let mimeType = req.file.mimetype;
    if (mimeType === 'application/octet-stream') {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const mimeMap = {
        '.mp4': 'video/mp4',
        '.mov': 'video/mov',
        '.avi': 'video/avi',
        '.wmv': 'video/wmv',
        '.webm': 'video/webm',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp'
      };
      mimeType = mimeMap[ext] || mimeType;
      console.log(`📁 Corrected MIME type from ${req.file.mimetype} to ${mimeType}`);
    }

    // Upload to Gemini Files API
    const result = await geminiVideoService.uploadVideo(
      req.file.path,
      req.file.originalname,
      mimeType,
      frameRate
    );

    // Clean up temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.warn('⚠️ Failed to delete temp file:', err);
    });

    if (result.success) {
      console.log(`✅ Video uploaded successfully: ${result.fileId}`);
      res.json({
        success: true,
        fileId: result.fileId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        frameRate: frameRate,
        state: result.state
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Video upload error:', error);
    console.error('Error stack:', error.stack);
    
    // Clean up temporary file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.warn('⚠️ Failed to delete temp file on error:', err);
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get supported video models endpoint
app.get('/api/video/models', (req, res) => {
  res.json({
    success: true,
    models: geminiVideoService.getSupportedModels()
  });
});

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`🔌 WebSocket client connected from ${clientIp}`);
  
  // Send welcome message
  safeWebSocketSend(ws, {
    type: 'connection_established',
    timestamp: new Date().toISOString()
  });

  // Message handler
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      console.log(`📨 Received message type: ${message.type}`);
      
      // Route message to appropriate handler
      await handleWebSocketMessage(ws, message);
      
    } catch (error) {
      console.error('❌ WebSocket message error:', error);
      safeWebSocketSend(ws, {
        type: 'error',
        error: 'Invalid message format',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Connection close handler
  ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket client disconnected: ${code} ${reason}`);
  });

  // Error handler
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

/**
 * Handle incoming WebSocket messages
 */
async function handleWebSocketMessage(ws, message) {
  const { type, data } = message;
  
  switch (type) {
    case 'chat_start':
      await handleChatStart(ws, data);
      break;
      
    case 'video_chat_start':
      await handleVideoChatStart(ws, data);
      break;
      
    case 'agent_create_plan':
      await handleAgentCreatePlan(ws, data);
      break;
      
    case 'agent_execute_step':
      await handleAgentExecuteStep(ws, data);
      break;
      
    case 'agent_autonomous_task':
      await handleAgentAutonomousTask(ws, data);
      break;
      
    case 'ping':
      safeWebSocketSend(ws, {
        type: 'pong',
        timestamp: new Date().toISOString()
      });
      break;
      
    default:
      safeWebSocketSend(ws, {
        type: 'error',
        error: `Unknown message type: ${type}`,
        timestamp: new Date().toISOString()
      });
  }
}

/**
 * Handle chat start request
 */
async function handleChatStart(ws, data) {
  const { message, model = 'claude', conversation = [] } = data;
  
  console.log(`🤖 Starting chat with ${model} model`);
  
  try {
    // Send acknowledgment
    safeWebSocketSend(ws, {
      type: 'chat_started',
      model,
      timestamp: new Date().toISOString()
    });
    
    // Stream chat using AI router
    await aiRouter.streamChat(message, {
      model,
      conversation,
      onContentDelta: (delta, fullContent) => {
        safeWebSocketSend(ws, {
          type: 'content_delta',
          delta: delta,
          content: fullContent,
          timestamp: new Date().toISOString()
        });
      },
      onToolCall: (toolCalls) => {
        safeWebSocketSend(ws, {
          type: 'tool_call_start',
          toolCalls: toolCalls,
          timestamp: new Date().toISOString()
        });
      },
      onToolResult: (toolCall, result) => {
        // Don't send debug context messages to frontend - they cause parsing errors
        if (toolCall.name === 'claude_full_context') {
          console.log('🔧 Skipping claude_full_context debug message to frontend');
          return;
        }
        
        safeWebSocketSend(ws, {
          type: 'tool_call_complete',
          toolCall: toolCall,
          result: {
            success: result.success,
            resultCount: result.resultCount,
            query: result.query,
            documentation: result.documentation ? result.documentation.substring(0, 500) + '...' : undefined
          },
          timestamp: new Date().toISOString()
        });
      },
      onComplete: (result) => {
        safeWebSocketSend(ws, {
          type: 'chat_complete',
          result: {
            success: result.success,
            content: result.content,
            toolCallsCount: result.toolCalls?.length || 0
          },
          timestamp: new Date().toISOString()
        });
      },
      onError: (error) => {
        console.error('❌ AI Router error:', error);
        safeWebSocketSend(ws, {
          type: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Chat start error:', error);
    safeWebSocketSend(ws, {
      type: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle agent plan creation request
 */
async function handleAgentCreatePlan(ws, data) {
  const { task, model = 'claude' } = data;
  
  console.log(`🤖 Creating agent plan for task: ${task}`);
  
  try {
    safeWebSocketSend(ws, {
      type: 'agent_plan_started',
      timestamp: new Date().toISOString()
    });
    
    const planResult = await autonomousAgent.createPlan(task, { model });
    
    if (planResult.success) {
      safeWebSocketSend(ws, {
        type: 'agent_plan_created',
        plan: planResult.plan,
        timestamp: new Date().toISOString()
      });
    } else {
      safeWebSocketSend(ws, {
        type: 'error',
        error: planResult.error,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ Agent plan creation error:', error);
    safeWebSocketSend(ws, {
      type: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle agent step execution request
 */
async function handleAgentExecuteStep(ws, data) {
  const { step, model = 'claude', maxToolCalls = 5 } = data;
  
  console.log(`🎯 Executing agent step: ${step.description}`);
  
  try {
    safeWebSocketSend(ws, {
      type: 'agent_step_started',
      step: step,
      timestamp: new Date().toISOString()
    });
    
    const stepResult = await autonomousAgent.executeStep(step, { 
      model, 
      maxToolCalls 
    });
    
    safeWebSocketSend(ws, {
      type: 'agent_step_completed',
      step: step,
      result: stepResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Agent step execution error:', error);
    safeWebSocketSend(ws, {
      type: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle autonomous task execution request
 */
async function handleAgentAutonomousTask(ws, data) {
  const { task, model = 'claude', maxIterations = 15 } = data;
  
  console.log(`🚀 Starting autonomous task execution: ${task}`);
  
  try {
    await autonomousAgent.streamAutonomousTask(task, {
      model,
      maxIterations,
      onPlanCreated: (plan) => {
        safeWebSocketSend(ws, {
          type: 'agent_plan_created',
          plan: plan,
          timestamp: new Date().toISOString()
        });
      },
      onStepStarted: (step) => {
        safeWebSocketSend(ws, {
          type: 'agent_step_started',
          step: step,
          timestamp: new Date().toISOString()
        });
      },
      onStepCompleted: (step, result) => {
        safeWebSocketSend(ws, {
          type: 'agent_step_completed',
          step: step,
          result: result,
          timestamp: new Date().toISOString()
        });
      },
      onEvaluationComplete: (evaluation) => {
        safeWebSocketSend(ws, {
          type: 'agent_evaluation_complete',
          evaluation: evaluation,
          timestamp: new Date().toISOString()
        });
      },
      onTaskComplete: (result) => {
        safeWebSocketSend(ws, {
          type: 'agent_task_complete',
          result: result,
          timestamp: new Date().toISOString()
        });
      },
      onContentDelta: (content) => {
        safeWebSocketSend(ws, {
          type: 'content_delta',
          content: content,
          timestamp: new Date().toISOString()
        });
      },
      onError: (error) => {
        safeWebSocketSend(ws, {
          type: 'error',
          error: error,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Autonomous task execution error:', error);
    safeWebSocketSend(ws, {
      type: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle video chat start request
 */
async function handleVideoChatStart(ws, data) {
  const { message, model = 'gemini-2.0-flash', conversation = [], files = [], frameRate = 1 } = data;
  
  console.log(`🎥 Starting video chat with ${model} model`);
  console.log(`📁 Files: ${files.length}, Frame rate: ${frameRate} FPS`);
  
  try {
    // Send acknowledgment
    safeWebSocketSend(ws, {
      type: 'chat_started',
      data: { model, filesCount: files.length, frameRate },
      timestamp: new Date().toISOString()
    });
    
    // Stream video chat using Gemini video service
    await geminiVideoService.streamChatWithVideo(
      message,
      files,
      model,
      conversation,
      (streamData) => {
        const { type, content, fullContent, error, finishReason } = streamData;
        
        if (type === 'content_delta') {
          safeWebSocketSend(ws, {
            type: 'content_delta',
            content: fullContent,
            timestamp: new Date().toISOString()
          });
        } else if (type === 'stream_complete' || type === 'stream_end') {
          safeWebSocketSend(ws, {
            type: 'chat_complete',
            result: {
              success: true,
              content: content,
              model: model,
              finishReason: finishReason
            },
            timestamp: new Date().toISOString()
          });
        } else if (type === 'error') {
          safeWebSocketSend(ws, {
            type: 'error',
            error: error,
            timestamp: new Date().toISOString()
          });
        }
      }
    );
    
  } catch (error) {
    console.error('❌ Video chat start error:', error);
    safeWebSocketSend(ws, {
      type: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Express error:', error);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Backend server started on port ${PORT}`);
  console.log(`📡 WebSocket server available at ws://localhost:${PORT}/api/chat/stream`);
  console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);
  
  // Check environment
  if (!process.env.CLAUDE_API_KEY) {
    console.warn('⚠️  CLAUDE_API_KEY not set in environment');
  }
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set in environment');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});