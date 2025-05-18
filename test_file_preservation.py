import os
import sys
import json
import requests
from datetime import datetime

# Configuration
API_URL = "http://localhost:8000"
TEST_PDF = "test_file.pdf"  # Make sure this file exists in the same directory
AUTH_TOKEN = None  # Will be set after login

def login():
    """Login to get an auth token"""
    print("Logging in to get auth token...")
    
    login_data = {
        "username": "testuser",  # Change this to a valid username
        "password": "password123"  # Change this to a valid password
    }
    
    response = requests.post(f"{API_URL}/auth/login", json=login_data)
    
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        sys.exit(1)
        
    global AUTH_TOKEN
    AUTH_TOKEN = response.json()["access_token"]
    print("Login successful!")
    return response.json()["user_id"]

def create_chat_session():
    """Create a new chat session"""
    print("Creating new chat session...")
    
    headers = {"Authorization": f"Bearer {AUTH_TOKEN}"}
    data = {"title": f"File Preservation Test {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"}
    
    response = requests.post(f"{API_URL}/chat-sessions", json=data, headers=headers)
    
    if response.status_code != 200:
        print(f"Failed to create chat session: {response.text}")
        sys.exit(1)
        
    print(f"Chat session created with ID: {response.json()['id']}")
    return response.json()["id"]

def upload_file(session_id):
    """Upload a test file to the chat session"""
    print(f"Uploading test file {TEST_PDF}...")
    
    if not os.path.exists(TEST_PDF):
        print(f"Test file {TEST_PDF} not found!")
        print("Please create a test PDF file or update the TEST_PDF variable.")
        sys.exit(1)
    
    headers = {"Authorization": f"Bearer {AUTH_TOKEN}"}
    
    # Create FormData with file and session ID
    files = {"files": (TEST_PDF, open(TEST_PDF, "rb"), "application/pdf")}
    data = {"session_id": str(session_id), "message": "Here's a test PDF file for preservation testing."}
    
    response = requests.post(f"{API_URL}/chat/with-files", files=files, data=data, headers=headers)
    
    if response.status_code != 200:
        print(f"Failed to upload file: {response.text}")
        sys.exit(1)
    
    print("File uploaded successfully!")
    return response.json()["chat_id"]

def get_file_context(chat_id):
    """Get the context of the uploaded file"""
    print(f"Getting file context for chat ID {chat_id}...")
    
    headers = {"Authorization": f"Bearer {AUTH_TOKEN}"}
    
    response = requests.get(f"{API_URL}/file-context/{chat_id}", headers=headers)
    
    if response.status_code != 200:
        print(f"Failed to get file context: {response.text}")
        sys.exit(1)
    
    print("File context retrieved successfully!")
    return response.json()

def ask_followup_question(session_id, filename):
    """Ask a follow-up question about the file"""
    print(f"Asking follow-up question about {filename}...")
    
    headers = {"Authorization": f"Bearer {AUTH_TOKEN}"}
    data = {
        "message": f"Can you tell me more about the contents of {filename}?",
        "session_id": session_id
    }
    
    response = requests.post(f"{API_URL}/chat", json=data, headers=headers)
    
    if response.status_code != 200:
        print(f"Failed to ask follow-up question: {response.text}")
        sys.exit(1)
    
    print("Follow-up question sent successfully!")
    print(f"AI Response: {response.json()['reply']}")
    return response.json()["chat_id"]

def run_test():
    """Run the full test sequence"""
    print("===== File Preservation Test =====")
    print("This test will verify that files are preserved in the chat session.")
    
    # Login
    user_id = login()
    
    # Create chat session
    session_id = create_chat_session()
    
    # Upload file
    chat_id = upload_file(session_id)
    
    # Get file context
    file_context = get_file_context(chat_id)
    print("\nFile Context:")
    print(json.dumps(file_context, indent=2))
    
    # Get the filename from the response
    filename = file_context["files"][0]["name"] if "files" in file_context else TEST_PDF
    
    # Ask follow-up question
    ask_followup_question(session_id, filename)
    
    print("\n===== Test Complete =====")
    print("The test file has been preserved and can be referenced in future questions.")
    print(f"Session ID: {session_id}")
    print(f"Chat ID: {chat_id}")
    print(f"File: {filename}")

if __name__ == "__main__":
    run_test()
