import axios from 'axios';

const API_URL = "http://localhost:8000";

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network error');
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('user_id', response.data.user_id);
    localStorage.setItem('username', response.data.username || credentials.username);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network error');
  }
};

export const updateUserDetails = async (userData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.put(
      `${API_URL}/user/update`,
      userData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    // If username was updated, update it in localStorage
    if (userData.username) {
      localStorage.setItem('username', userData.username);
    }
    
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network error');
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('username');
};
