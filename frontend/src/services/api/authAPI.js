import api from "./index";

// Auth API
const authAPI = {
  /**
   * Login a user with username and password
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise} - Promise with login response
   */
  login: (username, password) => api.post("/token/", { username, password }),

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} - Promise with registration response
   */
  register: (userData) => api.post("/users/register/", userData),

  /**
   * Refresh the access token using a refresh token
   * @param {string} refreshToken - The refresh token
   * @returns {Promise} - Promise with the new access token
   */
  refreshToken: (refreshToken) =>
    api.post("/token/refresh/", { refresh: refreshToken }),

  /**
   * Verify if a token is valid
   * @param {string} token - The token to verify
   * @returns {Promise} - Promise with verification status
   */
  verifyToken: (token) => api.post("/token/verify/", { token }),
};

export default authAPI;
