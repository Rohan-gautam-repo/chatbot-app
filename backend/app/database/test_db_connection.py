#!/usr/bin/env python
"""
Simple script to test the MySQL database connection for the Nexora AI backend.

Usage:
    python test_db_connection.py
"""

from sqlalchemy import text
from app.database.db import engine

def test_connection():
    try:
        # Try to connect and execute a simple query
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            
            # Get database info
            db_info = connection.execute(text("SELECT VERSION()"))
            version = db_info.scalar()
            print(f"MySQL Version: {version}")
            
            # List all tables in the database
            tables = connection.execute(text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'nexora_ai'"
            ))
            print("\nTables in the database:")
            table_list = [table[0] for table in tables]
            if table_list:
                for table in table_list:
                    print(f"- {table}")
            else:
                print("No tables found. Database exists but may be empty.")
                
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        print("\nPossible issues:")
        print("1. MySQL service may not be running")
        print("2. Database 'nexora_ai' might not exist")
        print("3. Username or password may be incorrect")
        print("4. MySQL connector may not be installed (pip install mysql-connector-python)")
        return False

if __name__ == "__main__":
    print("Testing database connection...")
    test_connection()