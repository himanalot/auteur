#!/usr/bin/env python3
"""
Interactive After Effects Documentation Search
Search the After Effects API documentation using vector similarity
"""

import sys
from load_to_helix import search_ae_docs

def main():
    if len(sys.argv) > 1:
        # Use command line argument
        query = " ".join(sys.argv[1:])
    else:
        # Interactive mode
        print("=== After Effects Documentation Search ===")
        print("Enter your search query (or 'quit' to exit):")
        
        while True:
            try:
                query = input("\n> ").strip()
                if query.lower() in ['quit', 'exit', 'q']:
                    break
                if not query:
                    continue
                
                print(f"\n🔍 Searching for: '{query}'")
                print("=" * 80)
                search_ae_docs(query, top_k=5)
                
            except KeyboardInterrupt:
                print("\n\nGoodbye! 👋")
                break
            except Exception as e:
                print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        print(f"🔍 Searching for: '{query}'")
        print("=" * 80)
        search_ae_docs(query, top_k=5)
    else:
        main()