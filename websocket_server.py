#!/usr/bin/env python3
"""
WebSocket Server for React Frontend
Bridges React components with Python RAG backends
"""

import asyncio
import websockets
import json
import logging
import requests
from typing import Dict, Any
import signal
import sys

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Store connected clients
connected_clients = set()

# Backend endpoints
RAG_BACKEND_URL = "http://127.0.0.1:5002"
UPLOAD_ENDPOINT = "http://127.0.0.1:3001/api/upload/video"

class WebSocketServer:
    def __init__(self, host="127.0.0.1", port=3001):
        self.host = host
        self.port = port
        self.server = None

    async def register_client(self, websocket):
        """Register a new client connection"""
        connected_clients.add(websocket)
        logger.info(f"Client connected. Total clients: {len(connected_clients)}")
        
        # Send connection confirmation
        await self.send_message(websocket, {
            "type": "connection_established",
            "message": "Connected to backend server"
        })

    async def unregister_client(self, websocket):
        """Unregister a client connection"""
        connected_clients.discard(websocket)
        logger.info(f"Client disconnected. Total clients: {len(connected_clients)}")

    async def send_message(self, websocket, message: Dict[str, Any]):
        """Send a message to a specific client"""
        try:
            await websocket.send(json.dumps(message))
        except websockets.exceptions.ConnectionClosed:
            await self.unregister_client(websocket)
        except Exception as e:
            logger.error(f"Error sending message: {e}")

    async def broadcast_message(self, message: Dict[str, Any]):
        """Broadcast a message to all connected clients"""
        if connected_clients:
            await asyncio.gather(
                *[self.send_message(client, message) for client in connected_clients],
                return_exceptions=True
            )

    async def handle_chat_message(self, websocket, data: Dict[str, Any]):
        """Handle regular chat messages"""
        try:
            message = data.get('message', '')
            model = data.get('model', 'claude')
            conversation = data.get('conversation', [])
            
            logger.info(f"Processing chat message: {message[:100]}...")
            
            # Send chat started confirmation
            await self.send_message(websocket, {
                "type": "chat_started",
                "data": {"model": model}
            })

            # Simulate AI response for now (replace with actual RAG call)
            response_content = f"Echo: {message}\n\nThis is a test response from the WebSocket server. The message was processed with model '{model}'."
            
            # Send streaming response
            words = response_content.split()
            current_content = ""
            
            for i, word in enumerate(words):
                current_content += word + " "
                await self.send_message(websocket, {
                    "type": "content_delta",
                    "content": current_content
                })
                await asyncio.sleep(0.1)  # Simulate streaming delay
            
            # Send completion
            await self.send_message(websocket, {
                "type": "chat_complete",
                "result": {"content": current_content.strip()}
            })
            
        except Exception as e:
            logger.error(f"Error handling chat message: {e}")
            await self.send_message(websocket, {
                "type": "error",
                "error": f"Failed to process chat message: {str(e)}"
            })

    async def handle_video_chat_message(self, websocket, data: Dict[str, Any]):
        """Handle video chat messages with file uploads"""
        try:
            message = data.get('message', '')
            model = data.get('model', 'gemini-2.0-flash')
            files = data.get('files', [])
            frame_rate = data.get('frameRate', 1)
            
            logger.info(f"Processing video chat message: {message[:100]}... with {len(files)} files")
            
            # Send chat started confirmation
            await self.send_message(websocket, {
                "type": "chat_started",
                "data": {"model": model}
            })

            # Simulate video analysis response
            file_info = ""
            if files:
                file_names = [f['fileName'] for f in files]
                file_info = f"\n\nI can see you've uploaded: {', '.join(file_names)}"
            
            response_content = f"Video Analysis: {message}{file_info}\n\nThis is a test video analysis response. Frame rate: {frame_rate} FPS. Model: {model}."
            
            # Send streaming response
            words = response_content.split()
            current_content = ""
            
            for i, word in enumerate(words):
                current_content += word + " "
                await self.send_message(websocket, {
                    "type": "content_delta",
                    "content": current_content
                })
                await asyncio.sleep(0.1)  # Simulate streaming delay
            
            # Send completion
            await self.send_message(websocket, {
                "type": "chat_complete",
                "result": {"content": current_content.strip()}
            })
            
        except Exception as e:
            logger.error(f"Error handling video chat message: {e}")
            await self.send_message(websocket, {
                "type": "error",
                "error": f"Failed to process video chat message: {str(e)}"
            })

    async def handle_message(self, websocket, path):
        """Handle incoming WebSocket messages"""
        await self.register_client(websocket)
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    message_type = data.get('type', '')
                    
                    logger.info(f"Received message type: {message_type}")
                    
                    if message_type == 'chat_start':
                        await self.handle_chat_message(websocket, data.get('data', {}))
                    elif message_type == 'video_chat_start':
                        await self.handle_video_chat_message(websocket, data.get('data', {}))
                    else:
                        logger.warning(f"Unknown message type: {message_type}")
                        await self.send_message(websocket, {
                            "type": "error",
                            "error": f"Unknown message type: {message_type}"
                        })
                        
                except json.JSONDecodeError as e:
                    logger.error(f"JSON decode error: {e}")
                    await self.send_message(websocket, {
                        "type": "error",
                        "error": "Invalid JSON format"
                    })
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    await self.send_message(websocket, {
                        "type": "error",
                        "error": f"Error processing message: {str(e)}"
                    })
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info("Client connection closed")
        except Exception as e:
            logger.error(f"Connection error: {e}")
        finally:
            await self.unregister_client(websocket)

    async def start_server(self):
        """Start the WebSocket server"""
        logger.info(f"🚀 Starting WebSocket server on ws://{self.host}:{self.port}")
        
        self.server = await websockets.serve(
            self.handle_message,
            self.host,
            self.port,
            ping_interval=30,
            ping_timeout=10
        )
        
        logger.info(f"✅ WebSocket server running on ws://{self.host}:{self.port}")
        logger.info("📱 React frontend can now connect!")
        
        return self.server

    async def stop_server(self):
        """Stop the WebSocket server"""
        if self.server:
            logger.info("🛑 Stopping WebSocket server...")
            self.server.close()
            await self.server.wait_closed()
            logger.info("✅ WebSocket server stopped")

# Global server instance
ws_server = WebSocketServer()

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info("Received shutdown signal")
    asyncio.create_task(ws_server.stop_server())
    sys.exit(0)

async def main():
    """Main server function"""
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        server = await ws_server.start_server()
        
        # Keep the server running
        await server.wait_closed()
        
    except Exception as e:
        logger.error(f"Server error: {e}")
    finally:
        await ws_server.stop_server()

if __name__ == "__main__":
    print("🎬 WebSocket Server for React Frontend")
    print("=" * 50)
    print("✅ Bridging React components with Python backends")
    print("🌐 Server will be available at: ws://127.0.0.1:3001")
    print("📝 Logs will appear below:")
    print("=" * 50)
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server shutdown by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")