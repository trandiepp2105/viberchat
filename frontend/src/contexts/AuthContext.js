import React, { createContext, useState, useEffect, useContext } from "react";
import { authAPI, userAPI } from "../services";

// Create the AuthContext
const AuthContext = createContext(null);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a token
        const token = localStorage.getItem("access_token");
        if (!token) {
          setLoading(false);
          return;
        }

        // Verify token and get user profile
        await authAPI.verifyToken(token);
        const { data } = await userAPI.getProfile();
        setUser(data);
        setError(null);
      } catch (err) {
        console.error("Authentication error:", err);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setError("Session expired. Please log in again.");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);
  // Login function
  const login = async (username, password) => {
    try {
      setLoading(true);
      const { data } = await authAPI.login(username, password);

      // Save tokens
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      // Get user profile
      const userResponse = await userAPI.getProfile();
      setUser(userResponse.data);
      setError(null);

      return true;
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.detail ||
          "Login failed. Please check your credentials."
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      await authAPI.register(userData);

      // Auto login after registration
      return await login(userData.username, userData.password);
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        Object.values(err.response?.data || {})
          .map((msgs) => (Array.isArray(msgs) ? msgs.join(" ") : msgs))
          .join(" ")
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      const { data } = await userAPI.updateProfile(userData);
      setUser(data);
      setError(null);
      return true;
    } catch (err) {
      console.error("Profile update error:", err);
      setError("Failed to update profile. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (oldPassword, newPassword) => {
    try {
      setLoading(true);
      await userAPI.changePassword(oldPassword, newPassword);
      setError(null);
      return true;
    } catch (err) {
      console.error("Password change error:", err);
      setError(
        err.response?.data?.old_password?.[0] ||
          "Failed to change password. Please try again."
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
