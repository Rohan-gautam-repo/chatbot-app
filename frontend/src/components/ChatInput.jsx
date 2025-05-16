import { useState, useEffect, useRef } from "react";
import { PaperAirplaneIcon, MicrophoneIcon, PaperClipIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { DocumentTextIcon, PhotoIcon } from "@heroicons/react/24/outline";

export default function ChatInput({ onSend }) {
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAttachOptions, setShowAttachOptions] = useState(false);
  const MAX_CHARS = 5000;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max file size
  const ALLOWED_IMAGE_TYPES = [
    "image/jpeg", "image/png", "image/gif"
  ];
  const ALLOWED_DOCUMENT_TYPES = [
    "application/pdf", "application/msword", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
  ];
  const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const attachMenuRef = useRef(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      console.warn("Speech Recognition is not supported by your browser. Please use Chrome.");
      return;
    }
    
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join("");
      setInput(transcript);
      setCharCount(transcript.length);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  // Close attachment options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
        setShowAttachOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleVoiceClick = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech Recognition is not supported by your browser. Please use Chrome.");
      return;
    }
    
    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setListening(!listening);
  };
  
  const handleFileClick = () => {
    setShowAttachOptions(!showAttachOptions);
  };

  const handleImageClick = () => {
    imageInputRef.current.click();
    setShowAttachOptions(false);
  };

  const handleDocumentClick = () => {
    documentInputRef.current.click();
    setShowAttachOptions(false);
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const acceptedTypes = e.target.accept.includes('image') ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
    
    // Validate files
    const invalidFiles = selectedFiles.filter(file => 
      !acceptedTypes.includes(file.type) || file.size > MAX_FILE_SIZE
    );
    
    if (invalidFiles.length > 0) {
      alert(`Some files were not added: Invalid file type or size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
    
    const validFiles = selectedFiles.filter(file => 
      acceptedTypes.includes(file.type) && file.size <= MAX_FILE_SIZE
    );
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
    
    // Reset file input
    e.target.value = null;
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <PhotoIcon className="h-5 w-5 text-blue-500" />;
    } else {
      return <DocumentTextIcon className="h-5 w-5 text-yellow-500" />;
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() && files.length === 0) {
      return;
    }
    
    const wordCount = input.trim().split(/\s+/).length;
    if (wordCount > 1000) {
      alert("Word limit exceeded! Maximum 1000 words.");
      return;
    }
    
    if (input.length > MAX_CHARS) {
      alert(`Character limit exceeded! Maximum ${MAX_CHARS} characters.`);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        if (input.trim()) {
          formData.append('message', input);
        }
        
        onSend(formData, true);
      } else {
        onSend(input);
      }
      
      setInput("");
      setCharCount(0);
      setFiles([]);
    } catch (error) {
      console.error("Error processing files:", error);
      alert("There was an error processing your files. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <form 
      onSubmit={handleSubmit}
      className="flex flex-col p-4 bg-gray-800 border-t border-gray-700"
    >
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {files.map((file, index) => (
            <div 
              key={`${file.name}-${index}`} 
              className="flex items-center bg-gray-700 rounded px-3 py-1"
            >
              {getFileIcon(file)}
              <span className="ml-1 text-sm text-gray-200 max-w-[150px] truncate">
                {file.name}
              </span>
              <button 
                type="button" 
                onClick={() => removeFile(index)}
                className="ml-2 text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-end w-full">
        <div className="flex flex-col flex-1">
          <textarea 
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setCharCount(e.target.value.length);
            }}
            placeholder="Type your message here..."
            rows={1}
            style={{ resize: "none", overflow: "hidden", minHeight: "46px" }}
            className="flex-1 bg-gray-700 text-gray-200 placeholder-gray-400 px-6 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
            onInput={(e) => {
              // Auto-resize textarea based on content
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px"; // Max height of 200px
            }}
            onKeyDown={(e) => {
              // Submit on Enter (without Shift key)
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className={`text-xs text-right mt-1 pr-2 ${charCount > MAX_CHARS * 0.8 ? (charCount > MAX_CHARS ? "text-red-500" : "text-yellow-500") : "text-gray-400"}`}>
            {charCount}/{MAX_CHARS} {charCount > MAX_CHARS * 0.8 && charCount <= MAX_CHARS && "(approaching limit)"} {charCount > MAX_CHARS && "(exceeded limit)"}
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
          multiple
          className="hidden"
        />
        
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.gif"
          multiple
          className="hidden"
        />
        
        <input
          type="file"
          ref={documentInputRef}
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt"
          multiple
          className="hidden"
        />

        {/* Attachment button and popup menu */}
        <div className="relative" ref={attachMenuRef}>
          <button 
            type="button"
            onClick={handleFileClick}
            className="ml-2 p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white self-end mb-1"
            title="Attach files"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>

          {/* Attachment options popup */}
          {showAttachOptions && (
            <div className="absolute bottom-14 right-0 bg-gray-700 rounded-md shadow-lg py-2 w-40 z-10 border border-gray-600">
              <button
                type="button"
                onClick={handleImageClick}
                className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-600 text-gray-100"
              >
                <PhotoIcon className="h-5 w-5 mr-2 text-blue-400" />
                <span>Image</span>
              </button>
              <button
                type="button"
                onClick={handleDocumentClick}
                className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-600 text-gray-100"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2 text-yellow-400" />
                <span>Document</span>
              </button>
            </div>
          )}
        </div>
        
        <button 
          type="button"
          onClick={handleVoiceClick}
          className={`ml-2 p-3 rounded-full transition-colors duration-200 ${
            listening 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-gray-700 hover:bg-gray-600"
          } text-white self-end mb-1`}
          title={listening ? "Stop recording" : "Start voice input"}
        >
          <MicrophoneIcon className="h-5 w-5" />
        </button>

        <button 
          type="submit"
          className={`ml-2 p-3 rounded-full transition-all duration-200 transform hover:scale-105 self-end mb-1 ${
            (!input.trim() && files.length === 0) || isProcessing
              ? "bg-gray-600 cursor-not-allowed" 
              : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          } text-white`}
          disabled={(!input.trim() && files.length === 0) || isProcessing}
          title="Send message"
        >
          <PaperAirplaneIcon className="h-5 w-5 transform -rotate-90" />
        </button>
      </div>
    </form>
  );
}
