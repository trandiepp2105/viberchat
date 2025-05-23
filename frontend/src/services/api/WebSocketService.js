/**
 * WebSocketService for real-time chat communication
 */
class WebSocketService {
  /**
   * Initialize the WebSocket service
   */
  constructor() {
    this.socket = null;
    this.callbacks = {
      message: [],
      typing: [],
      read: [],
      edited: [],
      deleted: [],
      pinned: [],
      unpinned: [],
      open: [],
      close: [],
    };
    this.retried = false;
  }

  /**
   * Connect to the WebSocket for a specific chat
   * @param {string} chatId - The ID of the chat to connect to
   * @returns {Promise<WebSocketService>} - A promise that resolves to this WebSocketService instance
   */
  connect(chatId) {
    return new Promise((resolve, reject) => {
      // Close any existing connection
      if (this.socket) {
        console.log(
          "Closing existing WebSocket connection before creating a new one"
        );
        this.disconnect();
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        reject(new Error("No authentication token found"));
        return;
      }

      // Use the current host with proxy path for WebSockets
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname;
      const port = window.location.port; // Fix URL formatting - Add trailing slash if missing
      let chatPath = chatId;
      if (!chatPath.endsWith("/")) {
        chatPath = `${chatPath}/`;
      }      // Important: You need to support both direct connection to Django Channels (8001)
      // and connection via React Dev Server proxy (3000)
      const wsUrl = `${wsProtocol}//${host}:${port}/ws/chat/${chatPath}?token=${token}`;

      console.log("===== DEBUG: Connecting to WebSocket =====");
      console.log("WebSocket URL:", wsUrl);

      try {
        this.socket = new WebSocket(wsUrl);

        // Set a connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
            console.error(
              "===== DEBUG: ERROR - WebSocket connection timeout ====="
            );
            console.error(
              "Connection is still in state:",
              this.getReadyStateAsString(this.socket.readyState)
            );

            // Try alternate approach before giving up - direct connection to Daphne server
            if (port === "3000" && !this.retried) {
              console.log(
                "Trying direct connection to WebSocket server at port 8001..."
              );
              this.retried = true;
              this.disconnect();

              // Try direct connection to the Daphne server
              const directWsUrl = `${wsProtocol}//localhost:8001/ws/chat/${chatPath}?token=${token}`;
              console.log("Attempting direct connection to:", directWsUrl);

              this.socket = new WebSocket(directWsUrl);
              this._setupEventHandlers(this.socket, resolve, reject);
              return;
            }

            reject(new Error("WebSocket connection timeout"));
            this.disconnect();
          }
        }, 10000); // 10 second timeout

        this._setupEventHandlers(
          this.socket,
          resolve,
          reject,
          connectionTimeout
        );
      } catch (error) {
        console.error("Error creating WebSocket:", error);
        reject(error);
      }
    });
  }

  /**
   * Helper method to set up event handlers for WebSocket
   */
  _setupEventHandlers(socket, resolve, reject, timeout = null) {
    socket.onopen = (event) => {
      console.log(
        "===== DEBUG: Bước 5 - WebSocket connected successfully ====="
      );
      console.log(
        "WebSocket readyState:",
        this.getReadyStateAsString(socket.readyState)
      );
      if (timeout) clearTimeout(timeout);
      this._executeCallbacks("open", event);
      this.retried = false;
      resolve(this);
    };

    socket.onclose = (event) => {
      console.log(
        "WebSocket disconnected with code:",
        event.code,
        event.reason
      );
      if (timeout) clearTimeout(timeout);
      this._executeCallbacks("close", event);
      // Only reject if connection was never established and we're still expecting a connection
      if (socket.readyState !== WebSocket.OPEN && !this.retried) {
        reject(new Error(`WebSocket connection closed: ${event.code}`));
      }
    };

    socket.onerror = (error) => {
      console.error("===== DEBUG: ERROR - WebSocket error =====", error);
      if (timeout) clearTimeout(timeout);
      // Don't reject here since onclose will also fire
    };

    socket.onmessage = (event) => {
      try {
        console.log(
          "===== DEBUG: Bước 9 - WebSocket Client nhận tin nhắn ====="
        );
        console.log("Raw WebSocket message:", event.data);

        const data = JSON.parse(event.data);
        console.log("Parsed message data:", data);

        // Make sure we're handling the type correctly
        let type = data.type || "message";

        // Transform backend message format if needed
        if (type === "chat_message") {
          console.log("Chuyển đổi loại tin nhắn từ chat_message sang message");
          type = "message";
        } else if (type === "typing_indicator") {
          console.log(
            "Chuyển đổi loại tin nhắn từ typing_indicator sang typing"
          );
          type = "typing";
        } else if (type === "read_receipt") {
          console.log("Chuyển đổi loại tin nhắn từ read_receipt sang read");
          type = "read";
        } else if (type === "edited_message") {
          console.log("Chuyển đổi loại tin nhắn từ edited_message sang edited");
          type = "edited";
        } else if (type === "deleted_message") {
          console.log(
            "Chuyển đổi loại tin nhắn từ deleted_message sang deleted"
          );
          type = "deleted";
        } else if (type === "pinned_message" || type === "pinned") {
          console.log("Chuyển đổi loại tin nhắn từ pinned_message sang pinned");
          type = "pinned";
        } else if (type === "unpinned_message" || type === "unpinned") {
          console.log(
            "Chuyển đổi loại tin nhắn từ unpinned_message sang unpinned"
          );
          type = "unpinned";
        }

        console.log(`Loại tin nhắn cuối cùng: ${type}`);

        // Debug available callbacks
        console.log("Các callback đã đăng ký:", Object.keys(this.callbacks));
        console.log(
          `Số lượng callback cho loại ${type}:`,
          this.callbacks[type]?.length || 0
        );

        this._executeCallbacks(type, data);
      } catch (error) {
        console.error(
          "===== DEBUG: ERROR - Lỗi khi xử lý tin nhắn WebSocket ====="
        );
        console.error("Error parsing WebSocket message:", error);
        console.error("Raw data:", event.data);
      }
    };
  }

  /**
   * Get a readable string for WebSocket readyState
   */
  getReadyStateAsString(readyState) {
    switch (readyState) {
      case WebSocket.CONNECTING:
        return "CONNECTING (0)";
      case WebSocket.OPEN:
        return "OPEN (1)";
      case WebSocket.CLOSING:
        return "CLOSING (2)";
      case WebSocket.CLOSED:
        return "CLOSED (3)";
      default:
        return `UNKNOWN (${readyState})`;
    }
  }

  /**
   * Disconnect the WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Add an event listener
   * @param {string} eventType - Type of event to listen for
   * @param {function} callback - Callback function to execute
   * @returns {WebSocketService} - This WebSocketService instance
   */
  on(eventType, callback) {
    if (!this.callbacks[eventType]) {
      this.callbacks[eventType] = [];
    }
    this.callbacks[eventType].push(callback);
    return this;
  }

  /**
   * Remove an event listener
   * @param {string} eventType - Type of event to remove listener from
   * @param {function} callback - Callback function to remove
   * @returns {WebSocketService} - This WebSocketService instance
   */
  off(eventType, callback) {
    if (this.callbacks[eventType]) {
      this.callbacks[eventType] = this.callbacks[eventType].filter(
        (cb) => cb !== callback
      );
    }
    return this;
  }

  /**
   * Send a message through the WebSocket
   * @param {string} text - Message text to send
   */
  sendMessage(text) {
    console.log("===== DEBUG: Bước 6 - WebSocketService.sendMessage =====");

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error(
        "===== DEBUG: ERROR - Socket không mở khi gửi tin nhắn ====="
      );
      console.error("Socket state:", this.socket?.readyState);
      throw new Error("WebSocket is not connected");
    }

    const messageData = {
      type: "message",
      text: text,
    };

    console.log("Gửi tin nhắn qua WebSocket:", messageData);

    this.socket.send(JSON.stringify(messageData));

    console.log("Tin nhắn đã được gửi qua WebSocket");
  }

  /**
   * Send typing indicator
   * @param {boolean} isTyping - Whether user is currently typing
   */
  sendTypingIndicator(isTyping) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(
      JSON.stringify({
        type: "typing",
        is_typing: isTyping,
      })
    );
  }

  /**
   * Send read receipt for messages
   * @param {Array} messageIds - IDs of messages read
   */
  sendReadReceipt(messageIds) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(
      JSON.stringify({
        type: "read",
        message_ids: messageIds,
      })
    );
  }

  /**
   * Send an edit for an existing message
   * @param {string} messageId - The ID of the message to edit
   * @param {string} newText - The new text for the message
   */
  sendEditMessage(messageId, newText) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    this.socket.send(
      JSON.stringify({
        type: "edit",
        message_id: messageId,
        text: newText,
      })
    );
  }

  /**
   * Send a delete request for a message
   * @param {string} messageId - The ID of the message to delete
   */
  sendDeleteMessage(messageId) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    this.socket.send(
      JSON.stringify({
        type: "delete",
        message_id: messageId,
      })
    );
  }

  /**
   * Send a request to pin a message
   * @param {string} messageId - The ID of the message to pin
   */
  sendPinMessage(messageId) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    this.socket.send(
      JSON.stringify({
        type: "pin",
        message_id: messageId,
      })
    );
  }

  /**
   * Send a request to unpin a message
   * @param {string} messageId - The ID of the message to unpin
   */
  sendUnpinMessage(messageId) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    this.socket.send(
      JSON.stringify({
        type: "unpin",
        message_id: messageId,
      })
    );
  }

  /**
   * Execute callbacks for a specific event type
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   * @private
   */
  _executeCallbacks(eventType, data) {
    if (!eventType) {
      console.error("No event type provided to _executeCallbacks", data);
      return;
    }

    console.log(
      `Executing ${
        this.callbacks[eventType]?.length || 0
      } callbacks for event type: ${eventType}`
    );

    if (this.callbacks[eventType]) {
      this.callbacks[eventType].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error executing callback for ${eventType}:`, error);
        }
      });
    } else {
      console.warn(`No callbacks registered for event type: ${eventType}`);
    }
  }
}

export default WebSocketService;
