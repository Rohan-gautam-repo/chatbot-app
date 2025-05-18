import React, { useState, useEffect } from 'react';
import { useChatSessions } from '../context/ChatSessionProvider';
import { getRecentFiles } from '../services/fileContextService';
import { DocumentTextIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

const FileHistoryPanel = ({ isOpen, onClose }) => {
  const { currentSession, sendMessage } = useChatSessions();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load recent files when the panel is opened and a session is active
    if (isOpen && currentSession?.id) {
      loadRecentFiles();
    }
  }, [isOpen, currentSession]);

  const loadRecentFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getRecentFiles(currentSession.id, 10);
      setFiles(result.files || []);
    } catch (err) {
      console.error('Failed to load recent files:', err);
      setError('Failed to load recent files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClick = (file) => {
    // Create a prompt about the file
    const filePrompt = `I want to ask about the file "${file.file.name}" that I uploaded earlier. Can you summarize its key points again?`;
    sendMessage(filePrompt);
    onClose();
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) {
      return <PhotoIcon className="h-5 w-5 text-blue-400" />;
    }
    return <DocumentTextIcon className="h-5 w-5 text-yellow-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-72 bg-gray-800 border-l border-gray-700 z-10 flex flex-col shadow-lg">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-lg font-medium text-white">Recent Files</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white focus:outline-none"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center">{error}</div>
        ) : files.length === 0 ? (
          <div className="text-gray-400 text-center">No files found in this chat session</div>
        ) : (
          files.map((fileItem, index) => (
            <button
              key={`${fileItem.chat_id}-${index}`}
              className="w-full text-left p-3 rounded-md hover:bg-gray-700 transition-colors flex items-start space-x-3 border border-gray-700"
              onClick={() => handleFileClick(fileItem)}
            >
              <div className="flex-shrink-0">
                {getFileIcon(fileItem.file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {fileItem.file.name}
                </p>
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {new Date(fileItem.timestamp).toLocaleString()}
                </p>
                {fileItem.file.extracted_text && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {fileItem.file.extracted_text.substring(0, 100)}...
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default FileHistoryPanel;
