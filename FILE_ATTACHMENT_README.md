# File Attachment Feature

This document explains how the file attachment feature works in the chatbot application.

## Overview

The file attachment feature allows users to upload images and documents (PDF, Word, plain text) along with their messages. The backend processes these files to extract text content, which is then sent to the AI model for analysis.

## Features

- Upload multiple files along with a message
- Supported file types: 
  - Images (JPEG, PNG, GIF)
  - Documents (PDF, DOC, DOCX, TXT)
- Text extraction from various file formats:
  - OCR for images using Tesseract
  - PDF to text conversion
  - Word document text extraction
- File size limit: 10MB per file
- Preview of uploaded files before sending
- Ability to remove files before sending

## Backend Components

- `FileProcessor` utility class for file handling and text extraction
- File upload endpoint in the chat API
- Database storage for file metadata and extracted text
- Static file serving for uploaded files

## Frontend Components

- File upload button in the ChatInput component
- File preview with type-specific icons
- File removal functionality
- Display of uploaded files and extracted text in chat messages

## Dependencies

### Backend
- pytesseract (OCR engine)
- pdf2image (PDF conversion)
- python-docx (Word document processing)
- docx2txt (Word document text extraction)
- Pillow (Image processing)
- python-multipart (File upload handling)

### Frontend
- React state management for file handling
- FormData API for file uploads
- Heroicons for UI elements

## Installation Requirements

For the OCR functionality to work properly, you need to install Tesseract OCR on your system:

- Windows: Download and install from [Tesseract at UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)
- macOS: `brew install tesseract`
- Linux: `sudo apt-get install tesseract-ocr`

After installing Tesseract, you may need to configure the path in `file_processor.py`:

```python
pytesseract.pytesseract.tesseract_cmd = r'Path\to\tesseract.exe'  # Windows example
```

## Usage

1. Click the paper clip icon in the chat input
2. Select one or more files from your device
3. Optionally type a message to accompany the files
4. Click the send button to upload files and receive AI response

## Future Improvements

- Support for more file formats
- Better OCR for complex images
- Image content analysis using AI vision models
- Drag and drop file upload
- File upload progress indicators
