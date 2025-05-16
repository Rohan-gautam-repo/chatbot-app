import os
import uuid
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import tempfile
import docx2txt
import shutil
import time
from datetime import datetime, timedelta

# Configure Tesseract path for Windows if needed
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

class FileProcessor:
    def __init__(self, upload_dir="uploads"):
        self.upload_dir = upload_dir
        # Create uploads directory if it doesn't exist
        os.makedirs(self.upload_dir, exist_ok=True)
        
    def save_file(self, file, user_id):
        """Save the uploaded file to disk and return file info"""
        # Create user directory if it doesn't exist
        user_dir = os.path.join(self.upload_dir, str(user_id))
        os.makedirs(user_dir, exist_ok=True)
        
        # Generate a unique filename to prevent collisions
        filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(user_dir, filename)
        
        # Save file to disk
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        # Generate URL path for the file
        url_path = f"/uploads/{user_id}/{filename}"
        
        return {
            "original_name": file.filename,
            "path": file_path,
            "url": url_path,
            "content_type": file.content_type,
            "size": os.path.getsize(file_path)
        }
            
    def extract_text_from_file(self, file_info):
        """Extract text from images, PDFs, and documents"""
        file_path = file_info["path"]
        content_type = file_info["content_type"]
        extracted_text = ""
        
        try:
            # Handle image files
            if content_type.startswith("image/"):
                img = Image.open(file_path)
                extracted_text = pytesseract.image_to_string(img)
                
            # Handle PDF files
            elif content_type == "application/pdf":
                with tempfile.TemporaryDirectory() as temp_dir:
                    # Convert PDF to images
                    pages = convert_from_path(file_path, output_folder=temp_dir)
                    text_parts = []
                    
                    # Extract text from each page
                    for page in pages:
                        text_parts.append(pytesseract.image_to_string(page))
                    
                    extracted_text = "\n\n".join(text_parts)
                    
            # Handle Word documents
            elif content_type == "application/msword" or content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                extracted_text = docx2txt.process(file_path)
                
            # Handle text files
            elif content_type == "text/plain":
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    extracted_text = f.read()
                    
        except Exception as e:
            print(f"Error extracting text from {file_info['original_name']}: {str(e)}")
            extracted_text = f"[Error extracting text: {str(e)}]"
        
        return extracted_text.strip() or "[No text could be extracted from this file]"
    
    def delete_file(self, file_path):
        """Delete a file from disk after it has been processed"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file {file_path}: {str(e)}")
            return False
    
    def process_file(self, file, user_id, delete_after_processing=True):
        """Process an uploaded file - save it, extract text, and optionally delete it"""
        file_info = self.save_file(file, user_id)
        
        # Only attempt to extract text if the file type is supported
        if file_info["content_type"].startswith("image/") or \
           file_info["content_type"] == "application/pdf" or \
           file_info["content_type"] == "application/msword" or \
           file_info["content_type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or \
           file_info["content_type"] == "text/plain":
            
            file_info["extracted_text"] = self.extract_text_from_file(file_info)
        else:
            file_info["extracted_text"] = "[Text extraction not supported for this file type]"
        
        # Delete the file after processing if requested
        if delete_after_processing:
            was_deleted = self.delete_file(file_info["path"])
            file_info["deleted"] = was_deleted
            
        return file_info
    
    def cleanup_old_files(self, max_age_hours=24, dry_run=False):
        """
        Clean up files older than the specified age in hours
        
        Parameters:
        - max_age_hours: Files older than this many hours will be deleted
        - dry_run: If True, only count files that would be deleted without actually deleting
        
        Returns:
        - Number of files deleted (or that would be deleted if dry_run=True)
        """
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        deleted_count = 0
        
        try:
            # Check if upload directory exists
            if not os.path.exists(self.upload_dir):
                return 0
            
            # Walk through all user directories in the uploads folder
            for user_dir in os.listdir(self.upload_dir):
                user_path = os.path.join(self.upload_dir, user_dir)
                
                # Skip if not a directory
                if not os.path.isdir(user_path):
                    continue
                
                # Check all files in the user directory
                for filename in os.listdir(user_path):
                    file_path = os.path.join(user_path, filename)
                    
                    # Skip if not a file
                    if not os.path.isfile(file_path):
                        continue
                    
                    # Get file modification time
                    file_mod_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                    
                    # Delete files older than cutoff time
                    if file_mod_time < cutoff_time:
                        if dry_run:
                            # Just count the file without deleting it
                            deleted_count += 1
                        elif self.delete_file(file_path):
                            deleted_count += 1
                
                # Remove empty user directories if not in dry run mode
                if not dry_run:
                    try:
                        if os.path.exists(user_path) and not os.listdir(user_path):
                            os.rmdir(user_path)
                    except Exception as e:
                        print(f"Error removing directory {user_path}: {str(e)}")
            
            return deleted_count
            
        except Exception as e:
            print(f"Error during cleanup: {str(e)}")
            return deleted_count

# Create singleton instance
file_processor = FileProcessor()
