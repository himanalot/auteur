#!/usr/bin/env python3
"""
Startup script for Script Generator RAG System
Run this from the main extension directory to power the Script Generator tab
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

def check_rag_backend():
    """Check if the RAG backend system is available"""
    try:
        # Add the backend path
        backend_path = os.path.join(os.path.dirname(__file__), 'official_docsforadobe_rag', 'backend')
        if backend_path not in sys.path:
            sys.path.append(backend_path)
        
        print(f"🔍 Checking RAG backend at: {backend_path}")
        
        # Try to import the RAG system
        from ragwithchatbot import search_documentation
        
        # Test with a simple query
        print("🧪 Testing RAG system...")
        test_results = search_documentation("test query", top_k=1)
        print("✅ RAG backend system working correctly")
        return True
        
    except Exception as e:
        print(f"❌ RAG backend not available: {e}")
        print("🔧 The HelixDB database may not be initialized")
        print("💡 To fix this:")
        print("   1. cd official_docsforadobe_rag/backend")
        print("   2. Check if processed_docs/ directory exists with .json files")
        print("   3. If not, run the document processing pipeline first")
        return False

def print_script_generator_info():
    """Print information about the Script Generator RAG system"""
    print("""
🎬 SCRIPT GENERATOR RAG SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 POWERS THE SCRIPT GENERATOR TAB:
  1. User types request in Script Generator tab
  2. AI Agent analyzes the request 
  3. Agent makes dynamic RAG tool calls for documentation
  4. RAG server searches After Effects docs
  5. Agent generates ExtendScript using found documentation
  6. User gets accurate, documented code

🔧 RAG TOOL INTEGRATION:
  • Flask server bridges JavaScript ↔ Python RAG
  • AI Agent calls RAG tool only when needed
  • Each call gets specific AE documentation  
  • Caching improves performance
  • Multiple calls build comprehensive knowledge

🚀 WHAT THIS POWERS:
  • Script Generator tab in the extension
  • AI-driven code generation with docs
  • Real-time documentation lookup
  • Context-aware ExtendScript generation

📋 EXAMPLE USAGE:
  Extension Request: "Create bouncing text animation"
  │
  ├─ AI Agent → RAG: "How to create TextLayer"
  ├─ AI Agent → RAG: "How to animate position property" 
  ├─ AI Agent → RAG: "How to set keyframe easing"
  │
  └─ Generated ExtendScript with proper AE API calls

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")

def start_rag_server():
    """Start the RAG server for Script Generator"""
    print("🚀 Starting Script Generator RAG Server...")
    print("🌐 Server will run at: http://127.0.0.1:5002")
    print("🔗 Extension Script Generator will connect to this server")
    print("📝 Server logs:")
    print("=" * 60)
    
    try:
        # Import and run the server from the correct location
        server_path = os.path.join(os.path.dirname(__file__))
        sys.path.insert(0, server_path)
        
        from rag_server import app
        
        # Run the server for the Script Generator
        app.run(host='127.0.0.1', port=5002, debug=False)
        
    except ImportError as e:
        print(f"❌ Could not start RAG server: {e}")
        print("🔧 Make sure rag_server.py is in the current directory")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    print("🎬 SCRIPT GENERATOR RAG SYSTEM STARTUP")
    print("=" * 60)
    
    # Print system information
    print_script_generator_info()
    
    # Check dependencies
    print("📦 Checking dependencies...")
    check_dependencies()
    
    # Check RAG backend system
    print("\n🔍 Checking RAG backend...")
    rag_available = check_rag_backend()
    
    if not rag_available:
        print("\n⚠️  WARNING: RAG backend not fully available")
        print("🔄 Script Generator will work with limited documentation access")
        print("💡 AI Agent can still generate scripts using general knowledge")
        print("🎯 For full documentation access, ensure HelixDB is set up")
        
        choice = input("\n🤔 Start server anyway? (y/n): ").lower().strip()
        if choice != 'y':
            print("🛑 Startup cancelled")
            print("\n💡 To set up the RAG backend:")
            print("   1. cd official_docsforadobe_rag/backend")
            print("   2. Ensure processed_docs/ contains embedded documentation")
            print("   3. Run this script again")
            sys.exit(1)
    
    print("\n" + "=" * 60)
    print("🎬 SCRIPT GENERATOR READY:")
    print("   1. Open After Effects")
    print("   2. Open Maximise AE Tools extension")
    print("   3. Click Script Generator tab")
    print("   4. Type your request and generate scripts!")
    print("   5. Watch AI Agent make RAG calls for documentation")
    print("=" * 60)
    print("\n🔥 Starting in 3 seconds...")
    
    # Small delay before starting
    time.sleep(3)
    
    # Start the RAG server
    start_rag_server() 