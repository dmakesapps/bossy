"""
Tests for the document parser service.
"""

import tempfile
import pytest
from pathlib import Path

from app.services.parser import DocumentParser, ParsedSection
from app.utils.text_cleaner import clean_text, is_meaningful_text


class TestTextCleaner:
    """Tests for text cleaning utilities."""
    
    def test_clean_text_removes_excessive_whitespace(self):
        """Multiple spaces should become single space."""
        text = "Hello    world   test"
        result = clean_text(text)
        assert "    " not in result
        assert "Hello world test" == result
    
    def test_clean_text_removes_excessive_newlines(self):
        """3+ newlines should become 2 newlines."""
        text = "Paragraph 1\n\n\n\n\nParagraph 2"
        result = clean_text(text)
        assert "\n\n\n" not in result
        assert "Paragraph 1\n\nParagraph 2" == result
    
    def test_clean_text_fixes_hyphenation(self):
        """Broken hyphenation should be rejoined."""
        text = "docu-\nment"
        result = clean_text(text)
        assert "document" == result
    
    def test_clean_text_normalizes_quotes(self):
        """Smart quotes should become standard quotes."""
        text = "\u201cHello\u201d"  # Smart quotes: " "
        result = clean_text(text)
        assert '"Hello"' == result
    
    def test_clean_text_normalizes_dashes(self):
        """Em/en dashes should become hyphens."""
        text = "word\u2014word"  # Em dash
        result = clean_text(text)
        assert "word-word" == result
    
    def test_is_meaningful_text_empty(self):
        """Empty text is not meaningful."""
        assert not is_meaningful_text("")
        assert not is_meaningful_text("   ")
        assert not is_meaningful_text(None)
    
    def test_is_meaningful_text_too_short(self):
        """Very short text is not meaningful."""
        assert not is_meaningful_text("Hi")
        assert not is_meaningful_text("Test")
    
    def test_is_meaningful_text_garbled(self):
        """Mostly non-alphanumeric text is garbled."""
        assert not is_meaningful_text("!@#$%^&*()_+{}[]|")
    
    def test_is_meaningful_text_valid(self):
        """Normal text is meaningful."""
        assert is_meaningful_text("This is a normal sentence.")
        assert is_meaningful_text("Hello world, how are you?")


class TestDocumentParser:
    """Tests for the document parser."""
    
    @pytest.fixture
    def parser(self):
        """Create a parser instance."""
        return DocumentParser()
    
    def test_parse_txt_file(self, parser):
        """Test parsing a text file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("This is a test paragraph.\n\nThis is another paragraph.")
            f.flush()
            
            sections = parser.parse(f.name, 'txt')
            
            assert len(sections) > 0
            assert all(isinstance(s, ParsedSection) for s in sections)
            assert all(s.doc_type == "txt" for s in sections)
    
    def test_parse_markdown_file(self, parser):
        """Test parsing a markdown file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
            f.write("# Heading 1\n\nSome content here.\n\n## Heading 2\n\nMore content here.")
            f.flush()
            
            sections = parser.parse(f.name, 'md')
            
            assert len(sections) > 0
            assert any(s.section_title for s in sections)
    
    def test_parse_csv_file(self, parser):
        """Test parsing a CSV file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write("Name,Age,City\nAlice,30,NYC\nBob,25,LA\nCharlie,35,Chicago")
            f.flush()
            
            sections = parser.parse(f.name, 'csv')
            
            assert len(sections) > 0
            assert all(s.doc_type == "csv" for s in sections)
    
    def test_parse_empty_file(self, parser):
        """Test graceful handling of empty file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("")
            f.flush()
            
            sections = parser.parse(f.name, 'txt')
            
            assert len(sections) == 0
    
    def test_parse_unsupported_type(self, parser):
        """Test unsupported file type returns empty list."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.xyz', delete=False) as f:
            f.write("Some content")
            f.flush()
            
            sections = parser.parse(f.name, 'xyz')
            
            assert len(sections) == 0
    
    def test_parse_nonexistent_file(self, parser):
        """Test handling of nonexistent file."""
        sections = parser.parse("/nonexistent/file.txt", 'txt')
        assert len(sections) == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
