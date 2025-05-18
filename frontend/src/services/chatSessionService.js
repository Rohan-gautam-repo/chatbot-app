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

export const streamChatMessage = async (message, sessionId, onChunk, abortSignal) => {
  try {
    const response = await fetch(`${api.defaults.baseURL}/streaming`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ message, session_id: sessionId }),
      signal: abortSignal // Pass the abort signal to fetch
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      fullResponse += chunk;
      onChunk(chunk);
    }

    return { reply: fullResponse };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { reply: 'Response generation stopped by user.', aborted: true };
    }
    throw error;
  }
};

export const streamChatMessageWithFiles = async (formData, sessionId, onChunk, abortSignal) => {
  try {
    // Append session ID to the form data
    formData.append('session_id', sessionId);
    
    const response = await fetch(`${api.defaults.baseURL}/streaming/with-files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData,
      signal: abortSignal // Pass the abort signal to fetch
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let attachments = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      
      // The first chunk is expected to be a JSON string with attachment info
      if (!attachments && chunk.trim().startsWith('{')) {
        const newlineIndex = chunk.indexOf('\n');
        if (newlineIndex > -1) {
          try {
            const attachmentJson = chunk.substring(0, newlineIndex);
            attachments = JSON.parse(attachmentJson);
            
            // Only pass the content after the attachments JSON
            const contentAfterJson = chunk.substring(newlineIndex + 1);
            if (contentAfterJson) {
              fullResponse += contentAfterJson;
              onChunk(contentAfterJson);
            }
          } catch (e) {
            console.error("Error parsing attachments JSON:", e);
            fullResponse += chunk;
            onChunk(chunk);
          }
        } else {
          fullResponse += chunk;
          onChunk(chunk);
        }
      } else {
        fullResponse += chunk;
        onChunk(chunk);
      }
    }

    return { 
      reply: fullResponse,
      originalAttachments: attachments ? attachments.attachments : null
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { 
        reply: 'Response generation stopped by user.',
        originalAttachments: attachments ? attachments.attachments : null,
        aborted: true 
      };
    }
    throw error;
  }
};