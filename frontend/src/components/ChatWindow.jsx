import { useState, useEffect, useRef } from "react";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import FileHistoryPanel from "./FileHistoryPanel";
import { useChatSessions } from "../context/ChatSessionProvider";
import { DocumentTextIcon, PhotoIcon, FolderOpenIcon } from "@heroicons/react/24/outline";

export default function ChatWindow() {
  const { 
    messages, 
    isLoading: isSessionLoading, 
    sendMessage, 
    currentSession,
    streamingResponse,
    isStreaming } = useChatSessions();
  const [isTyping, setIsTyping] = useState(false);
  const [showFileHistory, setShowFileHistory] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);
  const handleSend = async (userInput, hasFiles = false) => {
    if ((typeof userInput === 'string' && !userInput.trim()) && !hasFiles) return;
    
    // We'll only set isTyping to true if there's no ongoing streaming messages
    const hasStreamingMessage = messages.some(msg => msg.isStreaming);
    if (!hasStreamingMessage) {
      setIsTyping(true);
    }
    
    try {
      await sendMessage(userInput, hasFiles);
    } finally {
      setIsTyping(false);
    }
  };

  // Show welcome message when no messages and not loading
  const showWelcome = messages.length === 0 && !isTyping && !isSessionLoading;

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Welcome screen or messages */}      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 relative">
        {/* File history panel */}
        <FileHistoryPanel 
          isOpen={showFileHistory} 
          onClose={() => setShowFileHistory(false)}
        />
          
        {/* File history toggle button */}
        {currentSession && messages.length > 0 && (
          <button 
            onClick={() => setShowFileHistory(!showFileHistory)}
            className="absolute top-4 right-4 z-20 bg-gray-700 hover:bg-gray-600 text-gray-200 p-2 rounded-full shadow-lg"
            title={showFileHistory ? "Close file history" : "View uploaded files"}
          >
            <FolderOpenIcon className="h-5 w-5" />
          </button>
        )}
          
        {showWelcome ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mb-6">
              <span className="text-4xl font-bold text-white">N</span>
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 mb-3">
              Nexora AI
            </h1>
            <p className="text-gray-400 max-w-md mb-6">
              {currentSession ? 
                `Chat session: ${currentSession.title}` : 
                "Your AI-powered assistant for insightful conversations"}
            </p>
            <p className="text-gray-500 text-sm">
              Start typing below to begin your conversation.
            </p>
          </div>
        ) : (
          <>
            {/* Session title if available */}
            {currentSession && (
              <div className="text-center mb-6">
                <h2 className="text-gray-400 text-sm font-medium">
                  {currentSession.title}
                </h2>
              </div>
            )}
              {/* Messages */}            {messages.map((msg, index) => (
              msg.isError ? (
                <div
                  key={msg.id || index}
                  className="flex justify-start"
                >
                  <div className="rounded-2xl px-6 py-3 max-w-[70%] bg-red-900/30 text-red-200 border border-red-800">
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ) : (                <MessageBubble 
                  key={msg.id || index} 
                  sender={msg.sender} 
                  text={msg.text} 
                  messageId={msg.id || index}
                  attachments={msg.attachments}
                  isStreaming={msg.isStreaming}
                />
              )
            ))}
            
            {/* Only show the typing indicator if we're not already showing a streaming message */}
            {isTyping && !messages.some(msg => msg.isStreaming) && (
              <div className="flex justify-start mb-4">
                <div className="rounded-2xl px-6 py-4 bg-gray-800 text-gray-400 border border-gray-700 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-700">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
