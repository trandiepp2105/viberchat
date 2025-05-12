import api from "./index";

// User API
const userAPI = {
  /**
   * Get the current user's profile
   * @returns {Promise} - Promise with user profile data
   */
  getProfile: () => api.get("/users/me/"),

  /**
   * Update user profile
   * @param {Object} userData - User profile data to update
   * @returns {Promise} - Promise with updated user data
   */
  updateProfile: (userData) => api.put("/users/update_profile/", userData),

  /**
   * Change user password
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} - Promise with password change result
   */
  changePassword: (oldPassword, newPassword) =>
    api.post("/users/change_password/", {
      old_password: oldPassword,
      new_password: newPassword,
      new_password2: newPassword,
    }),

  /**
   * Get user contacts
   * @returns {Promise} - Promise with contacts list
   */
  getContacts: () => api.get("/users/contacts/"),

  /**
   * Add a user to contacts
   * @param {string} contactId - ID of user to add as contact
   * @returns {Promise} - Promise with add contact result
   */
  addContact: (contactId) =>
    api.post("/users/contacts/", { contact: contactId }),

  /**
   * Remove a contact
   * @param {string} contactId - ID of contact to remove
   * @returns {Promise} - Promise with remove contact result
   */
  removeContact: (contactId) => api.delete(`/users/contacts/${contactId}/`),

  /**
   * Search for users
   * @param {string} query - Search query
   * @returns {Promise} - Promise with search results
   */
  searchUsers: (query) => api.get(`/users/contacts/search/?q=${query}`),

  /**
   * Request a password reset
   * @param {string} email - User's email
   * @returns {Promise} - Promise with request result
   */
  requestPasswordReset: (email) =>
    api.post("/users/password-reset/request/", { email }),
  /**
   * Verify an OTP code
   * @param {string} email - User's email
   * @param {string} otpCode - OTP code to verify
   * @param {string} otpType - Type of OTP (registration, password_reset, email_change)
   * @returns {Promise} - Promise with verification result
   */
  verifyOTP: (email, otpCode, otpType = "registration") =>
    api.post("/users/verify-otp/", {
      email,
      otp_code: otpCode,
      otp_type: otpType,
    }),

  /**
   * Resend an OTP code
   * @param {string} email - User's email
   * @param {string} otpType - Type of OTP to resend
   * @returns {Promise} - Promise with resend result
   */
  resendOTP: (email, otpType) =>
    api.post("/users/resend-otp/", {
      email,
      otp_type: otpType,
    }),

  /**
   * Complete password reset process
   * @param {string} email - User's email
   * @param {string} otpCode - OTP code
   * @param {string} newPassword - New password
   * @param {string} confirmPassword - Confirm new password
   * @returns {Promise} - Promise with reset result
   */
  completePasswordReset: (email, otpCode, newPassword, confirmPassword) =>
    api.post("/users/password-reset/complete/", {
      email,
      otp_code: otpCode,
      new_password: newPassword,
      new_password2: confirmPassword,
    }),
};

export default userAPI;
