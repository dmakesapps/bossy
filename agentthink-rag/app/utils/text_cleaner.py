"""
Text Cleaning Utilities

Functions for cleaning and normalizing text extracted from documents.
"""

import re
import unicodedata
from typing import Optional


def clean_text(text: str) -> str:
    """
    Clean and normalize text extracted from documents.
    
    Performs the following operations:
    1. Remove null bytes and control characters
    2. Fix broken hyphenation (word-\\n continuation)
    3. Normalize unicode characters
    4. Remove excessive whitespace
    5. Remove excessive newlines
    6. Strip leading/trailing whitespace
    
    Args:
        text: The raw text to clean
        
    Returns:
        Cleaned and normalized text
    """
    if not text:
        return ""
    
    # Remove null bytes and control characters (except newlines and tabs)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    
    # Fix broken hyphenation (word-\n continuation -> rejoined word)
    # Handles cases like "docu-\nment" -> "document"
    text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)
    
    # Normalize unicode characters
    text = unicodedata.normalize('NFKC', text)
    
    # Convert smart quotes to standard quotes
    smart_quotes = {
        '\u2018': "'",  # Left single quote
        '\u2019': "'",  # Right single quote
        '\u201c': '"',  # Left double quote
        '\u201d': '"',  # Right double quote
        '\u2033': '"',  # Double prime
        '\u2032': "'",  # Single prime
    }
    for smart, standard in smart_quotes.items():
        text = text.replace(smart, standard)
    
    # Convert em/en dashes to hyphens
    text = text.replace('\u2013', '-')  # En dash
    text = text.replace('\u2014', '-')  # Em dash
    text = text.replace('\u2015', '-')  # Horizontal bar
    
    # Remove excessive whitespace (multiple spaces -> single space)
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Remove excessive newlines (3+ newlines -> 2 newlines)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Strip leading/trailing whitespace from each line
    lines = [line.strip() for line in text.split('\n')]
    text = '\n'.join(lines)
    
    # Strip leading/trailing whitespace from the whole text
    text = text.strip()
    
    return text


def is_meaningful_text(text: str, min_length: int = 10, max_non_alpha_ratio: float = 0.9) -> bool:
    """
    Check if text contains meaningful content.
    
    Returns False if:
    - Text is empty or only whitespace
    - Text is fewer than min_length characters
    - Text is more than max_non_alpha_ratio non-alphanumeric (likely garbled)
    
    Args:
        text: The text to check
        min_length: Minimum character count for meaningful text
        max_non_alpha_ratio: Maximum ratio of non-alphanumeric characters
        
    Returns:
        True if text appears to be meaningful, False otherwise
    """
    if not text:
        return False
    
    # Strip whitespace for length check
    stripped = text.strip()
    
    if not stripped:
        return False
    
    if len(stripped) < min_length:
        return False
    
    # Check ratio of non-alphanumeric characters
    alpha_count = sum(1 for c in stripped if c.isalnum())
    total_count = len(stripped)
    
    if total_count == 0:
        return False
    
    alpha_ratio = alpha_count / total_count
    
    # If less than (1 - max_non_alpha_ratio) are alphanumeric, it's likely garbled
    if alpha_ratio < (1 - max_non_alpha_ratio):
        return False
    
    return True


def normalize_whitespace(text: str) -> str:
    """
    Normalize all whitespace to single spaces, preserving paragraph breaks.
    
    Args:
        text: Text to normalize
        
    Returns:
        Text with normalized whitespace
    """
    if not text:
        return ""
    
    # Split by paragraph breaks (double newline)
    paragraphs = re.split(r'\n\s*\n', text)
    
    # Normalize each paragraph
    normalized = []
    for para in paragraphs:
        # Replace all whitespace with single space
        para = re.sub(r'\s+', ' ', para)
        para = para.strip()
        if para:
            normalized.append(para)
    
    return '\n\n'.join(normalized)


def extract_text_blocks(text: str, separator: str = '\n\n') -> list[str]:
    """
    Split text into blocks by the given separator.
    
    Filters out empty blocks and blocks with no meaningful content.
    
    Args:
        text: Text to split
        separator: Separator string to split on
        
    Returns:
        List of non-empty text blocks
    """
    if not text:
        return []
    
    blocks = text.split(separator)
    
    # Filter and clean blocks
    result = []
    for block in blocks:
        cleaned = block.strip()
        if cleaned and is_meaningful_text(cleaned):
            result.append(cleaned)
    
    return result
