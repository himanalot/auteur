#!/usr/bin/env python3
"""
Startup script for Enhanced RAG Server
"""

import subprocess
import sys
import os
import time

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import flask
        import flask_cors
        print("✅ Flask dependencies available")
    except ImportError:
        print("❌ Flask dependencies missing")
        print("📦 Installing dependencies...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "rag_server_requirements.txt"])
        print("✅ Dependencies installed")

def check_rag_system():
    """Check if the RAG system is available"""
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__), 'official_docsforadobe_rag', 'backend'))
        from ragwithchatbot import search_documentation
        print("✅ RAG system available")
        return True
    except Exception as e:
        print(f"❌ RAG system not available: {e}")
        print("🔧 Make sure the HelixDB server is running on port 6969")
        print("💡 Run: cd official_docsforadobe_rag/backend && python ragwithchatbot.py")
        return False

def start_server():
    """Start the Enhanced RAG server"""
    print("🚀 Starting Enhanced RAG Server...")
    print("🌐 Server will be available at: http://127.0.0.1:5002")
    print("📝 Logs will appear below:")
    print("=" * 60)
    
    # Import and run the server
    from rag_server import app
    app.run(host='127.0.0.1', port=5002, debug=False)

if __name__ == '__main__':
    print("🎬 Enhanced RAG Server for AE Script Generator")
    print("=" * 60)
    
    # Check dependencies
    check_dependencies()
    
    # Check RAG system
    if not check_rag_system():
        print("\n⚠️  WARNING: RAG system not available")
        print("🔄 The server will start but won't have access to documentation")
        print("💡 You can still use the manual query generation fallback")
        
        choice = input("\n🤔 Continue anyway? (y/n): ").lower().strip()
        if choice != 'y':
            print("🛑 Startup cancelled")
            sys.exit(1)
    
    print("\n" + "=" * 60)
    
    # Small delay before starting
    time.sleep(1)
    
    # Start the server
    start_server() 