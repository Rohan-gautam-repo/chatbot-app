# Chatbot Application Backend

This document provides instructions for setting up and running the chatbot application backend on a new PC.

## Prerequisites

Before getting started, ensure you have the following installed on your system:

- Python 3.9+ (3.10+ recommended)
- MySQL Database
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) (required for document text extraction)

## Setup Instructions

Follow these steps to set up the backend environment:

### 1. Clone the Repository (if applicable)

```powershell
git clone <repository-url>
cd path/to/chatbot-app/backend
```

### 2. Create a Virtual Environment

```powershell
python -m venv venv
```

### 3. Activate the Virtual Environment

```powershell
.\venv\Scripts\Activate
```

### 4. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 5. Configure Environment Variables

Create a `.env` file in the backend directory with the following content:

```
# Database Configuration
DATABASE_URL=mysql+mysqlconnector://username:password@localhost/chatbot_db

# Security Configuration
SECRET_KEY=your_secret_key_here

# File Upload Configuration
UPLOAD_DIR=./uploads

# Optional: OCR Configuration
TESSERACT_PATH=C:/Program Files/Tesseract-OCR/tesseract.exe
```

Adjust the values according to your environment.

### 6. Initialize the Database

Ensure your MySQL server is running, then create a database named `chatbot_db` (or whatever name you specified in your DATABASE_URL).

```powershell
# Start MySQL service if not already running
net start mysql
```

The application will automatically create the necessary tables when it runs for the first time.

### 7. Start the Application

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be accessible at http://localhost:8000.

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Features

- User authentication and session management
- File uploads and processing (PDF, DOCX, images)
- OCR text extraction from documents and images
- Semantic search using ChromaDB vector database
- Chat history and context management

## Troubleshooting

### Common Issues

#### 1. bcrypt Error
If you see an error about bcrypt version, ensure you're using bcrypt==3.2.0 which is compatible with passlib.

#### 2. Tesseract OCR Not Found
Ensure Tesseract is installed and the path is correctly set in your `.env` file.

#### 3. Database Connection Issues
Verify your MySQL credentials and ensure the service is running.

#### 4. ChromaDB Initialization Failed
The application will attempt to recreate the ChromaDB collection if initialization fails. Check the logs for details.

## Maintenance

To delete old uploaded files that weren't processed:

```powershell
python cleanup_uploads.py [age_in_hours] [--dry-run]
```

## Security Notes

- In production, replace the SECRET_KEY with a strong, random value
- Configure CORS settings in app.main.py for your production frontend
- Consider using HTTPS in production

## License

[Your License Information]
