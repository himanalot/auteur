#!/usr/bin/env python3
"""
Startup script for AI Agent with RAG Tool System
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
        # Add path to the backend directory
        backend_path = os.path.join(os.path.dirname(__file__), 'official_docsforadobe_rag', 'backend')
        if backend_path not in sys.path:
            sys.path.append(backend_path)
        
        from ragwithchatbot import search_documentation
        # Test the function to make sure it works
        test_results = search_documentation("test query", top_k=1)
        print("✅ RAG system available and working")
        return True
    except Exception as e:
        print(f"❌ RAG system not available: {e}")
        print("🔧 Make sure the HelixDB server is running on port 6969")
        print("💡 To start HelixDB: cd official_docsforadobe_rag/backend && python -c 'from helix.client import Client; Client(local=True)'")
        return False

def print_system_info():
    """Print information about the AI Agent + RAG Tool system"""
    print("""
🤖 AI AGENT + RAG TOOL SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 HOW IT WORKS:
  1. User makes a request (e.g., "Create animated text")
  2. AI Agent analyzes the request 
  3. Agent identifies technical questions needed
  4. Agent calls RAG Tool for each question:
     • "How to create TextLayer"
     • "How to set keyframes on property"
     • "How to animate opacity"
  5. Agent receives documentation for each call
  6. Agent generates final script using all documentation

🔧 RAG TOOL CALLS:
  • Dynamic: Called only when needed
  • Contextual: Uses project context in queries  
  • Cached: Repeated queries use cache
  • Targeted: Specific questions get better results

🚀 BENEFITS:
  • Better Documentation Coverage
  • More Accurate API Usage
  • Source Citation in Comments
  • Iterative Research Process
  • Context-Aware Queries

📋 EXAMPLE FLOW:
  Request: "Create 3 bouncing balls with trails"
  │
  ├─ Agent calls RAG: "How to create shape layers"
  ├─ Agent calls RAG: "How to animate position with keyframes" 
  ├─ Agent calls RAG: "How to create particle trails"
  ├─ Agent calls RAG: "How to duplicate layers"
  │
  └─ Agent generates complete script with documentation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")

def start_server():
    """Start the RAG Tool server"""
    print("🚀 Starting AI Agent + RAG Tool Server...")
    print("🌐 Server will be available at: http://127.0.0.1:5002")
    print("🔗 Extension will call this server for RAG tool requests")
    print("📝 Logs will appear below:")
    print("=" * 60)
    
    # Import and run the server
    from rag_server import app
    app.run(host='127.0.0.1', port=5002, debug=False)

if __name__ == '__main__':
    print("🎬 AI Agent + RAG Tool System for AE Script Generator")
    print("=" * 60)
    
    # Print system information
    print_system_info()
    
    # Check dependencies
    check_dependencies()
    
    # Check RAG system
    rag_available = check_rag_system()
    
    if not rag_available:
        print("\n⚠️  WARNING: RAG system not available")
        print("🔄 The AI Agent will work but won't have access to documentation")
        print("💡 RAG Tool calls will return 'No documentation found'")
        print("🎯 The agent can still generate scripts using general knowledge")
        
        choice = input("\n🤔 Continue anyway? (y/n): ").lower().strip()
        if choice != 'y':
            print("🛑 Startup cancelled")
            print("\n💡 To start the RAG system:")
            print("   cd official_docsforadobe_rag/backend")
            print("   python ragwithchatbot.py")
            sys.exit(1)
    
    print("\n" + "=" * 60)
    print("🎬 READY TO USE:")
    print("   1. Open After Effects")
    print("   2. Open Maximise AE Tools extension")
    print("   3. Go to Script Generator tab")
    print("   4. Make a request - watch the AI Agent work!")
    print("=" * 60)
    
    # Small delay before starting
    time.sleep(2)
    
    # Start the server
    start_server() 