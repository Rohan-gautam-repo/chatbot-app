import axios from "axios";

const API_BASE_URL = "http://localhost:8000"; // or your deployed backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add user_id to request params for better filtering
api.interceptors.request.use(
  (config) => {
    const userId = localStorage.getItem('user_id');
    
    // For GET requests, add user_id as a query parameter
    if (config.method === 'get' && userId) {
      config.params = {
        ...config.params,
        user_id: userId
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
