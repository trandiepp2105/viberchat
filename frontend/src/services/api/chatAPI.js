import api from "./index";

// Chat API
const chatAPI = {
  /**
   * Get all conversations for the current user
   * @param {string} type - Optional: Filter by conversation type ('direct' or 'group')
   * @returns {Promise} - Promise with conversations
   */
  getChats: (type = null) => {
    let url = "/chats/conversations/";
    if (type === "direct" || type === "group") {
      url += `?type=${type}`;
    }
    return api.get(url);
  },

  /**
   * Get a specific conversation by ID
   * @param {string} chatId - ID of the conversation to get
   * @returns {Promise} - Promise with conversation details
   */
  getChat: (chatId) => api.get(`/chats/conversations/${chatId}/`),

  /**
   * Start a direct conversation with another user
   * @param {string} otherUserId - ID of the user to chat with
   * @param {string} initialMessage - First message for the conversation
   * @returns {Promise} - Promise with the created conversation
   */
  startDirectConversation: (otherUserId, initialMessage = "") => {
    const payload = {
      user_id: otherUserId, // Changed from participant_id to user_id to match backend
    };

    // Only add initial_message if it's not empty
    if (initialMessage && initialMessage.trim() !== "") {
      payload.initial_message = initialMessage;
    }
    // URL is for the general action, not specific to a user ID in the path
    return api.post("/chats/conversations/start_direct_conversation/", payload);
  },

  /**
   * Create a group conversation
   * @param {Array} participantIds - IDs of chat participants
   * @param {string} name - Group name (required for group conversations)
   * @param {string} initialMessage - First message for the conversation
   * @returns {Promise} - Promise with the created conversation
   */
  createGroupConversation: (participantIds, name, initialMessage = "") => {
    const payload = {
      participant_ids: participantIds,
      name: name,
    };

    // Only add initial_message if it's not empty
    if (initialMessage && initialMessage.trim() !== "") {
      payload.initial_message = initialMessage;
    }

    console.log("Creating group conversation with payload:", payload);

    return api.post("/chats/conversations/create_group_conversation/", payload);
  },
  /**
   * Get messages for a conversation
   * @param {string} chatId - ID of the conversation
   * @param {number} limit - Maximum number of messages to retrieve
   * @param {string} lastMessageId - ID of the last message for pagination
   * @returns {Promise} - Promise with conversation messages
   */
  getMessages: (chatId, limit = 50, lastMessageId = null) => {
    let url = `/chats/conversations/${chatId}/messages/?limit=${limit}`;
    if (lastMessageId) {
      url += `&last_message_id=${lastMessageId}`;
    }
    return api.get(url);
  },
  /**
   * Send a message in a conversation
   * @param {string} chatId - ID of the conversation
   * @param {string} text - Message text
   * @param {Array} attachments - File attachments
   * @returns {Promise} - Promise with the sent message
   */
  sendMessage: (chatId, text, attachments = []) => {
    const formData = new FormData();
    formData.append("text", text);

    if (attachments.length > 0) {
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });
    }

    return api.post(`/chats/conversations/${chatId}/send_message/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Edit a message
   * @param {string} chatId - ID of the conversation
   * @param {string} messageId - ID of the message to edit
   * @param {string} newText - New message text
   * @returns {Promise} - Promise with the edited message
   */
  editMessage: (chatId, messageId, newText) => {
    return api.post(
      `/chats/conversations/${chatId}/edit-message/${messageId}/`,
      {
        text: newText,
      }
    );
  },

  /**
   * Delete a message
   * @param {string} chatId - ID of the conversation
   * @param {string} messageId - ID of the message to delete
   * @returns {Promise} - Promise with deletion result
   */
  deleteMessage: (chatId, messageId) => {
    return api.post(
      `/chats/conversations/${chatId}/delete-message/${messageId}/`,
      {}
    );
  },

  /**
   * Mark messages as read
   * @param {string} chatId - ID of the conversation
   * @param {Array} messageIds - IDs of messages to mark as read
   * @returns {Promise} - Promise with mark as read result
   */
  markMessagesAsRead: (chatId, messageIds) =>
    api.post(`/chats/conversations/${chatId}/mark_read/`, {
      message_ids: messageIds,
    }),

  /**
   * Pin a message
   * @param {string} chatId - ID of the conversation
   * @param {string} messageId - ID of the message to pin
   * @returns {Promise} - Promise with pin result
   */
  pinMessage: (chatId, messageId) =>
    api.post(`/chats/conversations/${chatId}/pin_message/`, {
      message_id: messageId,
    }),

  /**
   * Unpin a message
   * @param {string} chatId - ID of the conversation
   * @param {string} messageId - ID of the message to unpin
   * @returns {Promise} - Promise with unpin result
   */ unpinMessage: (chatId, messageId) =>
    api.post(`/chats/conversations/${chatId}/unpin_message/`, {
      message_id: messageId,
    }),

  /**
   * Get pinned messages for a conversation
   * @param {string} chatId - ID of the conversation
   * @param {number} limit - Maximum number of pinned messages to retrieve
   * @returns {Promise} - Promise with pinned messages
   */
  getPinnedMessages: (chatId, limit = 10) =>
    api.get(`/chats/conversations/${chatId}/pinned_messages/?limit=${limit}`),
};

export default chatAPI;
