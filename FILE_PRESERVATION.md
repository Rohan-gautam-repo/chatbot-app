# File Preservation Feature

This document explains how the file preservation feature works in the chatbot application.

## Overview

The file preservation feature allows users to upload files that remain accessible throughout the chat session. Users can reference these files in follow-up questions, and the AI can provide context-aware responses based on the previously uploaded files.

## Key Features

- Files are preserved after uploading instead of being deleted after extraction
- A file history panel allows quick access to previously uploaded files
- Users can ask follow-up questions about specific files
- Files can be recalled by name or through the UI
- Green indicators show which files are preserved

## Technical Implementation

### Backend Changes

1. **File Storage**: Changed `delete_after_processing` default to `False` in `file_processor.py`
2. **New API Endpoints**: Added `/file-context` endpoints to retrieve file information:
   - `/file-context/{chat_id}` - Get files from a specific chat message
   - `/file-context/by-filename/{filename}` - Find a file by name
   - `/file-context/recent/{session_id}` - Get recently uploaded files in a session

### Frontend Changes

1. **File History Panel**: Added a new component that shows previously uploaded files
2. **Visual Indicators**: Green dots/text to indicate files are preserved
3. **Integration with Chat**: Ability to reference files in new messages

## Usage Instructions

### Uploading Files

1. Click the paper clip icon in the chat input
2. Select one or more files from your device
3. The green dot indicates files will be preserved
4. Send your message with the attachments

### Accessing Previous Files

1. Click the folder icon in the top-right of the chat window
2. A panel will open showing your previously uploaded files
3. Click on any file to ask a follow-up question about it

### Asking Follow-up Questions

You can ask follow-up questions about files in two ways:

1. **Using the File History Panel**: Click on a file to automatically create a question
2. **Referencing by Name**: Simply mention the filename in your question

Example: "Can you explain more about the section on pandas in the ADVANCED_PYTHON.pdf file?"

## Data Management

Files are stored in the `uploads` directory with a unique identifier. The application manages files through:

1. **Database Storage**: File metadata and extracted text are saved in the database
2. **ChromaDB Integration**: File content is indexed for semantic search
3. **Cleanup Tasks**: Old files can be removed via the cleanup script

## User Privacy

Files are only accessible to the user who uploaded them. Authentication is required for all file access endpoints.

## Future Improvements

- File organization by tags or categories
- Improved search capabilities for file contents
- Direct annotations on PDFs and images
- Collaborative file sharing between users
