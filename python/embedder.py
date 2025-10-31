#!/usr/bin/env python3
"""
RAG Embedding Pipeline for After Effects Documentation
Uses OpenAI's text-embedding-3-small for vector embeddings
"""

import json
import asyncio
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional
import openai
from dataclasses import dataclass
import sqlite3
import pickle
import hashlib
import re
from datetime import datetime

@dataclass
class DocumentChunk:
    """Represents a chunk of documentation with metadata"""
    id: str
    content: str
    embedding: Optional[np.ndarray]
    source_url: str
    title: str
    section: str
    chunk_index: int
    metadata: Dict[str, Any]

class AEEmbeddingPipeline:
    def __init__(self, openai_api_key: str, db_path: str = "ae_docs_vectors.db"):
        self.client = openai.OpenAI(api_key=openai_api_key)
        self.db_path = db_path
        self.embedding_model = "text-embedding-3-small"
        self.embedding_dimensions = 1536  # text-embedding-3-small dimensions
        self.max_chunk_size = 1000  # tokens per chunk
        self.chunk_overlap = 100  # token overlap between chunks
        
        # Initialize database
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database for vector storage"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tables
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                url TEXT,
                title TEXT,
                section TEXT,
                subsection TEXT,
                content TEXT,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chunks (
                id TEXT PRIMARY KEY,
                document_id TEXT,
                chunk_index INTEGER,
                content TEXT,
                embedding BLOB,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (document_id) REFERENCES documents (id)
            )
        ''')
        
        # Create indexes for faster search
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_documents_section ON documents(section)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_chunks_document ON chunks(document_id)')
        
        conn.commit()
        conn.close()
        print("✅ Database initialized")
    
    def chunk_text(self, text: str, max_length: int = 1000) -> List[str]:
        """Split text into overlapping chunks"""
        # Simple sentence-based chunking
        sentences = re.split(r'[.!?]+', text)
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            # Estimate token count (rough: 1 token ≈ 4 characters)
            estimated_tokens = len(current_chunk + sentence) // 4
            
            if estimated_tokens > max_length and current_chunk:
                # Add current chunk and start new one
                chunks.append(current_chunk.strip())
                # Start new chunk with overlap
                words = current_chunk.split()
                overlap_words = words[-self.chunk_overlap//4:] if len(words) > self.chunk_overlap//4 else words
                current_chunk = ' '.join(overlap_words) + ' ' + sentence
            else:
                current_chunk += ' ' + sentence
        
        # Add the last chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        return chunks
    
    async def get_embedding(self, text: str) -> np.ndarray:
        """Get embedding for text using OpenAI API"""
        try:
            response = await asyncio.to_thread(
                self.client.embeddings.create,
                model=self.embedding_model,
                input=text.replace('\n', ' ')[:8000]  # Limit text length
            )
            embedding = np.array(response.data[0].embedding, dtype=np.float32)
            return embedding
        except Exception as e:
            print(f"❌ Error getting embedding: {e}")
            return np.zeros(self.embedding_dimensions, dtype=np.float32)
    
    async def process_document(self, doc: Dict[str, Any]) -> List[DocumentChunk]:
        """Process a single document into embedded chunks"""
        # Combine all relevant content
        content_parts = [
            doc.get('title', ''),
            doc.get('description', ''),
            doc.get('main_content', ''),
            doc.get('code_examples', ''),
            doc.get('properties', '')
        ]
        
        full_content = ' '.join(filter(None, content_parts))
        
        if len(full_content.strip()) < 50:  # Skip very short documents
            return []
        
        # Create chunks
        text_chunks = self.chunk_text(full_content)
        document_chunks = []
        
        for i, chunk_text in enumerate(text_chunks):
            if len(chunk_text.strip()) < 20:  # Skip very short chunks
                continue
                
            # Generate embedding
            embedding = await self.get_embedding(chunk_text)
            
            # Create chunk object
            chunk_id = hashlib.md5(f"{doc['id']}_{i}".encode()).hexdigest()
            
            chunk = DocumentChunk(
                id=chunk_id,
                content=chunk_text,
                embedding=embedding,
                source_url=doc.get('url', ''),
                title=doc.get('title', ''),
                section=doc.get('section', ''),
                chunk_index=i,
                metadata={
                    'document_id': doc['id'],
                    'type': doc.get('type', 'documentation'),
                    'subsection': doc.get('subsection', ''),
                    'has_code': bool(doc.get('code_examples', '')),
                    'has_properties': bool(doc.get('properties', ''))
                }
            )
            
            document_chunks.append(chunk)
        
        print(f"✅ Processed: {doc.get('title', 'Untitled')[:50]}... -> {len(document_chunks)} chunks")
        return document_chunks
    
    def save_chunks_to_db(self, chunks: List[DocumentChunk]):
        """Save chunks to SQLite database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for chunk in chunks:
            # Save document info
            cursor.execute('''
                INSERT OR REPLACE INTO documents (id, url, title, section, subsection, content, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                chunk.metadata['document_id'],
                chunk.source_url,
                chunk.title,
                chunk.section,
                chunk.metadata.get('subsection', ''),
                chunk.content[:1000],  # Truncate for storage
                json.dumps(chunk.metadata)
            ))
            
            # Save chunk with embedding
            cursor.execute('''
                INSERT OR REPLACE INTO chunks (id, document_id, chunk_index, content, embedding, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                chunk.id,
                chunk.metadata['document_id'],
                chunk.chunk_index,
                chunk.content,
                pickle.dumps(chunk.embedding),
                json.dumps(chunk.metadata)
            ))
        
        conn.commit()
        conn.close()
    
    async def embed_all_documents(self, scraped_docs: List[Dict[str, Any]]) -> int:
        """Embed all scraped documents"""
        print(f"🚀 Starting embedding pipeline for {len(scraped_docs)} documents")
        
        all_chunks = []
        total_processed = 0
        
        # Process documents in batches to avoid rate limits
        batch_size = 10
        for i in range(0, len(scraped_docs), batch_size):
            batch = scraped_docs[i:i + batch_size]
            print(f"📦 Processing batch {i//batch_size + 1}/{(len(scraped_docs) + batch_size - 1)//batch_size}")
            
            batch_chunks = []
            for doc in batch:
                chunks = await self.process_document(doc)
                batch_chunks.extend(chunks)
                total_processed += 1
                
                # Small delay to respect rate limits
                await asyncio.sleep(0.1)
            
            # Save batch to database
            if batch_chunks:
                self.save_chunks_to_db(batch_chunks)
                all_chunks.extend(batch_chunks)
                print(f"💾 Saved {len(batch_chunks)} chunks from batch")
        
        print(f"✅ Embedding complete! Processed {total_processed} documents into {len(all_chunks)} chunks")
        return len(all_chunks)
    
    def search_similar(self, query: str, top_k: int = 5, section_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search for similar chunks using cosine similarity"""
        # Get query embedding
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        query_embedding = loop.run_until_complete(self.get_embedding(query))
        loop.close()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Build query
        sql = 'SELECT * FROM chunks'
        params = []
        
        if section_filter:
            sql += ' WHERE id IN (SELECT id FROM chunks WHERE document_id IN (SELECT id FROM documents WHERE section = ?))'
            params.append(section_filter)
        
        cursor.execute(sql, params)
        results = cursor.fetchall()
        
        # Calculate similarities
        similarities = []
        for row in results:
            chunk_embedding = pickle.loads(row[4])  # embedding column
            similarity = np.dot(query_embedding, chunk_embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(chunk_embedding)
            )
            
            similarities.append({
                'id': row[0],
                'document_id': row[1],
                'content': row[3],
                'similarity': float(similarity),
                'metadata': json.loads(row[5])
            })
        
        # Sort by similarity and return top k
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        conn.close()
        
        return similarities[:top_k]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM documents')
        doc_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM chunks')
        chunk_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT section, COUNT(*) FROM documents GROUP BY section')
        sections = dict(cursor.fetchall())
        
        conn.close()
        
        return {
            'documents': doc_count,
            'chunks': chunk_count,
            'sections': sections,
            'database_path': self.db_path
        }

async def main():
    """Main embedding pipeline"""
    import os
    
    # Get API key from environment
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ Please set OPENAI_API_KEY environment variable")
        return
    
    # Load scraped documents
    docs_file = Path("ae_docs_scraped.json")
    if not docs_file.exists():
        print("❌ Please run scraper.py first to generate ae_docs_scraped.json")
        return
    
    with open(docs_file, 'r', encoding='utf-8') as f:
        scraped_docs = json.load(f)
    
    # Initialize pipeline and embed documents
    pipeline = AEEmbeddingPipeline(api_key)
    chunk_count = await pipeline.embed_all_documents(scraped_docs)
    
    # Show stats
    stats = pipeline.get_stats()
    print(f"""
🎉 RAG Pipeline Complete!
📊 Statistics:
   • Documents: {stats['documents']}
   • Chunks: {stats['chunks']}
   • Sections: {list(stats['sections'].keys())}
   • Database: {stats['database_path']}
    """)
    
    # Test search
    print("\n🔍 Testing search...")
    results = pipeline.search_similar("Layer properties animation", top_k=3)
    for i, result in enumerate(results, 1):
        print(f"{i}. Similarity: {result['similarity']:.3f}")
        print(f"   Content: {result['content'][:100]}...")
        print()

if __name__ == "__main__":
    asyncio.run(main()) 