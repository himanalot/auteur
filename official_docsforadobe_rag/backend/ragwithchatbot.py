#!/usr/bin/env python3
"""
RAG Chatbot for After Effects Documentation
Combines document search with conversational AI
"""

import os
import json
import sys
import google.generativeai as genai
from google.generativeai import types
from dotenv import load_dotenv
from helix.client import Query, Client
from helix.types import Payload

# Load environment variables
load_dotenv()

# Initialize Gemini client
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY environment variable not set")

# Configure the Gemini API
genai.configure(api_key=api_key)

# Initialize model for text generation
generation_model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Initialize HelixDB client
db = Client(local=True)

# Query classes for HelixDB
class search_docs_rag(Query):
    def __init__(self, query_vector, k=5):
        super().__init__()
        self.query_vector = query_vector
        self.k = k
    
    def query(self):
        return [{"query": self.query_vector, "k": self.k}]
    
    def response(self, response):
        return response

def search_documentation(user_question, top_k=5):
    """Search the documentation and return relevant chunks"""
    try:
        # Enhance the query for better matching
        enhanced_query = f"{user_question}"
        
        # Embed the enhanced question using the correct API
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=enhanced_query,
            task_type="retrieval_query"
        )
        
        query_embedding = result['embedding']
        
        # Search the docs - get more results to filter from
        total_chunks = 748
        search_query = search_docs_rag(query_embedding, k=min(total_chunks, 20))
        search_results = db.query(search_query)
        
        if search_results and search_results[0]:
            all_results = search_results[0].get('embedding_edges', [])
            
            doc_chunks = []
            for i, result in enumerate(all_results):
                chunk = result.get('chunk', 'No chunk content')
                if isinstance(chunk, list) and len(chunk) > 0:
                    chunk = chunk[0]
                
                subchapter_title = result.get('subchapter_title', 'Unknown file')
                if isinstance(subchapter_title, list) and len(subchapter_title) > 0:
                    subchapter_title = subchapter_title[0]
                
                # Keep all chunks in similarity ranking order
                doc_chunks.append({
                    'file': subchapter_title,
                    'content': chunk,
                    'relevance_score': len(all_results) - i  # Higher score for higher similarity rank
                })
            
            # Return results in original similarity order (already sorted by HelixDB)
            return doc_chunks[:top_k]
        else:
            return []
            
    except Exception as e:
        print(f"Error searching documentation: {e}")
        return []

def generate_related_queries(user_question):
    """Generate multiple related queries to improve document retrieval"""
    query_generation_prompt = f"""You are a search query generator for After Effects ExtendScript documentation. Generate exactly 4 related search queries for comprehensive documentation coverage.

Original question: {user_question}

Generate queries that cover:
1. Main objects/classes (Layer, CompItem, Property, etc.)
2. Specific methods and properties
3. Alternative terminology 
4. Implementation details

CRITICAL: Return ONLY a valid JSON array with exactly 4 strings. No explanations, no markdown, just the JSON:

["query about main objects", "query about methods", "query about properties", "query about implementation"]"""

    try:
        response = generation_model.generate_content(
            contents=query_generation_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                max_output_tokens=300,
            )
        )
        
        # Clean the response text
        response_text = response.text.strip()
        
        # Try to extract JSON from the response
        import json
        import re
        
        # Look for JSON array pattern
        json_match = re.search(r'\[.*?\]', response_text, re.DOTALL)
        if json_match:
            json_text = json_match.group(0)
            queries = json.loads(json_text)
            
            # Validate that we got a list of strings
            if isinstance(queries, list) and all(isinstance(q, str) for q in queries):
                # Add the original question as the first query
                all_queries = [user_question] + queries[:4]
                return all_queries
        
        # If JSON parsing fails, create manual queries
        print("JSON parsing failed, generating manual queries...")
        return generate_manual_queries(user_question)
        
    except Exception as e:
        print(f"Error generating related queries: {e}")
        # Fallback to manual query generation
        return generate_manual_queries(user_question)

def generate_manual_queries(user_question):
    """Generate related queries manually as fallback"""
    # Extract key terms from the question
    question_lower = user_question.lower()
    
    base_queries = [user_question]
    
    # Add common variations based on question content
    if "create" in question_lower or "add" in question_lower:
        if "layer" in question_lower:
            base_queries.append("add layer to composition")
            base_queries.append("layer creation methods")
        if "shape" in question_lower:
            base_queries.append("shape layer properties")
            base_queries.append("addProperty shape")
        if "text" in question_lower:
            base_queries.append("text layer methods")
            base_queries.append("TextLayer properties")
    
    if "property" in question_lower:
        base_queries.append("property setValue getValue")
        base_queries.append("PropertyGroup addProperty")
    
    if "keyframe" in question_lower:
        base_queries.append("setValueAtTime keyframe")
        base_queries.append("Property keyframe methods")
    
    # Add object-specific queries
    if "composition" in question_lower or "comp" in question_lower:
        base_queries.append("CompItem methods properties")
    
    if "effect" in question_lower:
        base_queries.append("apply effect layer")
        base_queries.append("effects property")
    
    # Return up to 5 unique queries
    unique_queries = []
    for query in base_queries:
        if query not in unique_queries:
            unique_queries.append(query)
    
    return unique_queries[:5]

def search_multiple_queries(queries, top_k_per_query=3):
    """Search documentation using multiple queries and combine results"""
    all_docs = []
    seen_content = set()
    
    for query in queries:
        print(f"🔍 Searching: {query[:50]}...")
        docs = search_documentation(query, top_k=top_k_per_query)
        
        # Deduplicate based on content
        for doc in docs:
            content_hash = hash(doc['content'][:200])  # Use first 200 chars for dedup
            if content_hash not in seen_content:
                seen_content.add(content_hash)
                doc['source_query'] = query  # Track which query found this
                all_docs.append(doc)
    
    # Sort by relevance (assuming first results are most relevant)
    # Limit to top 8 most relevant unique documents
    return all_docs[:8]

def generate_rag_response(user_question, conversation_history=None):
    """Generate a response using multi-query RAG context"""
    
    # Generate related queries for comprehensive search
    print("🧠 Generating related search queries...")
    search_queries = generate_related_queries(user_question)
    
    print(f"📝 Generated {len(search_queries)} search queries:")
    for i, query in enumerate(search_queries, 1):
        print(f"  {i}. {query}")
    
    # Search using multiple queries
    print("\n🔍 Searching documentation with multiple queries...")
    relevant_docs = search_multiple_queries(search_queries, top_k_per_query=2)
    
    # Filter and rank the documentation chunks
    filtered_docs = []
    if relevant_docs:
        for doc in relevant_docs:
            # Skip very short chunks that might not be useful
            if len(doc['content'].strip()) > 50:
                # Clean up the content
                cleaned_content = doc['content'].strip()
                # Remove excessive whitespace
                cleaned_content = ' '.join(cleaned_content.split())
                doc['content'] = cleaned_content
                filtered_docs.append(doc)
        
        # Take only the top 6 most relevant after filtering
        filtered_docs = filtered_docs[:6]
    
    print(f"📚 Found {len(filtered_docs)} relevant documentation chunks")
    
    # Build context from documentation
    context_sections = []
    if filtered_docs:
        for i, doc in enumerate(filtered_docs):
            query_info = f" (found via: {doc.get('source_query', 'unknown query')[:40]}...)" if 'source_query' in doc else ""
            context_sections.append(f"=== DOCUMENTATION SOURCE {i+1}: {doc['file']}{query_info} ===")
            context_sections.append(doc['content'])
            context_sections.append("=== END SOURCE ===\n")
    else:
        context_sections.append("=== NO RELEVANT DOCUMENTATION FOUND ===")
    
    documentation_context = "\n".join(context_sections)
    
    # Build conversation context
    conversation_context = ""
    if conversation_history:
        conversation_context = "\n".join([
            f"User: {msg['user']}\nAssistant: {msg['assistant']}" 
            for msg in conversation_history[-3:]  # Last 3 exchanges
        ])
    
    # Create the prompt
    system_prompt = """You are an expert After Effects scripting assistant specializing in ExtendScript programming for Adobe After Effects.

CRITICAL INSTRUCTIONS:
1. ALWAYS prioritize the provided documentation context over general knowledge
2. If information is in the documentation context, cite it directly and use it as your primary source
3. Only use general knowledge when the documentation context doesn't contain relevant information
4. When using documentation, explicitly reference which source you're citing
5. If the documentation contradicts your general knowledge, trust the documentation
6. Be precise and specific - avoid vague or generic answers

Response Guidelines:
- Start with documentation-based answers when available
- Include specific code examples from the documentation
- Use proper ExtendScript syntax (not generic JavaScript)
- Reference method names, property names, and object types exactly as shown in docs
- If documentation is incomplete, clearly state what's missing and then supplement carefully"""

    user_prompt = f"""**MANDATORY ANALYSIS PROCESS:**

**STEP 1**: Read ALL DOCUMENTATION SOURCES below completely and carefully
**STEP 2**: Synthesize information from ALL relevant sources that relate to: {user_question}
**STEP 3**: If multiple sources provide information, combine them for a comprehensive answer
**STEP 4**: If no relevant documentation exists, clearly state this limitation

=== COMPREHENSIVE AFTER EFFECTS DOCUMENTATION CONTEXT ===
{documentation_context}
=== END DOCUMENTATION CONTEXT ===

**SEARCH QUERIES USED:** {', '.join(search_queries[:3])}...

**CONVERSATION HISTORY:**
{conversation_context}

**USER QUESTION:** {user_question}

**RESPONSE PROTOCOL:**
- IF any documentation above contains information about effects, properties, methods, layers, or objects related to the question → BASE YOUR ANSWER ENTIRELY ON THE DOCUMENTATION
- IF multiple sources provide related information → SYNTHESIZE them into a comprehensive answer
- IF the documentation shows specific property names, method names, or syntax → USE EXACTLY THOSE NAMES
- IF the documentation doesn't contain relevant information → Start with "The provided After Effects documentation doesn't contain specific information about [topic]. Based on general ExtendScript knowledge..."
- ALWAYS format code with ```javascript
- NEVER use generic advice when specific documentation is available
- CITE which documentation sources you used (e.g., "According to Source 1 and 3...")

**CRITICAL:** Your answer must clearly indicate whether you're using the provided documentation or general knowledge, and which specific sources informed your response.

RESPOND NOW FOLLOWING THE PROTOCOL ABOVE:"""

    try:
        # Generate response using Gemini
        response = generation_model.generate_content(
            contents=user_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.05,  # Very low temperature for maximum consistency
                max_output_tokens=2000,
                top_p=0.7,
            )
        )
        
        ai_response = response.text.strip()
        
        # Add source references if we found documentation
        if filtered_docs:
            ai_response += f"\n\n**📖 Sources:** {', '.join([doc['file'] for doc in filtered_docs])}"
        
        return {
            'success': True,
            'response': ai_response,
            'sources': filtered_docs,
            'query': user_question
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'query': user_question
        }

def chat_session():
    """Interactive chat session"""
    print("🎬 After Effects Documentation RAG Chatbot")
    print("=" * 60)
    print("Ask me anything about After Effects scripting!")
    print("Type 'quit' to exit, 'clear' to clear history")
    print("=" * 60)
    
    conversation_history = []
    
    while True:
        try:
            user_input = input("\n👤 You: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("Goodbye! 👋")
                break
            
            if user_input.lower() == 'clear':
                conversation_history = []
                print("🧹 Conversation history cleared!")
                continue
            
            if not user_input:
                continue
            
            print("🤖 Assistant: ", end="", flush=True)
            
            # Generate response
            result = generate_rag_response(user_input, conversation_history)
            
            if result['success']:
                print(result['response'])
                
                # Add to conversation history
                conversation_history.append({
                    'user': user_input,
                    'assistant': result['response']
                })
                
                # Keep only last 5 exchanges
                if len(conversation_history) > 5:
                    conversation_history = conversation_history[-5:]
            else:
                print(f"❌ Error: {result['error']}")
                
        except KeyboardInterrupt:
            print("\n\nGoodbye! 👋")
            break
        except Exception as e:
            print(f"❌ Unexpected error: {e}")

def answer_single_question(question):
    """Answer a single question and return JSON (for CEP integration)"""
    result = generate_rag_response(question)
    return json.dumps(result, indent=2)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Single question mode (for integration)
        question = " ".join(sys.argv[1:])
        print(answer_single_question(question))
    else:
        # Interactive chat mode
        chat_session() 