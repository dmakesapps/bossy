#!/usr/bin/env python3
"""
Manual test script for uploading and searching documents.

Usage:
    python test_upload.py path/to/document.pdf

This script:
1. Uploads the document to the RAG service
2. Polls status until ready
3. Runs a sample search query
4. Prints the results
"""

import sys
import time
import requests
import argparse
from pathlib import Path


BASE_URL = "http://localhost:8100/api/v1"


def upload_document(file_path: str, project_id: str, document_id: str) -> dict:
    """Upload a document for processing."""
    with open(file_path, 'rb') as f:
        files = {'file': (Path(file_path).name, f)}
        data = {
            'project_id': project_id,
            'document_id': document_id
        }
        
        response = requests.post(f"{BASE_URL}/documents/upload", files=files, data=data)
        response.raise_for_status()
        return response.json()


def get_status(document_id: str) -> dict:
    """Get document processing status."""
    response = requests.get(f"{BASE_URL}/documents/{document_id}/status")
    response.raise_for_status()
    return response.json()


def search(query: str, project_id: str, top_k: int = 5) -> dict:
    """Search for documents."""
    response = requests.post(
        f"{BASE_URL}/search",
        json={
            "query": query,
            "project_id": project_id,
            "top_k": top_k,
            "score_threshold": 0.5
        }
    )
    response.raise_for_status()
    return response.json()


def main():
    parser = argparse.ArgumentParser(description="Test document upload and search")
    parser.add_argument("file", help="Path to document to upload")
    parser.add_argument("--project", default="test_project", help="Project ID")
    parser.add_argument("--query", default="What is the main topic of this document?", help="Search query")
    
    args = parser.parse_args()
    
    file_path = args.file
    project_id = args.project
    document_id = f"doc_{int(time.time())}"
    
    if not Path(file_path).exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    print(f"📄 Uploading: {file_path}")
    print(f"   Project: {project_id}")
    print(f"   Document ID: {document_id}")
    print()
    
    # Upload
    try:
        result = upload_document(file_path, project_id, document_id)
        print(f"✅ Upload started: {result['message']}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Upload failed: {e}")
        sys.exit(1)
    
    # Poll status
    print("⏳ Processing...", end="", flush=True)
    max_wait = 120  # 2 minutes
    start_time = time.time()
    
    while True:
        status = get_status(document_id)
        
        if status['status'] == 'ready':
            print(f"\n✅ Ready! {status['chunk_count']} chunks created")
            break
        elif status['status'] == 'error':
            print(f"\n❌ Error: {status['error_message']}")
            sys.exit(1)
        
        if time.time() - start_time > max_wait:
            print("\n❌ Timeout waiting for processing")
            sys.exit(1)
        
        print(".", end="", flush=True)
        time.sleep(2)
    
    print()
    
    # Search
    print(f"🔍 Searching: {args.query}")
    print()
    
    try:
        results = search(args.query, project_id)
        
        if not results['results']:
            print("   No results found")
        else:
            for i, r in enumerate(results['results'], 1):
                print(f"   [{i}] Score: {r['score']:.3f}")
                print(f"       Document: {r['document_name']}")
                if r['metadata'].get('page_number'):
                    print(f"       Page: {r['metadata']['page_number']}")
                print(f"       Content: {r['content'][:200]}...")
                print()
    except requests.exceptions.RequestException as e:
        print(f"❌ Search failed: {e}")
        sys.exit(1)
    
    print("✨ Done!")


if __name__ == "__main__":
    main()
