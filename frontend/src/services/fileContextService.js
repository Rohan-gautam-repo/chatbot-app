import api from './api';

// Get context for a specific file attached to a chat message
export const getFileContext = async (chatId, fileIndex = null) => {
  try {
    const url = fileIndex !== null 
      ? `/file-context/${chatId}?file_index=${fileIndex}`
      : `/file-context/${chatId}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network error');
  }
};

// Find a file by filename across all chats
export const findFileByName = async (filename) => {
  try {
    const response = await api.get(`/file-context/by-filename/${encodeURIComponent(filename)}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network error');
  }
};

// Get recent files from a specific chat session
export const getRecentFiles = async (sessionId, limit = 5) => {
  try {
    const response = await api.get(`/file-context/recent/${sessionId}?limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network error');
  }
};
