import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthProvider";

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
    
    // Debug log - this can help identify if the component is rendering correctly
    console.log("Dashboard rendering. Auth status:", { isAuthenticated, isLoading });
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state or nothing while checking auth
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          <div className="space-y-3">
            <div className="h-4 w-28 bg-gray-700 rounded"></div>
            <div className="h-3 w-36 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
  
    <div className="flex h-screen overflow-hidden bg-gray-900">
      
      {/* Sidebar - with subtle glass effect */}
      <div className="bg-gray-800/80 backdrop-blur-sm border-r border-gray-700/50 shadow-lg z-10">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Navbar with elevation */}
        <div className="bg-gray-800/90 backdrop-blur-sm shadow-md z-10">
          <Navbar />
        </div>
        
        {/* Chat Window */}
        <div className="flex-1 overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950">
          <div className="h-full">
            <ChatWindow />
          </div>
        </div>
      </div>
    </div>
  );
}
