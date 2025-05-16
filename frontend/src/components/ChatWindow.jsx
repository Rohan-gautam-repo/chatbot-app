import { useState, useEffect, useRef } from "react";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import { useChatSessions } from "../context/ChatSessionProvider";
import { DocumentTextIcon, PhotoIcon } from "@heroicons/react/24/outline";

export default function ChatWindow() {
  const { 
    messages, 
    isLoading: isSessionLoading, 
    sendMessage, 
    currentSession 
  } = useChatSessions();
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (userInput, hasFiles = false) => {
    if ((typeof userInput === 'string' && !userInput.trim()) && !hasFiles) return;
    
    setIsTyping(true);
    
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
      {/* Welcome screen or messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
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
              {/* Messages */}
            {messages.map((msg, index) => (
              msg.isError ? (
                <div
                  key={msg.id || index}
                  className="flex justify-start"
                >
                  <div className="rounded-2xl px-6 py-3 max-w-[70%] bg-red-900/30 text-red-200 border border-red-800">
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ) : (
                <MessageBubble 
                  key={msg.id || index} 
                  sender={msg.sender} 
                  text={msg.text} 
                  messageId={msg.id || index}
                  attachments={msg.attachments}
                />
              )
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-6 py-3 bg-gray-800 text-gray-400 border border-gray-700 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
