# Dataset configuration for RAG (Retrieval-Augmented Generation)
# Update DATASET_PATH to point to your desired CSV file for domain-specific Q&A

import os

DATASET_PATH = os.getenv('RAG_DATASET_PATH', r'D:\MECON\Project\chatbot-app\backend\sap_issues_dataset.csv')


