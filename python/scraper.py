#!/usr/bin/env python3
"""
After Effects Scripting Documentation Scraper
Scrapes https://ae-scripting.docsforadobe.dev/ for RAG pipeline
"""

import asyncio
import aiohttp
import json
import time
import re
from pathlib import Path
from typing import List, Dict, Any
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import hashlib

class AEDocscraper:
    def __init__(self, base_url: str = "https://ae-scripting.docsforadobe.dev/"):
        self.base_url = base_url
        self.visited_urls = set()
        self.scraped_docs = []
        self.session = None
        self.rate_limit_delay = 1.0  # 1 second between requests
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={
                'User-Agent': 'AE-Tools-RAG-Scraper/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text content"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        # Remove special characters that might break embeddings
        text = re.sub(r'[^\w\s\.\,\;\:\!\?\-\(\)\[\]\{\}]', '', text)
        return text
    
    def extract_metadata(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract metadata from the page"""
        metadata = {
            'url': url,
            'timestamp': time.time(),
            'title': '',
            'description': '',
            'section': '',
            'subsection': '',
            'type': 'documentation'
        }
        
        # Extract title
        title_tag = soup.find('title')
        if title_tag:
            metadata['title'] = self.clean_text(title_tag.get_text())
        
        # Extract h1 if no title
        if not metadata['title']:
            h1_tag = soup.find('h1')
            if h1_tag:
                metadata['title'] = self.clean_text(h1_tag.get_text())
        
        # Extract description from meta tag
        desc_tag = soup.find('meta', attrs={'name': 'description'})
        if desc_tag:
            metadata['description'] = self.clean_text(desc_tag.get('content', ''))
        
        # Determine section from URL structure
        path_parts = urlparse(url).path.strip('/').split('/')
        if len(path_parts) >= 1:
            metadata['section'] = path_parts[0]
        if len(path_parts) >= 2:
            metadata['subsection'] = path_parts[1]
            
        return metadata
    
    async def extract_content(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract different types of content from the page"""
        content = {
            'main_content': '',
            'code_examples': '',
            'properties': '',
            'methods': '',
            'parameters': ''
        }
        
        # Remove navigation, footer, and other non-content elements
        for tag in soup(['nav', 'footer', 'header', 'aside', '.nav', '.footer', '.sidebar']):
            tag.decompose()
        
        # Extract main content
        main_content_areas = [
            soup.find('main'),
            soup.find('article'),
            soup.find('.content'),
            soup.find('#content'),
            soup.find('.documentation')
        ]
        
        main_area = next((area for area in main_content_areas if area), soup)
        
        if main_area:
            # Extract text content
            content['main_content'] = self.clean_text(main_area.get_text())
            
            # Extract code examples
            code_blocks = main_area.find_all(['code', 'pre', '.code-block', '.highlight'])
            code_examples = []
            for block in code_blocks:
                code_text = self.clean_text(block.get_text())
                if len(code_text) > 10:  # Filter out small code snippets
                    code_examples.append(code_text)
            content['code_examples'] = ' | '.join(code_examples)
            
            # Extract property definitions
            prop_sections = main_area.find_all(['dt', 'th', '.property', '.param'])
            properties = []
            for prop in prop_sections:
                prop_text = self.clean_text(prop.get_text())
                if prop_text:
                    properties.append(prop_text)
            content['properties'] = ' | '.join(properties)
        
        return content
    
    async def scrape_page(self, url: str) -> Dict[str, Any] | None:
        """Scrape a single page"""
        if url in self.visited_urls:
            return None
            
        try:
            await asyncio.sleep(self.rate_limit_delay)
            
            async with self.session.get(url) as response:
                if response.status != 200:
                    print(f"❌ Failed to fetch {url}: {response.status}")
                    return None
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Extract metadata and content
                metadata = self.extract_metadata(soup, url)
                content = await self.extract_content(soup)
                
                # Combine everything
                doc = {
                    **metadata,
                    **content,
                    'combined_content': f"{metadata['title']} {metadata['description']} {content['main_content']}",
                    'id': hashlib.md5(url.encode()).hexdigest()
                }
                
                self.visited_urls.add(url)
                print(f"✅ Scraped: {metadata['title'][:50]}...")
                return doc
                
        except Exception as e:
            print(f"❌ Error scraping {url}: {e}")
            return None
    
    async def discover_urls(self, start_url: str) -> List[str]:
        """Discover all documentation URLs from the site"""
        urls_to_scrape = set([start_url])
        discovered_urls = set()
        
        try:
            async with self.session.get(start_url) as response:
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Find all internal links
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    full_url = urljoin(start_url, href)
                    
                    # Only include docs from the same domain
                    if urlparse(full_url).netloc == urlparse(start_url).netloc:
                        # Filter out non-documentation URLs
                        path = urlparse(full_url).path
                        if any(skip in path.lower() for skip in ['#', 'javascript:', 'mailto:', '.pdf', '.zip']):
                            continue
                        discovered_urls.add(full_url)
                
                # Look for navigation menus and sitemaps
                nav_areas = soup.find_all(['nav', '.nav', '.navigation', '.toc', '.sidebar'])
                for nav in nav_areas:
                    for link in nav.find_all('a', href=True):
                        href = link['href']
                        full_url = urljoin(start_url, href)
                        if urlparse(full_url).netloc == urlparse(start_url).netloc:
                            discovered_urls.add(full_url)
                
        except Exception as e:
            print(f"❌ Error discovering URLs: {e}")
        
        return list(discovered_urls)
    
    async def scrape_all(self, max_pages: int = 200) -> List[Dict[str, Any]]:
        """Scrape all documentation pages"""
        print(f"🚀 Starting scrape of {self.base_url}")
        
        # Discover all URLs
        print("🔍 Discovering URLs...")
        urls_to_scrape = await self.discover_urls(self.base_url)
        print(f"📄 Found {len(urls_to_scrape)} URLs to scrape")
        
        # Limit the number of pages
        if len(urls_to_scrape) > max_pages:
            urls_to_scrape = urls_to_scrape[:max_pages]
            print(f"⚠️ Limited to {max_pages} pages")
        
        # Scrape all pages
        print("📥 Scraping pages...")
        scraped_docs = []
        
        for i, url in enumerate(urls_to_scrape, 1):
            print(f"[{i}/{len(urls_to_scrape)}] Scraping: {url}")
            doc = await self.scrape_page(url)
            if doc and len(doc.get('combined_content', '')) > 100:  # Filter out empty pages
                scraped_docs.append(doc)
        
        print(f"✅ Scraping complete! Collected {len(scraped_docs)} valid documents")
        return scraped_docs
    
    def save_to_json(self, docs: List[Dict[str, Any]], filename: str = "ae_docs_scraped.json"):
        """Save scraped docs to JSON file"""
        output_path = Path(filename)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(docs, f, indent=2, ensure_ascii=False)
        print(f"💾 Saved {len(docs)} documents to {output_path}")

async def main():
    """Main scraping function"""
    async with AEDocscraper() as scraper:
        docs = await scraper.scrape_all(max_pages=150)  # Adjust as needed
        scraper.save_to_json(docs)
        return docs

if __name__ == "__main__":
    # Run the scraper
    scraped_documents = asyncio.run(main())
    print(f"🎉 Scraping completed! {len(scraped_documents)} documents ready for embedding.") 