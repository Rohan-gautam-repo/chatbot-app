import api from './api';

// Add the authorization header to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const createChatSession = async (title = "New Chat") => {
  try {
    const response = await api.post('/chat-sessions', { title });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network error');
  }
};

export const getUserSessions = async () => {
  try {
    const response = await api.get('/chat-sessions');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network error');
  }
};

export const getSessionMessages = async (sessionId) => {
  try {
    const response = await api.get(`/chat-sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network error');
  }
};

export const updateSessionTitle = async (sessionId, title) => {
  try {
    const response = await api.put(`/chat-sessions/${sessionId}`, { title });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network error');
  }
};

export const deleteSession = async (sessionId) => {
  try {
    const response = await api.delete(`/chat-sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network error');
  }
};

export const sendChatMessage = async (message, sessionId) => {
  try {
    const response = await api.post('/chat', { message, session_id: sessionId });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network error');
  }
};

// New function to send chat message with files
export const sendChatMessageWithFiles = async (formData, sessionId) => {
  try {
    // Append session ID to the form data
    formData.append('session_id', sessionId);
    
    // Set content type to multipart/form-data (will be set automatically by axios)
    const response = await api.post('/chat/with-files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network error');
  }
};