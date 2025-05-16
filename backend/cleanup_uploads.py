#!/usr/bin/env python
"""
Cleanup script for uploaded files in the chat application.
This script can be run periodically (e.g., daily) to remove any files 
that weren't deleted during processing.

Usage:
    python cleanup_uploads.py [age_in_hours] [--dry-run]
    
    age_in_hours: Optional. Files older than this will be deleted. Default is 24 hours.
    --dry-run: Optional. If specified, the script will only show what would be deleted
               without actually removing any files.

Examples:
    # Delete files older than 24 hours (default)
    python cleanup_uploads.py
    
    # Delete files older than 48 hours
    python cleanup_uploads.py 48
    
    # Show what would be deleted without actually deleting
    python cleanup_uploads.py --dry-run
    
    # Show files older than 12 hours without deleting them
    python cleanup_uploads.py 12 --dry-run

Scheduled Task Examples:
    # To run as a cron job (Linux/Unix/macOS):
    # Add to crontab with: crontab -e
    # Run daily at 2:00 AM:
    0 2 * * * cd /path/to/backend && python cleanup_uploads.py
    
    # To run as a scheduled task (Windows):
    # 1. Create a .bat file with the following content:
    #    @echo off
    #    cd /d D:\MECON\Project\chatbot-app\backend
    #    python cleanup_uploads.py
    # 2. Use Task Scheduler to run this .bat file daily
"""

import sys
import os
from datetime import datetime, timedelta
from app.utils.file_processor import file_processor

def list_old_files(max_age_hours):
    """List files older than the specified age without deleting them"""
    cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
    old_files = []
    
    if not os.path.exists(file_processor.upload_dir):
        return old_files
    
    for user_dir in os.listdir(file_processor.upload_dir):
        user_path = os.path.join(file_processor.upload_dir, user_dir)
        if not os.path.isdir(user_path):
            continue
            
        for filename in os.listdir(user_path):
            file_path = os.path.join(user_path, filename)
            if not os.path.isfile(file_path):
                continue
                
            file_mod_time = datetime.fromtimestamp(os.path.getmtime(file_path))
            if file_mod_time < cutoff_time:
                file_size_kb = os.path.getsize(file_path) / 1024
                old_files.append((file_path, file_mod_time, file_size_kb))
                
    return old_files

def main():
    # Default to 24 hours if no argument is provided
    max_age_hours = 24
    dry_run = False
      # Parse command-line arguments
    for arg in sys.argv[1:]:
        if arg == "--dry-run":
            dry_run = True
        else:
            try:
                max_age_hours = float(arg)
            except ValueError:
                print(f"Error: Invalid age value '{arg}'. Using default of 24 hours.")
    
    # Run the cleanup with or without dry-run mode
    deleted_count = file_processor.cleanup_old_files(max_age_hours, dry_run=dry_run)
    
    if dry_run:
        print(f"Found {deleted_count} files older than {max_age_hours} hours that would be deleted.")
        print("\nNo files were actually deleted (dry run).")
    else:
        print(f"Cleanup completed. Deleted {deleted_count} files older than {max_age_hours} hours.")

if __name__ == "__main__":
    main()
