import { useState, useRef, useEffect } from "react";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlusCircleIcon,
  ClockIcon,
  TrashIcon,
  PencilSquareIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthProvider";
import { useChatSessions } from "../context/ChatSessionProvider";
import { format } from 'date-fns';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const renameFormRef = useRef(null);
  const { user } = useAuth();
  const { 
    sessions, 
    currentSession, 
    createNewSession, 
    selectSession,
    updateSessionTitle,
    deleteSession,
    isLoading: isSessionLoading
  } = useChatSessions();

  // Handle click outside to cancel editing
  useEffect(() => {
    function handleClickOutside(event) {
      if (renameFormRef.current && !renameFormRef.current.contains(event.target)) {
        // Cancel editing when clicking outside
        setEditingId(null);
      }
    }

    if (editingId !== null) {
      // Add click event listener when in edit mode
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      // Clean up the event listener
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingId]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleNewChat = () => {
    createNewSession();
  };

  const handleSelectSession = (sessionId) => {
    // Don't change sessions if we're currently editing
    if (!editingId) {
      selectSession(sessionId);
    }
  };

  const startEditing = (session, e) => {
    if (e) {
      e.stopPropagation();
    }
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const cancelEditing = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingId(null);
  };
  
  const handleUpdateTitle = async (e) => {
    e.preventDefault();
    if (editingId && editTitle.trim()) {
      try {
        setIsEditing(true);
        await updateSessionTitle(editingId, editTitle.trim());
        setEditingId(null);
      } catch (error) {
        console.error("Failed to update title:", error);
        // Show error state or message
      } finally {
        setIsEditing(false);
      }
    } else {
      // Cancel editing if title is empty
      setEditingId(null);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation(); // Prevent triggering the select session event
    if (window.confirm("Are you sure you want to delete this chat?")) {
      try {
        // Set loading state
        setDeletingSessionId(sessionId);
        
        // Call the delete session function from context
        // ChatSessionProvider will handle creating new sessions or selecting another one
        await deleteSession(sessionId);
      } catch (error) {
        console.error("Failed to delete session:", error);
        alert("Failed to delete chat session");
      } finally {
        setDeletingSessionId(null);
      }
    }
  };

  return (
    <div className={`h-screen flex flex-col transition-all duration-300 border-r border-gray-800 ${isOpen ? "w-72" : "w-16"}`}>
      {/* Sidebar Header with New Chat */}
      <div className="px-3 py-4">
        <div className="flex items-center justify-between mb-4">
          {isOpen && (
            <h1 className="text-lg font-semibold text-white">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Nexora AI
              </span>
            </h1>
          )}
          
          <button 
            onClick={toggleSidebar} 
            className="p-1.5 rounded-full hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
          >
            {isOpen ? (
              <ChevronLeftIcon className="h-5 w-5" />
            ) : (
              <ChevronRightIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* New Chat Button */}
        <button 
          onClick={handleNewChat}
          className="flex items-center gap-3 w-full text-white bg-gradient-to-r from-blue-600/90 to-purple-600/90 hover:from-blue-600 hover:to-purple-600 px-3 py-3 rounded-lg transition-all duration-200 shadow-sm mb-4"
        >
          <PlusCircleIcon className="h-5 w-5" />
          {isOpen && <span className="font-medium text-sm">New Chat</span>}
        </button>
      </div>
      
      {/* Divider */}
      {isOpen && <div className="mx-3 border-t border-gray-800 mb-4"></div>}
      
      {/* Chat History Section */}
      <div className="px-3 overflow-y-auto flex-1">
        <div className="space-y-1">
          {isOpen && (
            <div className="flex items-center mb-2 px-3">
              <ClockIcon className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chat History
              </span>
            </div>
          )}
          {/* Session List */}
          <div className="space-y-1">
            {sessions.map((session) => (
              <div key={session.id} className="relative group">
                {editingId === session.id ? (
                  <form 
                    ref={renameFormRef}
                    onSubmit={handleUpdateTitle} 
                    className="flex px-1 py-1 bg-gray-700/80 rounded-lg z-10"
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoFocus
                      className="flex-1 bg-gray-700 text-gray-200 px-2 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter chat title..."
                      maxLength={50}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          cancelEditing(e);
                        }
                      }}
                    />
                    <div className="flex">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="ml-1 p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-600"
                        title="Cancel"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="submit"
                        disabled={isEditing || !editTitle.trim()}
                        className={`ml-1 p-1.5 rounded text-white ${
                          isEditing || !editTitle.trim()
                            ? "bg-blue-500/50 cursor-not-allowed" 
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                        title="Save"
                      >
                        {isEditing ? (
                          <div className="h-3 w-3 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                        ) : (
                          "Save"
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => handleSelectSession(session.id)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-colors ${
                      currentSession?.id === session.id
                        ? "bg-gray-700 text-white"
                        : "hover:bg-gray-800/70 text-gray-300 hover:text-white"
                    }`}
                  >
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="text-sm font-medium truncate w-full text-left">
                        {session.title}
                      </span>
                      {isOpen && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(session.updated_at), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                    
                    {isOpen && (
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => startEditing(session, e)}
                          disabled={isEditing}
                          className={`p-1 rounded ${
                            isEditing
                              ? "bg-gray-600/50 cursor-not-allowed"
                              : "hover:bg-gray-600 text-gray-400 hover:text-white"
                          }`}
                          title="Rename chat"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          disabled={deletingSessionId === session.id}
                          className={`p-1 rounded ${
                            deletingSessionId === session.id
                              ? "bg-red-700/50 cursor-not-allowed"
                              : "hover:bg-gray-600 text-gray-400 hover:text-red-400"
                          }`}
                          title="Delete chat"
                        >
                          {deletingSessionId === session.id ? (
                            <div className="h-4 w-4 border-t-2 border-b-2 border-gray-200 rounded-full animate-spin"></div>
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </button>
                )}
              </div>
            ))}

            {sessions.length === 0 && isOpen && (
              <div className="text-gray-500 text-sm py-2 px-3">
                No chat history yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}