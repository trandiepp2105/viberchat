import React, { createContext, useState, useEffect, useContext } from "react";
import { chatAPI, WebSocketService } from "../services";
import { useAuth } from "./AuthContext";

// Create the ChatContext
const ChatContext = createContext(null);

// ChatProvider component
export const ChatProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [lastMessageId, setLastMessageId] = useState(null);

  // Get all chats when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
    }
  }, [isAuthenticated]);

  // Connect to WebSocket when active chat changes
  useEffect(() => {
    if (activeChat && isAuthenticated) {
      connectWebSocket(activeChat.id);

      // Cleanup on component unmount or when active chat changes
      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    }
  }, [activeChat]);

  // Fetch all chats
  const fetchChats = async () => {
    try {
      setLoading(true);
      const { data } = await chatAPI.getChats();
      setChats(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError("Failed to load chats. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for active chat
  const fetchMessages = async (chatId, reset = false) => {
    try {
      setLoading(true);

      // Use lastMessageId for pagination, unless reset is true
      const messageIdParam = !reset && lastMessageId ? lastMessageId : null;

      const { data } = await chatAPI.getMessages(chatId, 50, messageIdParam);

      // Debug: Check what messages are being received
      console.log("Messages received:", data);

      // Update messages state based on pagination
      if (reset) {
        setMessages(data);
      } else {
        setMessages((prevMessages) => [...prevMessages, ...data]);
      }

      // Update pagination state
      setHasMoreMessages(data.length === 50);
      if (data.length > 0) {
        setLastMessageId(data[data.length - 1].message_id);
      }

      // Mark messages as read
      const unreadMessages = data
        .filter((msg) => !msg.is_read && msg.sender_id !== user.id)
        .map((msg) => msg.message_id);

      if (unreadMessages.length > 0) {
        await chatAPI.markMessagesAsRead(chatId, unreadMessages);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Create a new chat
  const createChat = async (
    participantIds,
    isGroupChat = false,
    name = "",
    initialMessage = ""
  ) => {
    try {
      setLoading(true);
      const { data } = await chatAPI.createChat(
        participantIds,
        isGroupChat,
        name,
        initialMessage
      );

      // Add new chat to state
      setChats((prevChats) => [data, ...prevChats]);

      // Set as active chat
      setActiveChat(data);

      // Reset messages and fetch for new chat
      setMessages([]);
      setLastMessageId(null);
      setHasMoreMessages(true);
      await fetchMessages(data.id, true);

      setError(null);
      return data;
    } catch (err) {
      console.error("Error creating chat:", err);
      setError("Failed to create chat. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (text, attachments = []) => {
    if (!activeChat) return;

    try {
      // Use WebSocket if available
      if (socket && socket.socket?.readyState === WebSocket.OPEN) {
        socket.sendMessage(text);
        return true;
      }

      // Fallback to REST API
      const { data } = await chatAPI.sendMessage(
        activeChat.id,
        text,
        attachments
      );

      // Add new message to state
      setMessages((prevMessages) => [data, ...prevMessages]);

      // Update chat's last message
      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat.id === activeChat.id) {
            return { ...chat, last_message: data };
          }
          return chat;
        });
      });

      return true;
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      return false;
    }
  };

  // Connect to WebSocket
  const connectWebSocket = (chatId) => {
    try {
      // Create and configure WebSocket service
      const ws = new WebSocketService();

      // Connect handlers
      ws.on("message", handleIncomingMessage)
        .on("typing", handleTypingIndicator)
        .on("read", handleReadReceipt);

      // Connect to server
      ws.connect(chatId);

      // Store ws instance
      setSocket(ws);
    } catch (err) {
      console.error("WebSocket connection error:", err);
      setError(
        "Failed to establish real-time connection. Using fallback mode."
      );
    }
  };

  // Handle incoming message from WebSocket
  const handleIncomingMessage = (data) => {
    const { message } = data;

    // Add message to state
    setMessages((prevMessages) => {
      // Check if message already exists
      const exists = prevMessages.some((msg) => msg.message_id === message.id);
      if (exists) return prevMessages;

      return [message, ...prevMessages];
    });

    // Update chat's last message
    setChats((prevChats) => {
      return prevChats.map((chat) => {
        if (chat.id === activeChat.id) {
          return { ...chat, last_message: message };
        }
        return chat;
      });
    });

    // Mark message as read if it's from someone else
    if (message.sender_id !== user.id) {
      if (socket) {
        socket.sendReadReceipt([message.id]);
      } else {
        chatAPI.markMessagesAsRead(activeChat.id, [message.id]);
      }
    }
  };

  // Handle typing indicator from WebSocket
  const handleTypingIndicator = (data) => {
    const { user_id, is_typing } = data;

    // Update typing users state
    setTypingUsers((prev) => {
      if (is_typing) {
        return { ...prev, [user_id]: Date.now() };
      } else {
        const newState = { ...prev };
        delete newState[user_id];
        return newState;
      }
    });
  };

  // Handle read receipt from WebSocket
  const handleReadReceipt = (data) => {
    const { user_id, message_ids } = data;

    // Update read status for these messages
    setMessages((prevMessages) => {
      return prevMessages.map((msg) => {
        if (message_ids.includes(msg.message_id)) {
          return { ...msg, is_read: true, read_at: new Date().toISOString() };
        }
        return msg;
      });
    });
  };

  // Send typing indicator
  const sendTypingIndicator = (isTyping) => {
    if (socket) {
      socket.sendTypingIndicator(isTyping);
    }
  };

  // Context value
  const value = {
    chats,
    activeChat,
    messages,
    loading,
    error,
    typingUsers,
    hasMoreMessages,
    setActiveChat,
    fetchChats,
    fetchMessages,
    createChat,
    sendMessage,
    sendTypingIndicator,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook to use the ChatContext
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export default ChatContext;
