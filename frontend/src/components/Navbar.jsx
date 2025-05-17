import { useState, useRef, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { 
  UserCircleIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  BellIcon
} from "@heroicons/react/24/outline";

export default function Navbar() {
  const [openDropdown, setOpenDropdown] = useState(false);
  const { logout, user: auth0User } = useAuth0();
  const { user: appUser } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  
  // Combine auth sources - prefer Auth0 user info but fall back to our app auth if needed
  const user = auth0User || appUser;
  
  // Check for username in localStorage if not available in user object
  const username = user?.name || user?.username || localStorage.getItem('username') || "User";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setOpenDropdown(!openDropdown);
  };
  const { logout: customLogout } = useAuth();
  
  const handleLogout = () => {
    // First perform our custom logout
    customLogout();
    
    // Then perform Auth0 logout
    logout({
      returnTo: window.location.origin + '/login',
    });
    
    // Navigate to login page
    navigate("/login");
  };

  return (
    <nav className="flex items-center justify-between p-4 h-16 px-6 border-b border-gray-700/50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold">N</span>
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Dashboard
        </h2>
      </div>

      {/* Right Side Items */}
      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors duration-200">
          <BellIcon className="h-6 w-6" />
        </button>
        
        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleProfileClick}
            className="flex items-center gap-2 hover:bg-gray-700/50 p-2 rounded-lg transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full ring-2 ring-blue-500/50 shadow-md" 
                />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-gray-300" />
              )}              <span className="text-gray-200 font-medium hidden md:block">
                {username}
              </span>
            </div>
          </button>

          {/* Dropdown with animation */}
          {openDropdown && (
            <div className="absolute right-0 mt-2 w-60 bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl py-2 z-20 border border-gray-700/50 animate-fadeIn transform transition-all duration-200">
              <div className="px-4 py-3 border-b border-gray-700/50">
                <p className="text-sm text-gray-400">Signed in as</p>
                <p className="text-white font-medium truncate">{user?.email || username}</p>
              </div>              <button
                onClick={() => navigate('/settings')}
                className="flex items-center w-full px-4 py-3 text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
              >
                <Cog6ToothIcon className="h-5 w-5 mr-3" />
                Settings
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-gray-700/50 transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}