#!/usr/bin/env python3
"""
Combined WebSocket + HTTP Server for React Frontend
Handles both chat messages and file uploads
"""

import asyncio
import websockets
import json
import logging
import threading
import signal
import sys
import os
import uuid
import mimetypes
from typing import Dict, Any
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Flask app for HTTP endpoints
app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024  # 2GB
ALLOWED_EXTENSIONS = {
    'video': ['mp4', 'mov', 'avi', 'wmv', 'webm'],
    'image': ['jpg', 'jpeg', 'png', 'webp', 'gif']
}

# Create upload directory
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# WebSocket clients
connected_clients = set()

class CombinedServer:
    def __init__(self, ws_host="127.0.0.1", ws_port=3002, http_port=3001):
        self.ws_host = ws_host
        self.ws_port = ws_port
        self.http_port = http_port
        self.ws_server = None
        self.http_thread = None

    # WebSocket Methods
    async def register_client(self, websocket):
        """Register a new WebSocket client"""
        connected_clients.add(websocket)
        logger.info(f"📱 Client connected. Total clients: {len(connected_clients)}")
        
        await self.send_message(websocket, {
            "type": "connection_established",
            "message": "Connected to backend server"
        })

    async def unregister_client(self, websocket):
        """Unregister a WebSocket client"""
        connected_clients.discard(websocket)
        logger.info(f"📱 Client disconnected. Total clients: {len(connected_clients)}")

    async def send_message(self, websocket, message: Dict[str, Any]):
        """Send message to WebSocket client"""
        try:
            await websocket.send(json.dumps(message))
        except websockets.exceptions.ConnectionClosed:
            await self.unregister_client(websocket)
        except Exception as e:
            logger.error(f"❌ Error sending message: {e}")

    async def handle_chat_message(self, websocket, data: Dict[str, Any]):
        """Handle regular chat messages"""
        try:
            message = data.get('message', '')
            model = data.get('model', 'claude')
            
            logger.info(f"💬 Processing chat: {message[:50]}...")
            
            await self.send_message(websocket, {
                "type": "chat_started",
                "data": {"model": model}
            })

            # Simple echo response for testing
            response = f"✅ Received your message: '{message}'\n\n🤖 This is a test response from the WebSocket server. Your message was processed successfully with the {model} model."
            
            # Simulate streaming
            words = response.split()
            current_content = ""
            
            for word in words:
                current_content += word + " "
                await self.send_message(websocket, {
                    "type": "content_delta",
                    "content": current_content
                })
                await asyncio.sleep(0.05)
            
            await self.send_message(websocket, {
                "type": "chat_complete",
                "result": {"content": current_content.strip()}
            })
            
        except Exception as e:
            logger.error(f"❌ Chat error: {e}")
            await self.send_message(websocket, {
                "type": "error",
                "error": f"Chat failed: {str(e)}"
            })

    async def handle_video_chat_message(self, websocket, data: Dict[str, Any]):
        """Handle video chat with files"""
        try:
            message = data.get('message', '')
            model = data.get('model', 'gemini-2.0-flash')
            files = data.get('files', [])
            frame_rate = data.get('frameRate', 1)
            
            logger.info(f"🎥 Processing video chat: {message[:50]}... ({len(files)} files)")
            
            await self.send_message(websocket, {
                "type": "chat_started",
                "data": {"model": model}
            })

            # Create response with file info
            file_info = ""
            if files:
                file_names = [f.get('fileName', 'unknown') for f in files]
                file_info = f"\n\n📁 Uploaded files: {', '.join(file_names)}"
            
            response = f"🎥 Video Analysis: {message}{file_info}\n\n🔍 This is a test video analysis response using {model} at {frame_rate} FPS. The files have been received and would normally be processed for visual content analysis."
            
            # Simulate streaming
            words = response.split()
            current_content = ""
            
            for word in words:
                current_content += word + " "
                await self.send_message(websocket, {
                    "type": "content_delta",
                    "content": current_content
                })
                await asyncio.sleep(0.05)
            
            await self.send_message(websocket, {
                "type": "chat_complete",
                "result": {"content": current_content.strip()}
            })
            
        except Exception as e:
            logger.error(f"❌ Video chat error: {e}")
            await self.send_message(websocket, {
                "type": "error",
                "error": f"Video chat failed: {str(e)}"
            })

    async def handle_websocket_message(self, websocket, path):
        """Handle WebSocket connections and messages"""
        await self.register_client(websocket)
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    msg_type = data.get('type', '')
                    
                    if msg_type == 'chat_start':
                        await self.handle_chat_message(websocket, data.get('data', {}))
                    elif msg_type == 'video_chat_start':
                        await self.handle_video_chat_message(websocket, data.get('data', {}))
                    else:
                        logger.warning(f"❓ Unknown message type: {msg_type}")
                        
                except json.JSONDecodeError:
                    logger.error("❌ Invalid JSON received")
                except Exception as e:
                    logger.error(f"❌ Message processing error: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister_client(websocket)

    async def start_websocket_server(self):
        """Start WebSocket server"""
        logger.info(f"🚀 Starting WebSocket server on ws://{self.ws_host}:{self.ws_port}")
        
        self.ws_server = await websockets.serve(
            self.handle_websocket_message,
            self.ws_host,
            self.ws_port,
            ping_interval=30,
            ping_timeout=10
        )
        
        logger.info(f"✅ WebSocket server running!")

    def start_http_server(self):
        """Start HTTP server in a separate thread"""
        logger.info(f"🌐 Starting HTTP server on http://127.0.0.1:{self.http_port}")
        app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE
        app.run(host='127.0.0.1', port=self.http_port, debug=False, threaded=True, use_reloader=False)

    async def start_servers(self):
        """Start both servers"""
        # Start HTTP server in background thread
        self.http_thread = threading.Thread(target=self.start_http_server, daemon=True)
        self.http_thread.start()
        
        # Start WebSocket server
        await self.start_websocket_server()
        
        # Keep running
        if self.ws_server:
            await self.ws_server.wait_closed()

# HTTP endpoints
def get_file_type(filename):
    """Determine file type"""
    if '.' not in filename:
        return None
    
    extension = filename.rsplit('.', 1)[1].lower()
    
    if extension in ALLOWED_EXTENSIONS['video']:
        return 'video'
    elif extension in ALLOWED_EXTENSIONS['image']:
        return 'image'
    
    return None

@app.route('/api/upload/video', methods=['POST'])
def upload_file():
    """Handle file uploads"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        frame_rate = float(request.form.get('frameRate', '1'))
        
        file_type = get_file_type(file.filename)
        if not file_type:
            return jsonify({'success': False, 'error': 'Unsupported file type'}), 400
        
        # Save file
        file_id = str(uuid.uuid4())
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        saved_filename = f"{file_id}.{file_extension}"
        file_path = os.path.join(UPLOAD_FOLDER, saved_filename)
        
        file.save(file_path)
        
        file_size = os.path.getsize(file_path)
        mime_type = mimetypes.guess_type(file_path)[0] or f'{file_type}/*'
        
        logger.info(f"📁 File uploaded: {original_filename} ({file_size} bytes)")
        
        return jsonify({
            'success': True,
            'fileId': file_id,
            'fileName': original_filename,
            'fileSize': file_size,
            'mimeType': mime_type,
            'frameRate': frame_rate
        })
        
    except Exception as e:
        logger.error(f"❌ Upload error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'websocket': f"ws://127.0.0.1:{server.ws_port}",
        'upload_endpoint': f"http://127.0.0.1:{server.http_port}/api/upload/video"
    })

# Global server instance
server = CombinedServer()

def signal_handler(signum, frame):
    """Handle shutdown"""
    logger.info("🛑 Shutting down servers...")
    sys.exit(0)

async def main():
    """Main function"""
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        await server.start_servers()
    except Exception as e:
        logger.error(f"❌ Server error: {e}")

if __name__ == "__main__":
    print("🎬 Combined WebSocket + HTTP Server")
    print("=" * 50)
    print("✅ Handling chat messages and file uploads")
    print("🌐 WebSocket: ws://127.0.0.1:3002")
    print("🌐 HTTP API: http://127.0.0.1:3001")
    print(f"📂 Upload folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print("📝 Logs will appear below:")
    print("=" * 50)
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("✅ Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")