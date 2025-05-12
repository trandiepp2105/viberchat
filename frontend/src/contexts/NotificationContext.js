import React, { createContext, useState, useEffect, useContext } from "react";
import { notificationAPI } from "../services";
import { useAuth } from "./AuthContext";

// Create the NotificationContext
const NotificationContext = createContext(null);

// NotificationProvider component
export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Load notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchSettings();

      // Set up polling for new notifications
      const interval = setInterval(() => {
        fetchUnreadNotifications();
      }, 30000); // Poll every 30 seconds

      return () => clearInterval(interval);
    } else {
      // Reset notifications when not authenticated
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);
  // Fetch all notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await notificationAPI.getNotifications();
      // Ensure data is an array
      const notificationsArray = Array.isArray(data) ? data : [];
      setNotifications(notificationsArray);
      // Update unread count
      setUnreadCount(notificationsArray.filter((n) => !n.is_read).length);
      setError(null);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications.");
      // Reset to empty array in case of error
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };
  // Fetch only unread notifications
  const fetchUnreadNotifications = async () => {
    try {
      const { data } = await notificationAPI.getUnreadNotifications();
      // Ensure data is an array
      const unreadArray = Array.isArray(data) ? data : [];

      // Update notifications state with new unread ones
      setNotifications((prevNotifications) => {
        // Ensure prevNotifications is an array
        const prevArray = Array.isArray(prevNotifications)
          ? prevNotifications
          : [];

        // Get IDs of existing notifications
        const existingIds = new Set(prevArray.map((n) => n.id));

        // Filter out notifications we already have
        const newNotifications = unreadArray.filter(
          (n) => !existingIds.has(n.id)
        );

        // If we have new notifications, add them to the beginning
        if (newNotifications.length > 0) {
          return [...newNotifications, ...prevArray];
        }

        return prevArray;
      });

      // Update unread count
      setUnreadCount(unreadArray.length);
    } catch (err) {
      console.error("Error fetching unread notifications:", err);
      // Don't modify the state in case of error
    }
  };

  // Fetch notification settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await notificationAPI.getSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching notification settings:", err);
      setError("Failed to load notification settings.");
    } finally {
      setLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId); // Update local state
      setNotifications((prevNotifications) => {
        // Ensure prevNotifications is an array
        const prevArray = Array.isArray(prevNotifications)
          ? prevNotifications
          : [];

        return prevArray.map((notification) => {
          if (notification.id === notificationId) {
            return { ...notification, is_read: true };
          }
          return notification;
        });
      });

      // Update unread count
      setUnreadCount((prevCount) => Math.max(0, prevCount - 1));

      return true;
    } catch (err) {
      console.error("Error marking notification as read:", err);
      return false;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead(); // Update local state
      setNotifications((prevNotifications) => {
        // Ensure prevNotifications is an array
        const prevArray = Array.isArray(prevNotifications)
          ? prevNotifications
          : [];

        return prevArray.map((notification) => {
          return { ...notification, is_read: true };
        });
      });

      // Reset unread count
      setUnreadCount(0);

      return true;
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      return false;
    }
  };

  // Update notification settings
  const updateSettings = async (newSettings) => {
    try {
      setLoading(true);
      const { data } = await notificationAPI.updateSettings(newSettings);
      setSettings(data);
      setError(null);
      return true;
    } catch (err) {
      console.error("Error updating notification settings:", err);
      setError("Failed to update notification settings.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    notifications,
    unreadCount,
    settings,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    updateSettings,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the NotificationContext
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export default NotificationContext;
