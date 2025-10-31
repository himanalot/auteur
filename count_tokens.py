#!/usr/bin/env python3
import os
import re
from pathlib import Path
from collections import defaultdict

def count_tokens(text):
    """
    Count tokens in text using a simple whitespace + punctuation tokenizer
    This approximates GPT-style tokenization for estimation purposes
    """
    # Remove extra whitespace and normalize
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Split on whitespace and common punctuation
    tokens = re.findall(r'\w+|[^\w\s]', text)
    
    # Filter out empty tokens
    tokens = [t for t in tokens if t.strip()]
    
    return len(tokens)

def should_process_file(filepath):
    """Check if file should be processed based on extension"""
    text_extensions = {
        '.md', '.txt', '.js', '.jsx', '.html', '.css', '.json', 
        '.py', '.yml', '.yaml', '.xml', '.rst', '.ts', '.tsx'
    }
    return filepath.suffix.lower() in text_extensions

def count_tokens_in_directory(directory_path):
    """Count tokens in all text files in a directory"""
    directory = Path(directory_path)
    total_tokens = 0
    file_count = 0
    file_details = []
    folder_stats = defaultdict(lambda: {'tokens': 0, 'files': 0, 'chars': 0})
    
    for filepath in directory.rglob('*'):
        if filepath.is_file() and should_process_file(filepath):
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    tokens = count_tokens(content)
                    total_tokens += tokens
                    file_count += 1
                    
                    # Store details for each file
                    relative_path = filepath.relative_to(directory)
                    file_details.append((str(relative_path), tokens, len(content)))
                    
                    # Get the top-level folder (or root if file is in root)
                    if len(relative_path.parts) > 1:
                        folder = relative_path.parts[0]
                    else:
                        folder = "root"
                    
                    # Update folder statistics
                    folder_stats[folder]['tokens'] += tokens
                    folder_stats[folder]['files'] += 1
                    folder_stats[folder]['chars'] += len(content)
                    
            except Exception as e:
                print(f"Error processing {filepath}: {e}")
    
    return total_tokens, file_count, file_details, folder_stats

if __name__ == "__main__":
    docs_dir = "ae-scripting-docs"
    
    print(f"Counting tokens in: {docs_dir}")
    print("=" * 60)
    
    total_tokens, file_count, file_details, folder_stats = count_tokens_in_directory(docs_dir)
    
    # Sort folders by token count (descending)
    sorted_folders = sorted(folder_stats.items(), key=lambda x: x[1]['tokens'], reverse=True)
    
    print(f"SUMMARY BY FOLDER:")
    print("-" * 60)
    print(f"{'Folder':<20} {'Files':<8} {'Tokens':<12} {'Chars':<12} {'Avg/File':<10}")
    print("-" * 60)
    
    for folder, stats in sorted_folders:
        avg_tokens = stats['tokens'] / stats['files'] if stats['files'] > 0 else 0
        print(f"{folder:<20} {stats['files']:<8} {stats['tokens']:<12,} {stats['chars']:<12,} {avg_tokens:<10.0f}")
    
    print("-" * 60)
    print(f"{'TOTAL':<20} {file_count:<8} {total_tokens:<12,} {sum(f['chars'] for f in folder_stats.values()):<12,} {total_tokens/file_count:<10.0f}")
    
    print(f"\nDETAILED BREAKDOWN:")
    print("=" * 80)
    
    # Group files by folder for detailed view
    files_by_folder = defaultdict(list)
    for filepath, tokens, chars in file_details:
        parts = Path(filepath).parts
        folder = parts[0] if len(parts) > 1 else "root"
        files_by_folder[folder].append((filepath, tokens, chars))
    
    # Sort and display each folder's contents
    for folder, stats in sorted_folders:
        print(f"\n📁 {folder.upper()} FOLDER - {stats['tokens']:,} tokens ({stats['files']} files)")
        print("-" * 80)
        print(f"{'File':<50} {'Tokens':<10} {'Chars':<10}")
        print("-" * 80)
        
        # Sort files within folder by token count
        folder_files = sorted(files_by_folder[folder], key=lambda x: x[1], reverse=True)
        
        for filepath, tokens, chars in folder_files:
            # Show just the filename for cleaner display
            filename = Path(filepath).name
            print(f"{filename:<50} {tokens:<10,} {chars:<10,}")
    
    # Additional statistics
    print(f"\n📊 OVERALL STATISTICS:")
    print(f"Total folders: {len(folder_stats)}")
    print(f"Total files: {file_count}")
    print(f"Total tokens: {total_tokens:,}")
    print(f"Total characters: {sum(f['chars'] for f in folder_stats.values()):,}")
    print(f"Average tokens per file: {total_tokens/file_count:.1f}")
    print(f"Average tokens per folder: {total_tokens/len(folder_stats):.1f}")
    print(f"Token to character ratio: {total_tokens/sum(f['chars'] for f in folder_stats.values()):.3f}") 