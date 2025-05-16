import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, logout as logoutService } from '../services/authService';
import { Auth0Provider } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

const domain = "dev-xla87qamqb7mdcn1.us.auth0.com";
const clientId = "7bnm875G9ECY5JuiSDPbCAusUqfIc3sp";

// Create the auth context
export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || "/chat");
  };
  // Check if user is authenticated on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('user_id');
        const username = localStorage.getItem('username');
        
        if (token && userId) {
          setUser({ 
            id: userId,
            username: username
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  // Login function
  const login = async (credentials) => {
    try {
      const data = await loginUser(credentials);
      // Store username along with user ID
      setUser({ 
        id: data.user_id,
        username: credentials.username 
      });
      // Also store username in localStorage for persistence
      localStorage.setItem('username', credentials.username);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      throw error;
    }
  };  // Logout function
  const logout = () => {
    logoutService();
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear all local storage items related to user
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    
    // Also clear any Auth0 session if needed
    if (window.location.hostname === 'localhost') {
      // For local development, just reload the page to help clear auth state
      window.location.href = '/login';
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
      onRedirectCallback={onRedirectCallback}
    >
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </Auth0Provider>
  );
}
