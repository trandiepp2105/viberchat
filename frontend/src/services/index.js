/**
 * API Services index file
 *
 * This file exports all API services for the ViberChat application
 */

import api from "./api/index";
import authAPI from "./api/authAPI";
import userAPI from "./api/userAPI";
import chatAPI from "./api/chatAPI";
import notificationAPI from "./api/notificationAPI";
import WebSocketService from "./api/WebSocketService";

// Export all API services
export { api, authAPI, userAPI, chatAPI, notificationAPI, WebSocketService };

// Legacy export for backward compatibility
export default api;
