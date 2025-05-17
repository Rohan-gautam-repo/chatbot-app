import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { updateUserDetails } from '../services/authService';
import { 
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon
} from "@heroicons/react/24/outline";

const Settings = () => {  
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    current_password: '',
    password: '',
    confirm_password: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  
  // Update form when user data is available
  useEffect(() => {
    if (user?.username) {
      setForm(prev => ({
        ...prev,
        username: user.username
      }));
    } else {
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
        setForm(prev => ({
          ...prev,
          username: storedUsername
        }));
      }
    }
  }, [user]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const validateForm = () => {
    setError('');

    if (!form.current_password) {
      setError('Current password is required');
      return false;
    }

    if (form.password || form.confirm_password) {
      if (form.password !== form.confirm_password) {
        setError('New passwords do not match');
        return false;
      }

      if (form.password.length < 8 || form.password.length > 10) {
        setError('Password must be between 8 and 10 characters');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');
      
      // Prepare update data
      const updateData = {
        username: form.username,
        current_password: form.current_password
      };
      
      // Only include new password if provided
      if (form.password) {
        updateData.password = form.password;
      }
      
      // Call API to update user details
      await updateUserDetails(updateData);
        // Update local storage and context with new username if changed
      if (form.username !== user?.username) {
        localStorage.setItem('username', form.username);
        updateUser({ username: form.username });
      }
      
      // Show success message
      setSuccess('Your details have been updated successfully');
      
      // Clear password fields
      setForm({
        ...form,
        current_password: '',
        password: '',
        confirm_password: ''
      });
      
    } catch (err) {
      setError(err.detail || 'Failed to update your details');
    } finally {
      setLoading(false);
    }
  };  const handleBackToHome = () => {
    navigate('/chat');
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const focusUsernameInput = () => {
    setIsEditingUsername(true);
    setTimeout(() => {
      const input = document.getElementById('username');
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-md">
        <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBackToHome}
              className="p-2 text-gray-400 hover:text-white rounded-full transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-white">Settings</h1>
          </div>          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-gray-200 hover:text-white transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <h2 className="text-2xl font-bold text-white mb-6">User Settings</h2>
            
            {success && (
              <div className="p-3 mb-6 text-green-400 bg-green-900 bg-opacity-50 rounded-lg">
                {success}
              </div>
            )}
            
            {error && (
              <div className="p-3 mb-6 text-red-400 bg-red-900 bg-opacity-50 rounded-lg">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={form.username}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg ${isEditingUsername ? 'focus:ring-2 focus:ring-blue-500 border-blue-500' : ''} focus:outline-none focus:border-transparent text-white placeholder-gray-400`}
                    placeholder="Username"
                    readOnly={!isEditingUsername}
                    onClick={() => !isEditingUsername && setIsEditingUsername(true)}
                  />                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditingUsername) {
                        focusUsernameInput();
                      } else {
                        setIsEditingUsername(false);
                      }
                    }}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isEditingUsername ? 'text-blue-400 hover:text-blue-300' : 'text-gray-400 hover:text-gray-300'} transition-colors duration-200`}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                </div>
                {isEditingUsername && (
                  <p className="mt-1 text-sm text-blue-400">Click the pencil icon when finished editing</p>
                )}
              </div>

              {/* Current Password */}              <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="current_password"
                    name="current_password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={form.current_password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showCurrentPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-400">Required to verify your identity</p>
              </div>

              {/* New Password */}              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showNewPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    maxLength={10}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Enter new password (8-10 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-400">Leave blank if you don't want to change your password</p>
              </div>

              {/* Confirm New Password */}              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirm_password}
                    onChange={handleChange}
                    maxLength={10}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 shadow-lg transition-all duration-200"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
