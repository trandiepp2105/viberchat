import api from "./index";

// Notification API
const notificationAPI = {
  /**
   * Get all notifications for the current user
   * @returns {Promise} - Promise with notifications
   */
  getNotifications: () => api.get("/notifications/"),

  /**
   * Get only unread notifications
   * @returns {Promise} - Promise with unread notifications
   */
  getUnreadNotifications: () => api.get("/notifications/unread/"),

  /**
   * Mark a notification as read
   * @param {string} notificationId - ID of the notification
   * @returns {Promise} - Promise with mark as read result
   */
  markAsRead: (notificationId) =>
    api.post(`/notifications/${notificationId}/mark_read/`),

  /**
   * Mark all notifications as read
   * @returns {Promise} - Promise with mark all as read result
   */
  markAllAsRead: () => api.post("/notifications/mark_all_read/"),

  /**
   * Get notification settings
   * @returns {Promise} - Promise with notification settings
   */
  getSettings: () => api.get("/notifications/settings/"),

  /**
   * Update notification settings
   * @param {Object} settings - Updated notification settings
   * @returns {Promise} - Promise with updated settings
   */
  updateSettings: (settings) =>
    api.patch("/notifications/settings/1/", settings),
};

export default notificationAPI;
