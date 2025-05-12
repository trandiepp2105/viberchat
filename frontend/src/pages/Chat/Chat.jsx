import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import "./Chat.scss";
import Sidebar from "../../components/Sidebar/Sidebar";
import ChatWindow from "../../components/ChatWindow/ChatWindow";
import ChatSidebar from "../../components/ChatSidebar/ChatSidebar";
import { chatAPI, userAPI, WebSocketService } from "../../services";

const Chat = () => {
  const { chatId } = useParams();
  const [selectedChatId, setSelectedChatId] = useState(chatId || null);
  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // WebSocket instance for real-time communication
  const [webSocket, setWebSocket] = useState(null);
  // Track user typing state
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // Use refs to avoid dependency cycles with event handlers
  const handlersRef = useRef({});

  // Refresh chats list (used after sending messages to update the UI)
  const refreshChatsList = useCallback(async () => {
    try {
      console.log("===== DEBUG: Refreshing chats list =====");
      const chatsResponse = await chatAPI.getChats();
      console.log("Refreshed chats data:", chatsResponse.data);
      setChats(Array.isArray(chatsResponse.data) ? chatsResponse.data : []);
    } catch (err) {
      console.error("Error refreshing chats:", err);
    }
  }, []);

  // Handle new messages from WebSocket
  const handleNewMessage = useCallback(
    (data) => {
      console.log("===== DEBUG: Bước 10 - WebSocket nhận tin nhắn mới =====");
      console.log("Raw data received:", data);

      // Extract the message object depending on the data structure
      let messageObj = null;

      if (data && data.message) {
        console.log("Tìm thấy message object trong data.message");
        messageObj = data.message;
      } else if (data && data.id) {
        console.log("Tìm thấy message object trực tiếp trong data");
        // Direct message object
        messageObj = data;
      } else if (data && data.sender_id && data.text) {
        console.log("Tạo message object từ các trường trong data");
        // Handle direct message format from backend
        messageObj = {
          id: data.id || data.message_id || new Date().getTime().toString(),
          sender_id: data.sender_id,
          text: data.text,
          timestamp: data.timestamp || new Date().toISOString(),
        };
      }

      if (messageObj) {
        console.log("===== DEBUG: Bước 11 - Xử lý và hiển thị tin nhắn =====");
        console.log("Message object:", messageObj);

        // Get the current user ID from localStorage (assuming it's stored there)
        // This is a common pattern in JWT authentication
        let userId = null;
        try {
          const userDataStr = localStorage.getItem("user_data");
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            userId = userData.id;
          }
        } catch (err) {
          console.error("Error getting user ID from localStorage:", err);
        }

        // Format the message for UI display
        const formattedMessage = {
          id: messageObj.id || messageObj.message_id,
          sender_id: messageObj.sender_id,
          text: messageObj.text,
          timestamp: messageObj.timestamp,
          // If we have the userId, check if this message is from the current user
          // If we don't have userId, assume it's not from current user (safer)
          isCurrentUser: userId ? messageObj.sender_id === userId : false,
        };

        // Add new message to the array for display
        setMessages((prevMessages) => {
          // Check for duplicates to avoid showing the same message twice
          const isDuplicate = prevMessages.some(
            (msg) =>
              msg.id === formattedMessage.id ||
              (msg.text === formattedMessage.text &&
                msg.sender_id === formattedMessage.sender_id &&
                // If timestamps are within 2 seconds, treat as duplicate
                Math.abs(
                  new Date(msg.timestamp) - new Date(formattedMessage.timestamp)
                ) < 2000)
          );

          if (isDuplicate) {
            console.log("Phát hiện tin nhắn trùng lặp, không thêm vào UI");
            return prevMessages;
          }

          console.log("Thêm tin nhắn mới vào UI");
          // Add to the end of the list (newest at bottom)
          return [...prevMessages, formattedMessage];
        });

        // Refresh the chat list to update last_message
        refreshChatsList();
      } else {
        console.error(
          "===== DEBUG: ERROR - Định dạng tin nhắn không hợp lệ ====="
        );
        console.error("Data received:", data);
      }
    },
    [refreshChatsList]
  );

  // Handle typing indicator
  const handleTypingIndicator = useCallback((data) => {
    // Update UI to show typing indicator
    setOtherUserTyping(data.is_typing);
  }, []);

  // Handle read receipt
  const handleReadReceipt = useCallback((data) => {
    // Update message read status
    console.log("Messages marked as read:", data);
  }, []);

  // Handle message edit notification
  const handleMessageEdited = useCallback((data) => {
    if (!data.message_id || !data.text) return;

    // Update the edited message in the state
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        (msg.id || msg.message_id) === data.message_id
          ? { ...msg, text: data.text, is_edited: true }
          : msg
      )
    );
  }, []);

  // Handle message delete notification
  const handleMessageDeleted = useCallback((data) => {
    if (!data.message_id) return;

    // Mark the deleted message in state
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        (msg.id || msg.message_id) === data.message_id
          ? { ...msg, is_deleted: true }
          : msg
      )
    );
  }, []);

  // Store handlers in ref to avoid dependency cycles
  useEffect(() => {
    handlersRef.current = {
      handleNewMessage,
      handleTypingIndicator,
      handleReadReceipt,
      handleMessageEdited,
      handleMessageDeleted,
    };
  }, [
    handleNewMessage,
    handleTypingIndicator,
    handleReadReceipt,
    handleMessageEdited,
    handleMessageDeleted,
  ]);

  // Fetch chats and contacts when component mounts
  useEffect(() => {
    const fetchChatsAndContacts = async () => {
      try {
        setLoading(true);
        // Fetch chats
        const chatsResponse = await chatAPI.getChats();
        console.log("===== DEBUG: Fetched chats =====", chatsResponse.data);
        setChats(Array.isArray(chatsResponse.data) ? chatsResponse.data : []);

        // Fetch contacts
        const contactsResponse = await userAPI.getContacts();
        setContacts(
          Array.isArray(contactsResponse.data) ? contactsResponse.data : []
        );

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load chats and contacts");
        setLoading(false);
      }
    };

    fetchChatsAndContacts();
  }, []);

  // Fetch messages when selected chat changes
  useEffect(() => {
    if (!selectedChatId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        console.log("Fetching messages for chat:", selectedChatId);
        const response = await chatAPI.getMessages(selectedChatId);
        console.log("Messages received from API:", response.data);
        setMessages(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load messages");
        setLoading(false);
      }
    };

    fetchMessages();

    // Setup WebSocket connection
    const ws = new WebSocketService();
    console.log(
      "===== DEBUG: Bước 3 - Setting up WebSocket for chat ID:",
      selectedChatId
    );

    // Register handlers before connecting using the ref (avoids dependency issues)
    ws.on("message", (data) => {
      console.log("WebSocket 'message' event received:", data);
      handlersRef.current.handleNewMessage(data);
    })
      .on("typing", (data) => {
        console.log("WebSocket 'typing' event received:", data);
        handlersRef.current.handleTypingIndicator(data);
      })
      .on("read", (data) => {
        console.log("WebSocket 'read' event received:", data);
        handlersRef.current.handleReadReceipt(data);
      })
      .on("edited", (data) => {
        console.log("WebSocket 'edited' event received:", data);
        handlersRef.current.handleMessageEdited(data);
      })
      .on("deleted", (data) => {
        console.log("WebSocket 'deleted' event received:", data);
        handlersRef.current.handleMessageDeleted(data);
      })
      .on("open", (event) => {
        console.log("===== DEBUG: Bước 5 - WebSocket frontend connected =====");
        console.log("WebSocket connected for chat:", selectedChatId);
      })
      .on("close", (event) => {
        console.log("WebSocket 'close' event received:", event);
        console.log(
          "WebSocket closed for chat:",
          selectedChatId,
          "Code:",
          event.code
        );
      });

    // Now connect with error handling
    ws.connect(selectedChatId)
      .then((connectedWs) => {
        console.log("WebSocket fully connected and ready to use");
        setWebSocket(connectedWs);
      })
      .catch((error) => {
        console.error(
          "===== DEBUG: ERROR - WebSocket connection failed =====",
          error
        );
        setError(
          "Failed to establish real-time connection. Please refresh the page."
        );
      });

    // Cleanup WebSocket on unmount or when chat changes
    return () => {
      console.log("Cleaning up WebSocket connection for chat:", selectedChatId);
      if (ws) {
        ws.disconnect();
      }
    };
  }, [selectedChatId]); // We're using refs for the handlers, so we don't need to add them as dependencies

  // Handle input changes to detect typing
  const handleInputChange = useCallback(
    (text) => {
      if (!webSocket) return;

      // When text is present and user wasn't typing before
      if (text && !isTyping) {
        setIsTyping(true);
        webSocket.sendTypingIndicator(true);
      }
      // When text is empty and user was typing before
      else if (!text && isTyping) {
        setIsTyping(false);
        webSocket.sendTypingIndicator(false);
      }
    },
    [webSocket, isTyping]
  );

  // Handle sending a new message
  const handleSendMessage = useCallback(
    async (text) => {
      if (!selectedChatId || !text.trim()) return;

      console.log("===== DEBUG: Bước 1 - Bắt đầu gửi tin nhắn =====");
      console.log("Text:", text);
      console.log("Chat ID:", selectedChatId);
      console.log("WebSocket status:", webSocket?.socket?.readyState);

      try {
        console.log("===== DEBUG: Bước 2 - Gửi message qua API =====");
        // Send message via API
        const response = await chatAPI.sendMessage(selectedChatId, text);
        console.log("API response:", response.data);

        // Add message to the UI immediately without waiting for WebSocket
        const newMessage = {
          id: response.data.message_id,
          sender_id: response.data.sender_id,
          text: response.data.text,
          timestamp: response.data.message_timestamp,
          isCurrentUser: true, // Assuming this is from current user
        };

        // Add to messages state to display immediately
        setMessages((prevMessages) => {
          // Check if this message is already in the list (prevent duplicates)
          const exists = prevMessages.some((m) => m.id === newMessage.id);
          if (exists) {
            console.log(
              "Message already exists in state, not adding duplicate"
            );
            return prevMessages;
          }
          console.log("Adding new message to UI immediately");
          return [...prevMessages, newMessage];
        });

        // After successful message send, refresh the chat list to update last_message
        console.log(
          "===== DEBUG: Refreshing chat list after sending message ====="
        );
        await refreshChatsList();

        // Try to also send through WebSocket if available
        if (webSocket) {
          console.log("===== DEBUG: Bước 6 - Checking WebSocket =====");

          // If socket isn't connected yet, attempt to connect it
          if (
            !webSocket.socket ||
            webSocket.socket.readyState !== WebSocket.OPEN
          ) {
            console.log(
              "WebSocket not connected, attempting to ensure connection"
            );

            try {
              // If socket doesn't exist or is closed, create a new connection
              if (
                !webSocket.socket ||
                webSocket.socket.readyState === WebSocket.CLOSED
              ) {
                console.log("Creating new WebSocket connection");
                await webSocket.connect(selectedChatId);
              }

              // Wait a moment for the connection to establish
              setTimeout(() => {
                if (webSocket.socket?.readyState === WebSocket.OPEN) {
                  console.log("WebSocket now connected, sending message");
                  try {
                    webSocket.sendMessage(text);
                  } catch (wsError) {
                    console.error(
                      "Error sending to WebSocket after reconnection:",
                      wsError
                    );
                  }
                } else {
                  console.log(
                    "WebSocket still not ready after reconnection attempt"
                  );
                }
              }, 1000);
            } catch (connError) {
              console.error("Failed to reconnect WebSocket:", connError);
            }
          }
          // If socket is already open, send the message right away
          else if (webSocket.socket.readyState === WebSocket.OPEN) {
            console.log("WebSocket đang mở, gửi tin nhắn qua WebSocket");
            try {
              webSocket.sendMessage(text);
            } catch (wsError) {
              console.error(
                "===== DEBUG: ERROR - Lỗi khi gửi qua WebSocket ====="
              );
              console.error("WebSocket send error:", wsError);
            }
          } else {
            console.log("===== DEBUG: Bước 6 - WebSocket không khả dụng =====");
            console.log(
              "WebSocket state:",
              webSocket.getReadyStateAsString(webSocket.socket?.readyState)
            );
          }
        } else {
          console.log("===== DEBUG: WebSocket object không tồn tại =====");
        }

        // Message was already added to UI from API response, regardless of WebSocket
        console.log(
          "Message added via API, no need to wait for WebSocket confirmation"
        );
      } catch (err) {
        console.error(
          "===== DEBUG: ERROR - Lỗi khi gửi tin nhắn qua API ====="
        );
        console.error("Error sending message:", err);
        console.error("Error details:", err.response?.data || err.message);
        setError("Failed to send message");
      }
    },
    [selectedChatId, webSocket, refreshChatsList]
  );

  // Handle editing a message
  const handleEditMessage = useCallback(
    async (messageId, newText) => {
      if (!selectedChatId || !messageId || !newText.trim()) return;

      try {
        // Send edit via API
        await chatAPI.editMessage(selectedChatId, messageId, newText);

        // Also send through WebSocket if available for immediate UI update
        if (webSocket && webSocket.socket?.readyState === 1) {
          webSocket.sendEditMessage(messageId, newText);
        }

        // Update message in state
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            (msg.id || msg.message_id) === messageId
              ? { ...msg, text: newText, is_edited: true }
              : msg
          )
        );
      } catch (err) {
        console.error("Error editing message:", err);
        setError("Failed to edit message");
      }
    },
    [selectedChatId, webSocket]
  );

  // Handle deleting a message
  const handleDeleteMessage = useCallback(
    async (messageId) => {
      if (!selectedChatId || !messageId) return;

      try {
        // Send delete via API
        await chatAPI.deleteMessage(selectedChatId, messageId);

        // Also send through WebSocket if available for immediate UI update
        if (webSocket && webSocket.socket?.readyState === 1) {
          webSocket.sendDeleteMessage(messageId);
        }

        // Update message in state
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            (msg.id || msg.message_id) === messageId
              ? { ...msg, is_deleted: true }
              : msg
          )
        );
      } catch (err) {
        console.error("Error deleting message:", err);
        setError("Failed to delete message");
      }
    },
    [selectedChatId, webSocket]
  );

  // Handle chat selection from sidebar
  const handleSelectChat = useCallback(async (chatId) => {
    setSelectedChatId(chatId);
  }, []);

  // Handle creating a new chat
  const handleCreateChat = useCallback(
    async (participantIds, isGroupChat, name, initialMessage) => {
      try {
        setLoading(true);
        const response = await chatAPI.createChat(
          participantIds,
          isGroupChat,
          name,
          initialMessage
        );

        // Add the new chat to the chats list
        const newChat = response.data;
        setChats((prevChats) => [newChat, ...prevChats]);

        // Select the new chat
        setSelectedChatId(newChat.id);
        setLoading(false);
      } catch (err) {
        console.error("Error creating chat:", err);
        setError("Failed to create chat");
        setLoading(false);
      }
    },
    []
  );
  // Select a formatted chat to display in the ChatWindow
  const selectedChat = selectedChatId
    ? chats.find((chat) => chat.id === selectedChatId)
    : null;
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const toggleChatSidebar = () => {
    setShowChatSidebar(!showChatSidebar);
  };

  // Toggle sidebar visibility for mobile view
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  return (
    <div className="chat-page">
      <Sidebar
        chats={chats}
        contacts={contacts}
        onSelectChat={handleSelectChat}
        selectedChatId={selectedChatId}
        onCreateChat={handleCreateChat}
        className={showSidebar ? "sidebar--active" : ""}
      />
      <ChatWindow
        selectedChat={selectedChat}
        messages={messages}
        onSendMessage={handleSendMessage}
        onInputChange={handleInputChange}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        isTyping={isTyping}
        otherUserTyping={otherUserTyping}
        loading={loading}
        error={error}
        onToggleSidebar={toggleChatSidebar}
        onToggleMainSidebar={toggleSidebar}
        showMainSidebar={showSidebar}
      />
      {selectedChat && showChatSidebar && (
        <>
          <div
            className="chat-page__overlay hide-on-desktop"
            onClick={() => setShowChatSidebar(false)}
          ></div>
          <ChatSidebar
            chat={selectedChat}
            onClose={() => setShowChatSidebar(false)}
          />
        </>
      )}
      {showSidebar && (
        <div
          className="chat-page__overlay hide-on-desktop"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default Chat;
