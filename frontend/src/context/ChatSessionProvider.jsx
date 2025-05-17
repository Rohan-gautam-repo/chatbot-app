import React, { createContext, useContext, useState, useEffect } from 'react';
import * as chatSessionService from '../services/chatSessionService';
import { useAuth } from './AuthProvider';

const ChatSessionContext = createContext();

export const useChatSessions = () => useContext(ChatSessionContext);

export default function ChatSessionProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);  // Import useAuth hook
  const { user } = useAuth();

  // Load user's sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        console.log("Loading chat sessions...");
        const userSessions = await chatSessionService.getUserSessions();
        console.log("Chat sessions loaded:", userSessions);
        setSessions(userSessions);
        
        // If there are sessions and no current session is selected, select the first one
        if (userSessions.length > 0 && !currentSession) {
          console.log("Selecting first session:", userSessions[0].id);
          await selectSession(userSessions[0].id);
        } else if (userSessions.length === 0) {
          console.log("No sessions found, creating a new one");
          await createNewSession();
        }
      } catch (err) {
        console.error("Failed to load sessions:", err);
        setError("Failed to load chat sessions");
      } finally {
        setIsLoading(false);
      }
    };

    // Only load sessions if the user is logged in (has a token)
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    console.log("Checking for auth token:", !!token);
    if (token && userId) {
      loadSessions();
    } else {
      console.log("No token found, skipping session load");
      setSessions([]); // Clear any existing sessions
      setCurrentSession(null);
      setMessages([]);
    }
  }, [user?.id]); // Reload when user changes
  // Create a new chat session
  const createNewSession = async (title = "New Chat") => {
    try {
      setIsLoading(true);
      console.log("Creating new session with title:", title);
      const newSession = await chatSessionService.createChatSession(title);
      console.log("New session created:", newSession);
      
      // Use functional update to ensure we have the latest state
      setSessions(prevSessions => [newSession, ...prevSessions]);
      
      setCurrentSession(newSession);
      setMessages([]); // Clear messages for new session
      
      return newSession;
    } catch (err) {
      console.error("Failed to create new session:", err);
      setError("Failed to create new chat session");
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  // Select a session and load its messages
  const selectSession = async (sessionId) => {
    try {
      setIsLoading(true);
      
      // Find the session in state
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setCurrentSession(session);
          // Load messages for this session
        const sessionMessages = await chatSessionService.getSessionMessages(sessionId);
        
        console.log("Session messages from API:", sessionMessages);        // Convert to the format expected by the chat window
        const formattedMessages = sessionMessages.map(msg => {
          // Process and normalize user attachments
          let userAttachments = [];
          
          if (msg.attachments) {
            // Backend might return attachments as a string, array or object
            try {
              // If it's already an array, use it directly
              if (Array.isArray(msg.attachments)) {
                userAttachments = msg.attachments;
              } 
              // If it's a stringified JSON, parse it
              else if (typeof msg.attachments === 'string') {
                userAttachments = JSON.parse(msg.attachments);
              }
              
              // Ensure each attachment has a name
              userAttachments = userAttachments.map(att => ({
                ...att,
                name: att.name || att.original_name || att.filename || 'Attachment'
              }));
              
            } catch (error) {
              console.error("Error parsing attachments:", error);
              userAttachments = [];
            }
          }
          
          console.log(`Message ${msg.id} has ${userAttachments.length} attachments:`, userAttachments);
          
          return {
            sender: "user",
            text: msg.message,
            timestamp: new Date(msg.timestamp),
            id: msg.id,
            attachments: userAttachments
          };
        }).flatMap(userMsg => {
          const assistantMsg = sessionMessages.find(m => m.id === userMsg.id);
          
          // Process assistant attachments (if any)
          let assistantAttachments = [];
          if (assistantMsg && assistantMsg.assistant_attachments) {
            try {
              if (Array.isArray(assistantMsg.assistant_attachments)) {
                assistantAttachments = assistantMsg.assistant_attachments;
              } else if (typeof assistantMsg.assistant_attachments === 'string') {
                assistantAttachments = JSON.parse(assistantMsg.assistant_attachments);
              }
              
              assistantAttachments = assistantAttachments.map(att => ({
                ...att,
                name: att.name || att.original_name || att.filename || 'Attachment'
              }));
            } catch (error) {
              console.error("Error parsing assistant attachments:", error);
            }
          }
          
          return [
            userMsg,
            {
              sender: "nexora",
              text: assistantMsg?.response || "No response",
              timestamp: new Date(assistantMsg?.timestamp || Date.now()),
              id: userMsg.id + "-response",
              attachments: assistantAttachments
            }
          ];
        });
        
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error("Failed to load session messages:", err);
      setError("Failed to load chat messages");
    } finally {
      setIsLoading(false);
    }
  };

  // Send a message in the current session
  const sendMessage = async (messageContent, hasFiles = false) => {
    if (!currentSession) {
      // Create a new session if none exists
      const newSession = await createNewSession();
      if (!newSession) return;
    }

    const tempId = Date.now();
    let userMessage;
    
    if (hasFiles) {
      // Handle FormData with files
      const formData = messageContent;
      const messageText = formData.get('message') || '';
      
      // Preview files for immediate display
      const files = formData.getAll('files');
      const fileAttachments = Array.from(files).map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      }));
      
      userMessage = { 
        id: tempId,
        sender: "user", 
        text: messageText,
        timestamp: new Date(),
        attachments: fileAttachments
      };
    } else {
      // Regular text message
      userMessage = { 
        id: tempId,
        sender: "user", 
        text: messageContent,
        timestamp: new Date()
      };
    }
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage]);

    try {
      let response;
      
      if (hasFiles) {
        // Send message with files
        response = await chatSessionService.sendChatMessageWithFiles(messageContent, currentSession.id);
      } else {
        // Send regular text message
        response = await chatSessionService.sendChatMessage(messageContent, currentSession.id);
      }
        // Add AI response to messages
      const aiMessage = {
        id: tempId + "-response",
        sender: "nexora",
        text: response.reply,
        timestamp: new Date(),
        attachments: response.attachments || []
      };
      
      // Log for debugging        console.log("Response from server:", response);
        
        // Log attachment information for debugging
        if (response.originalAttachments) {
          console.log("Original attachments:", response.originalAttachments);
        }
      
      setMessages(prev => {        // Clean up any URL.createObjectURL references to prevent memory leaks
        prev.forEach(msg => {
          if (msg.attachments) {
            msg.attachments.forEach(att => {
              if (att.preview && typeof att.preview === 'string' && att.preview.startsWith('blob:')) {
                URL.revokeObjectURL(att.preview);
                console.log("Revoked blob URL:", att.preview, "for file:", att.name);
              }
            });
          }
        });
          // Replace temporary attachments with server-processed ones while preserving names
        return prev.map(msg => {
          if (msg.id === tempId && hasFiles) {
            // Merge the attachment information, preserving names from the original attachments
            const mergedAttachments = response.originalAttachments ? 
              response.originalAttachments.map((serverAttachment, index) => {
                // Find the matching original attachment to preserve its name
                const originalAttachment = msg.attachments[index];
                return {
                  ...serverAttachment,
                  name: originalAttachment?.name || serverAttachment.name || 'Attachment'
                };
              }) : msg.attachments;
              
            return {
              ...msg,
              attachments: mergedAttachments
            };
          }
          return msg;
        }).concat(aiMessage);
      });

      // Update the sessions list to show this one was recently used
      const updatedSessions = sessions.map(s => 
        s.id === currentSession.id 
          ? { ...s, updated_at: new Date().toISOString() } 
          : s
      );
      
      // Sort sessions by updated_at
      updatedSessions.sort((a, b) => 
        new Date(b.updated_at) - new Date(a.updated_at)
      );
      
      setSessions(updatedSessions);
    } catch (err) {
      console.error("Failed to send message:", err);
      
      // Add error message
      const errorMessage = {
        id: tempId + "-error",
        sender: "nexora",
        text: "Sorry, something went wrong. Please try again.",
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };
  
  // Delete a specific message and its response
  const deleteMessage = (messageId) => {
    // Filter out the specified message and its corresponding response
    setMessages(prev => 
      prev.filter(msg => 
        !msg.id.toString().includes(messageId.toString())
      )
    );
  };
  // Resend a specific message
  const resendMessage = async (messageText, messageId) => {
    // We want to simulate the behavior of ChatGPT's resend feature
    // First, delete all messages from this message forward
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex !== -1) {
      // Keep messages up to this one (inclusive)
      const messagesToKeep = messages.slice(0, messageIndex + 1);
      setMessages(messagesToKeep);
    }
    
    // Now send the message as a new message
    return sendMessage(messageText);
  };

  // Update a session's title
  const updateSessionTitle = async (sessionId, newTitle) => {
    try {
      setIsLoading(true);
      const updatedSession = await chatSessionService.updateSessionTitle(sessionId, newTitle);
      
      // Update the session in the sessions list
      const updatedSessions = sessions.map(s =>
        s.id === sessionId
          ? { ...s, title: newTitle }
          : s
      );
      
      setSessions(updatedSessions);
      
      // If this is the current session, update that too
      if (currentSession?.id === sessionId) {
        setCurrentSession({ ...currentSession, title: newTitle });
      }
      
      return updatedSession;
    } catch (err) {
      console.error("Failed to update session title:", err);
      setError("Failed to update chat title");
    } finally {
      setIsLoading(false);
    }
  };
  // Delete a session
  const deleteSession = async (sessionId) => {
    try {
      setIsLoading(true);
      await chatSessionService.deleteSession(sessionId);
        // Remove the session from the sessions list
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
        
      // If this was the current session, handle the transition
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
        
        // If there are no sessions left, create a new one automatically
        if (updatedSessions.length === 0) {
          console.log("No sessions remaining, creating a new one");
          try {
            const newSession = await createNewSession();
            console.log("Created new session after deletion:", newSession);
          } catch (createErr) {
            console.error("Failed to create new session after deletion:", createErr);
          }
        } else {
          // Select the first available session
          console.log("Selecting first available session after deletion");
          try {
            await selectSession(updatedSessions[0].id);
          } catch (selectErr) {
            console.error("Failed to select next session:", selectErr);
          }
        }
      }
      
      return true; // Indicate successful deletion
    } catch (err) {
      console.error("Failed to delete session:", err);
      setError("Failed to delete chat");
      throw err; // Re-throw to allow caller to catch the error
    } finally {
      setIsLoading(false);
    }
  };
  const value = {
    sessions,
    currentSession,
    messages,
    isLoading,
    error,
    createNewSession,
    selectSession,
    sendMessage,
    clearMessages,
    updateSessionTitle,
    deleteSession,
    deleteMessage,
    resendMessage
  };

  return (
    <ChatSessionContext.Provider value={value}>
      {children}
    </ChatSessionContext.Provider>
  );
}