#!/usr/bin/env python3
"""
Complete RAG Pipeline Runner for After Effects Extension
Orchestrates scraping, embedding, and query setup
"""

import asyncio
import os
import sys
from pathlib import Path
import json

# Add python directory to path for imports
sys.path.append(str(Path(__file__).parent / "python"))

from python.scraper import AEDocscraper
from python.embedder import AEEmbeddingPipeline
from python.rag_query import RAGQuerySystem

class RAGPipelineRunner:
    def __init__(self, openai_api_key: str):
        self.openai_api_key = openai_api_key
        self.scraped_docs_file = "ae_docs_scraped.json"
        self.vector_db_file = "ae_docs_vectors.db"
        
    async def run_full_pipeline(self, force_rescrape: bool = False, max_pages: int = 150):
        """Run the complete RAG pipeline"""
        print("🚀 Starting Complete RAG Pipeline for After Effects Extension")
        print("=" * 70)
        
        # Step 1: Scraping
        print("\n📥 STEP 1: SCRAPING DOCUMENTATION")
        if force_rescrape or not Path(self.scraped_docs_file).exists():
            await self.scrape_documentation(max_pages)
        else:
            print(f"✅ Using existing scraped data: {self.scraped_docs_file}")
            
        # Step 2: Embedding
        print("\n🧠 STEP 2: GENERATING EMBEDDINGS")
        if force_rescrape or not Path(self.vector_db_file).exists():
            await self.generate_embeddings()
        else:
            print(f"✅ Using existing vector database: {self.vector_db_file}")
            
        # Step 3: Testing
        print("\n🔍 STEP 3: TESTING RAG SYSTEM")
        await self.test_rag_system()
        
        print("\n🎉 RAG PIPELINE COMPLETE!")
        print(f"📄 Scraped docs: {self.scraped_docs_file}")
        print(f"🗄️ Vector database: {self.vector_db_file}")
        print("🚀 Ready for integration with After Effects extension!")
        
    async def scrape_documentation(self, max_pages: int = 150):
        """Scrape After Effects documentation"""
        print(f"🕷️ Scraping https://ae-scripting.docsforadobe.dev/ (max {max_pages} pages)")
        
        async with AEDocscraper() as scraper:
            docs = await scraper.scrape_all(max_pages=max_pages)
            scraper.save_to_json(docs, self.scraped_docs_file)
            
        print(f"✅ Scraping complete: {len(docs)} documents saved")
        return docs
        
    async def generate_embeddings(self):
        """Generate embeddings for scraped documents"""
        print("🧠 Loading documents and generating embeddings with text-embedding-3-small...")
        
        # Load scraped documents
        with open(self.scraped_docs_file, 'r', encoding='utf-8') as f:
            docs = json.load(f)
            
        # Generate embeddings
        pipeline = AEEmbeddingPipeline(self.openai_api_key, self.vector_db_file)
        chunk_count = await pipeline.embed_all_documents(docs)
        
        # Show statistics
        stats = pipeline.get_stats()
        print(f"✅ Embedding complete:")
        print(f"   📊 {stats['documents']} documents processed")
        print(f"   🧩 {stats['chunks']} chunks created")
        print(f"   📑 Sections: {list(stats['sections'].keys())}")
        
        return chunk_count
        
    async def test_rag_system(self):
        """Test the RAG query system"""
        print("🧪 Testing RAG query system with sample queries...")
        
        rag_system = RAGQuerySystem(self.openai_api_key, self.vector_db_file)
        
        test_queries = [
            "create a red circle that moves to the right",
            "add a blur effect to my text",
            "animate layer opacity",
            "make a new composition",
            "create typewriter text effect"
        ]
        
        for i, query in enumerate(test_queries, 1):
            print(f"\n🔍 Test {i}/5: '{query}'")
            try:
                result = await rag_system.query(query)
                if result['recommendations']:
                    best_tool = result['recommendations'][0]
                    print(f"   ✅ Top tool: {best_tool['tool']} (confidence: {best_tool['confidence']:.2f})")
                    print(f"   📝 Reasoning: {best_tool['reasoning'][:80]}...")
                else:
                    print(f"   ⚠️ No recommendations found")
                    
            except Exception as e:
                print(f"   ❌ Error: {e}")
                
        print("\n✅ RAG system testing complete!")

async def main():
    """Main pipeline entry point"""
    print("🎬 After Effects RAG Pipeline")
    print("=" * 40)
    
    # Check for OpenAI API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ OPENAI_API_KEY environment variable not set!")
        print("   Please set it with: export OPENAI_API_KEY='your-key-here'")
        return
        
    print(f"✅ OpenAI API key found (length: {len(api_key)})")
    
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser(description='Run RAG pipeline for After Effects extension')
    parser.add_argument('--force-rescrape', action='store_true', 
                       help='Force re-scraping even if data exists')
    parser.add_argument('--max-pages', type=int, default=150,
                       help='Maximum pages to scrape (default: 150)')
    parser.add_argument('--scrape-only', action='store_true',
                       help='Only run scraping step')
    parser.add_argument('--embed-only', action='store_true', 
                       help='Only run embedding step')
    parser.add_argument('--test-only', action='store_true',
                       help='Only run testing step')
    
    args = parser.parse_args()
    
    # Initialize pipeline
    pipeline = RAGPipelineRunner(api_key)
    
    try:
        if args.scrape_only:
            await pipeline.scrape_documentation(args.max_pages)
        elif args.embed_only:
            await pipeline.generate_embeddings()
        elif args.test_only:
            await pipeline.test_rag_system()
        else:
            await pipeline.run_full_pipeline(args.force_rescrape, args.max_pages)
            
    except KeyboardInterrupt:
        print("\n\n⚠️ Pipeline interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Pipeline failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main()) 