// filepath: d:\MECON\Project\chatbot-app\frontend\src\components\MessageBubble.jsx
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChatSessions } from '../context/ChatSessionProvider';
import { DocumentTextIcon, PhotoIcon } from "@heroicons/react/24/outline";

function MessageBubble({ sender, text, messageId, attachments = [] }) {
    const isUser = sender === 'user';
    const { deleteMessage, resendMessage } = useChatSessions();
    const [showActions, setShowActions] = useState(false);
    // Initialize with text or empty string to avoid null/undefined issues
    const [formattedText, setFormattedText] = useState(text || '');
    
    // Ensure attachments is always an array
    const normalizedAttachments = Array.isArray(attachments) ? attachments : [];
    
    // Preprocess text for better markdown rendering
    useEffect(() => {
      if (!isUser && text) {
        try {
          // Clean up numbered lists without proper spacing
          let processed = text.replace(/(\d+\.\s)([^\n]+)(?:\n)(?=\d+\.)/g, '$1$2\n\n');
          
          // Ensure proper spacing between bullet points
          processed = processed.replace(/(\*\s[^\n]+)(?:\n)(?=\*\s)/g, '$1\n\n');
          
          // Make bold headers stand out
          processed = processed.replace(/^(\d+\.\s+)\*\*([^:]+):\*\*/gm, '$1### $2:');
          
          setFormattedText(processed);
        } catch (error) {
          console.error("Error formatting text:", error);
          setFormattedText(text || '');
        }
      } else {
        setFormattedText(text || '');
      }
    }, [text, isUser]);
    
    const renderAttachment = (attachment, index) => {
      // Ensure attachment is an object
      if (!attachment || typeof attachment !== 'object') {
        console.error("Invalid attachment:", attachment);
        return null;
      }
      
      const { type, url, name, extracted_text, preview } = attachment;
      const displayName = name || attachment.original_name || attachment.filename || 'Attachment';
      
      // For image attachments
      if (type && type.startsWith('image/')) {
        return (
          <div key={`attachment-${index}`} className="mt-2 relative">
            {(url || preview) ? (
              <a 
                href={url || preview} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block"
                title="View full image"
              >
                <div className="relative">
                  <img 
                    src={url || preview} 
                    alt={displayName || 'Attached image'}
                    className="rounded-md max-h-64 max-w-full object-contain border border-gray-600"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center">
                    <PhotoIcon className="h-3 w-3 mr-1" />
                    {displayName?.length > 20 ? displayName.substring(0, 20) + '...' : displayName}
                  </div>
                </div>
              </a>
            ) : (
              // Display just the file name if no URL is available
              <div className="flex items-center p-2 bg-gray-700 rounded-md">
                <PhotoIcon className="h-5 w-5 text-blue-400 mr-2" />
                <span className="text-sm text-gray-200 truncate">
                  {displayName || 'Image file'}
                </span>
              </div>
            )}
            
            {extracted_text && (
              <div className="mt-1 p-2 bg-gray-700 rounded-md text-xs text-gray-300 border border-gray-600">
                <p className="font-semibold text-gray-400 mb-1">Extracted Text:</p>
                <p className="line-clamp-3">{extracted_text}</p>
                {extracted_text.length > 180 && (
                  <button 
                    className="text-blue-400 hover:text-blue-300 mt-1 text-xs"
                    onClick={() => alert(extracted_text)}
                  >
                    View full text
                  </button>
                )}
              </div>
            )}
          </div>
        );
      }
      
      // For document attachments
      return (
        <div key={`attachment-${index}`} className="mt-2">
          {url ? (
            <a
              href={url}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
            >
              <DocumentTextIcon className="h-5 w-5 text-blue-400 mr-2" />
              <span className="text-sm text-gray-200 truncate">
                {displayName}
              </span>
            </a>
          ) : (
            // Display just the file name if no URL is available
            <div className="flex items-center p-2 bg-gray-700 rounded-md">
              <DocumentTextIcon className="h-5 w-5 text-blue-400 mr-2" />
              <span className="text-sm text-gray-200 truncate">
                {displayName}
              </span>
            </div>
          )}
          
          {extracted_text && (
            <div className="mt-1 p-2 bg-gray-700 rounded-md text-xs text-gray-300 border border-gray-600">
              <p className="font-semibold text-gray-400 mb-1">Extracted Text:</p>
              <p className="line-clamp-3">{extracted_text}</p>
              {extracted_text.length > 180 && (
                <button 
                  className="text-blue-400 hover:text-blue-300 mt-1 text-xs"
                  onClick={() => alert(extracted_text)}
                >
                  View full text
                </button>
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`} 
           onMouseEnter={() => setShowActions(true)}
           onMouseLeave={() => setShowActions(false)}
      >
        {/* Action buttons that appear on hover for user messages */}
        {isUser && showActions && (
          <div className="flex items-center mr-2 opacity-0 group-hover:opacity-100 transition-opacity">            <button 
              onClick={() => resendMessage(text, messageId)}
              className="text-gray-400 hover:text-blue-400 p-1 rounded mr-1"
              title="Resend"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
            <button 
              onClick={() => deleteMessage(messageId)}
              className="text-gray-400 hover:text-red-400 p-1 rounded"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        )}

        <div 
          className={`rounded-2xl px-6 py-3 max-w-[70%] ${
            isUser 
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
              : 'bg-gray-800 text-gray-200 border border-gray-700'
          }`}
        >
          {isUser ? (
            <>
              <p className="text-sm">{text || ''}</p>
              {normalizedAttachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {normalizedAttachments.map((attachment, index) => renderAttachment(attachment, index))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-sm ai-response markdown-content">
                {formattedText ? (
                  <ReactMarkdown>{formattedText}</ReactMarkdown>
                ) : (
                  <p>No response available</p>
                )}
              </div>
              {normalizedAttachments.length > 0 && (
                <div className="mt-2 space-y-2 border-t border-gray-700 pt-2">
                  {normalizedAttachments.map((attachment, index) => renderAttachment(attachment, index))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
}
  
export default MessageBubble;
