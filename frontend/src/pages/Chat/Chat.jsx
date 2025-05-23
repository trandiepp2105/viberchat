import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import "./Chat.scss";
// New Messenger Layout Components
import ConversationListColumn from "../../components/MessengerLayout/ConversationListColumn";
import MessageColumn from "../../components/MessengerLayout/MessageColumn";
import ContextualInfoColumn from "../../components/MessengerLayout/ContextualInfoColumn";
import "../../components/MessengerLayout/MessengerLayout.scss"; // Styles for the new layout

import { chatAPI, userAPI, WebSocketService } from "../../services";

const Chat = () => {
  const { chatId } = useParams();
  const [selectedChatId, setSelectedChatId] = useState(chatId || null);
  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [webSocket, setWebSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // States for managing visibility of columns
  const [showContextualInfo, setShowContextualInfo] = useState(true); // Default to true for desktop
  const [showConversationList, setShowConversationList] = useState(
    window.innerWidth > 768
  ); // Show by default on tablets and larger

  const handlersRef = useRef({});

  // Refresh chats list (used after sending messages to update the UI)
  const refreshChatsList = useCallback(async () => {
    try {
      const chatsResponse = await chatAPI.getChats();
      setChats(Array.isArray(chatsResponse.data) ? chatsResponse.data : []);
    } catch (err) {
      console.error("Error refreshing chats:", err);
    }
  }, []);

  // Fetch pinned messages for the current conversation
  const fetchPinnedMessages = useCallback(async () => {
    if (!selectedChatId) return;

    try {
      const response = await chatAPI.getPinnedMessages(selectedChatId);
      setPinnedMessages(response.data || []);
    } catch (err) {
      console.error("Error fetching pinned messages:", err);
    }
  }, [selectedChatId]);

  // Handle new messages from WebSocket
  const handleNewMessage = useCallback(
    (data) => {
      let messageObj = null;

      if (data && data.message) {
        messageObj = data.message;
      } else if (data && data.id) {
        messageObj = data;
      } else if (data && data.sender_id && data.text) {
        messageObj = {
          id: data.id || data.message_id || new Date().getTime().toString(),
          sender_id: data.sender_id,
          text: data.text,
          timestamp: data.timestamp || new Date().toISOString(),
        };
      }

      if (messageObj) {
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

        const formattedMessage = {
          id: messageObj.id || messageObj.message_id,
          sender_id: messageObj.sender_id,
          text: messageObj.text,
          timestamp: messageObj.timestamp,
          isCurrentUser: userId ? messageObj.sender_id === userId : false,
        };

        setMessages((prevMessages) => {
          const isDuplicate = prevMessages.some(
            (msg) =>
              msg.id === formattedMessage.id ||
              (msg.text === formattedMessage.text &&
                msg.sender_id === formattedMessage.sender_id &&
                Math.abs(
                  new Date(msg.timestamp) - new Date(formattedMessage.timestamp)
                ) < 2000)
          );

          if (isDuplicate) {
            return prevMessages;
          }

          return [...prevMessages, formattedMessage];
        });

        refreshChatsList();
      }
    },
    [refreshChatsList]
  );

  // Handle typing indicator
  const handleTypingIndicator = useCallback((data) => {
    setOtherUserTyping(data.is_typing);
  }, []);

  // Handle read receipt
  const handleReadReceipt = useCallback((data) => {
    console.log("Messages marked as read:", data);
  }, []);

  // Handle message edit notification
  const handleMessageEdited = useCallback((data) => {
    if (!data.message_id || !data.text) return;

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

    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        (msg.id || msg.message_id) === data.message_id
          ? { ...msg, is_deleted: true }
          : msg
      )
    );
  }, []);

  // Handle message pin notification
  const handleMessagePinned = useCallback(
    (data) => {
      if (!data.message_id) return;

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          (msg.id || msg.message_id) === data.message_id
            ? {
                ...msg,
                is_pinned: true,
                pinned_at: data.pinned_at || new Date().toISOString(),
                pinned_by: data.user_id,
              }
            : msg
        )
      );

      fetchPinnedMessages();
    },
    [fetchPinnedMessages]
  );

  // Handle message unpin notification
  const handleMessageUnpinned = useCallback(
    (data) => {
      if (!data.message_id) return;

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          (msg.id || msg.message_id) === data.message_id
            ? { ...msg, is_pinned: false }
            : msg
        )
      );

      fetchPinnedMessages();
    },
    [fetchPinnedMessages]
  );

  useEffect(() => {
    handlersRef.current = {
      handleNewMessage,
      handleTypingIndicator,
      handleReadReceipt,
      handleMessageEdited,
      handleMessageDeleted,
      handleMessagePinned,
      handleMessageUnpinned,
    };
  }, [
    handleNewMessage,
    handleTypingIndicator,
    handleReadReceipt,
    handleMessageEdited,
    handleMessageDeleted,
    handleMessagePinned,
    handleMessageUnpinned,
  ]);
  // State to track which type of conversations to display (direct or group)
  const [conversationType, setConversationType] = useState("direct");

  // Function to handle switching between direct messages and group chats
  const handleSwitchConversationType = useCallback((type) => {
    setConversationType(type);
  }, []);

  useEffect(() => {
    const fetchChatsAndContacts = async () => {
      try {
        setLoading(true);
        // Get conversations filtered by type (direct or group)
        const chatsResponse = await chatAPI.getChats(conversationType);
        setChats(Array.isArray(chatsResponse.data) ? chatsResponse.data : []);

        const contactsResponse = await userAPI.getContacts();
        setContacts(
          Array.isArray(contactsResponse.data) ? contactsResponse.data : []
        );

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(`Failed to load ${conversationType} chats and contacts`);
        setLoading(false);
      }
    };

    fetchChatsAndContacts();
  }, []);

  useEffect(() => {
    if (!selectedChatId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await chatAPI.getMessages(selectedChatId);
        setMessages(response.data);

        fetchPinnedMessages();

        setLoading(false);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load messages");
        setLoading(false);
      }
    };

    fetchMessages();

    const ws = new WebSocketService();

    ws.on("message", (data) => {
      handlersRef.current.handleNewMessage(data);
    })
      .on("typing", (data) => {
        handlersRef.current.handleTypingIndicator(data);
      })
      .on("read", (data) => {
        handlersRef.current.handleReadReceipt(data);
      })
      .on("edited", (data) => {
        handlersRef.current.handleMessageEdited(data);
      })
      .on("deleted", (data) => {
        handlersRef.current.handleMessageDeleted(data);
      })
      .on("pinned", (data) => {
        handlersRef.current.handleMessagePinned(data);
      })
      .on("unpinned", (data) => {
        handlersRef.current.handleMessageUnpinned(data);
      });

    ws.connect(selectedChatId)
      .then((connectedWs) => {
        setWebSocket(connectedWs);
      })
      .catch((error) => {
        setError(
          "Failed to establish real-time connection. Please refresh the page."
        );
      });

    return () => {
      if (ws) {
        ws.disconnect();
      }
    };
  }, [selectedChatId, fetchPinnedMessages]);

  const handleInputChange = useCallback(
    (text) => {
      if (!webSocket) return;

      if (text && !isTyping) {
        setIsTyping(true);
        webSocket.sendTypingIndicator(true);
      } else if (!text && isTyping) {
        setIsTyping(false);
        webSocket.sendTypingIndicator(false);
      }
    },
    [webSocket, isTyping]
  );

  const handleSendMessage = useCallback(
    async (text) => {
      if (!selectedChatId || !text.trim()) return;

      try {
        const response = await chatAPI.sendMessage(selectedChatId, text);

        const newMessage = {
          id: response.data.message_id,
          sender_id: response.data.sender_id,
          text: response.data.text,
          timestamp: response.data.message_timestamp,
          isCurrentUser: true,
        };

        setMessages((prevMessages) => {
          const exists = prevMessages.some((m) => m.id === newMessage.id);
          if (exists) {
            return prevMessages;
          }
          return [...prevMessages, newMessage];
        });

        await refreshChatsList();

        if (webSocket) {
          if (
            !webSocket.socket ||
            webSocket.socket.readyState !== WebSocket.OPEN
          ) {
            try {
              if (
                !webSocket.socket ||
                webSocket.socket.readyState === WebSocket.CLOSED
              ) {
                await webSocket.connect(selectedChatId);
              }

              setTimeout(() => {
                if (webSocket.socket?.readyState === WebSocket.OPEN) {
                  try {
                    webSocket.sendMessage(text);
                  } catch (wsError) {
                    console.error(wsError);
                  }
                }
              }, 1000);
            } catch (connError) {
              console.error(connError);
            }
          } else if (webSocket.socket.readyState === WebSocket.OPEN) {
            try {
              webSocket.sendMessage(text);
            } catch (wsError) {
              console.error(wsError);
            }
          }
        }
      } catch (err) {
        setError("Failed to send message");
      }
    },
    [selectedChatId, webSocket, refreshChatsList]
  );

  const handleEditMessage = useCallback(
    async (messageId, newText) => {
      if (!selectedChatId || !messageId || !newText.trim()) return;

      try {
        await chatAPI.editMessage(selectedChatId, messageId, newText);

        if (webSocket && webSocket.socket?.readyState === 1) {
          webSocket.sendEditMessage(messageId, newText);
        }

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            (msg.id || msg.message_id) === messageId
              ? { ...msg, text: newText, is_edited: true }
              : msg
          )
        );
      } catch (err) {
        setError("Failed to edit message");
      }
    },
    [selectedChatId, webSocket]
  );

  const handleDeleteMessage = useCallback(
    async (messageId) => {
      if (!selectedChatId || !messageId) return;

      try {
        await chatAPI.deleteMessage(selectedChatId, messageId);

        if (webSocket && webSocket.socket?.readyState === 1) {
          webSocket.sendDeleteMessage(messageId);
        }

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            (msg.id || msg.message_id) === messageId
              ? { ...msg, is_deleted: true }
              : msg
          )
        );
      } catch (err) {
        setError("Failed to delete message");
      }
    },
    [selectedChatId, webSocket]
  );

  const handlePinMessage = useCallback(
    async (messageId) => {
      if (!selectedChatId || !messageId) return;

      try {
        await chatAPI.pinMessage(selectedChatId, messageId);

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            (msg.id || msg.message_id) === messageId
              ? {
                  ...msg,
                  is_pinned: true,
                  pinned_at: new Date().toISOString(),
                }
              : msg
          )
        );

        fetchPinnedMessages();
      } catch (err) {
        setError("Failed to pin message");
      }
    },
    [selectedChatId, fetchPinnedMessages]
  );

  const handleUnpinMessage = useCallback(
    async (messageId) => {
      if (!selectedChatId || !messageId) return;

      try {
        await chatAPI.unpinMessage(selectedChatId, messageId);

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            (msg.id || msg.message_id) === messageId
              ? {
                  ...msg,
                  is_pinned: false,
                  pinned_at: null,
                  pinned_by: null,
                }
              : msg
          )
        );

        fetchPinnedMessages();
      } catch (err) {
        setError("Failed to unpin message");
      }
    },
    [selectedChatId, fetchPinnedMessages]
  );

  const handleSelectChat = useCallback((chatId) => {
    setSelectedChatId(chatId);
    // On mobile, hide the conversation list after selecting a chat
    if (window.innerWidth <= 768) {
      setShowConversationList(false);
    }
  }, []);

  const handleStartDirectConversation = useCallback(
    async (participantId, initialMessage = "") => {
      try {
        setLoading(true);
        const response = await chatAPI.startDirectConversation(
          participantId,
          initialMessage
        );

        const newConversation = response.data;
        setChats((prevChats) => [newConversation, ...prevChats]);

        setSelectedChatId(newConversation.id);
        setLoading(false);
        return newConversation;
      } catch (err) {
        setError("Failed to start conversation");
        setLoading(false);
        throw err;
      }
    },
    []
  );

  const handleCreateGroupConversation = useCallback(
    async (participantIds, name, initialMessage = "") => {
      try {
        setLoading(true);
        const response = await chatAPI.createGroupConversation(
          participantIds,
          name,
          initialMessage
        );

        const newGroupConversation = response.data;
        setChats((prevChats) => [newGroupConversation, ...prevChats]);

        setSelectedChatId(newGroupConversation.id);
        setLoading(false);
        return newGroupConversation;
      } catch (err) {
        setError("Failed to create group conversation");
        setLoading(false);
        throw err;
      }
    },
    []
  );

  const handleCreateChat = useCallback(
    async (participantIds, isGroupChat, name, initialMessage) => {
      try {
        setLoading(true);
        if (isGroupChat) {
          return await handleCreateGroupConversation(
            participantIds,
            name,
            initialMessage
          );
        } else {
          return await handleStartDirectConversation(
            participantIds[0],
            initialMessage
          );
        }
      } catch (err) {
        setError("Failed to create chat");
        setLoading(false);
        throw err;
      }
    },
    [handleStartDirectConversation, handleCreateGroupConversation]
  );

  // Toggle visibility of contextual info column
  const toggleContextualInfo = useCallback(() => {
    setShowContextualInfo((prev) => !prev);
  }, []);

  // Toggle visibility of conversation list column (for mobile)
  const toggleConversationList = useCallback(() => {
    setShowConversationList((prev) => !prev);
  }, []);

  // Effect to handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setShowConversationList(true);
      } else {
        setShowConversationList(false);
      }

      if (window.innerWidth > 992) {
        setShowContextualInfo(true);
      } else {
        setShowContextualInfo(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const selectedChat = selectedChatId
    ? chats.find((chat) => chat.id === selectedChatId)
    : null;
  return (
    <div className="messenger-layout-container chat-page">
      {/* Conversation List Column - Add visible class for mobile */}
      <ConversationListColumn
        chats={chats}
        contacts={contacts}
        onSelectChat={handleSelectChat}
        selectedChatId={selectedChatId}
        onCreateChat={handleCreateChat}
        className={showConversationList ? "visible" : ""}
      />
      {/* Message Column with buttons to toggle other columns */}
      <MessageColumn
        selectedChat={selectedChat}
        messages={messages}
        pinnedMessages={pinnedMessages}
        onSendMessage={handleSendMessage}
        onInputChange={handleInputChange}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        onPinMessage={handlePinMessage}
        onUnpinMessage={handleUnpinMessage}
        isTyping={isTyping}
        otherUserTyping={otherUserTyping}
        loading={loading}
        error={error}
        onToggleContextualInfo={toggleContextualInfo}
        onToggleConversationList={toggleConversationList}
      />
      {/* Contextual Info Column - Only render when visible */}
      {showContextualInfo && selectedChat && (
        <ContextualInfoColumn
          selectedChat={selectedChat}
          pinnedMessages={pinnedMessages}
          onClose={toggleContextualInfo}
          className="visible"
        />
      )}

      {/* Mobile overlay for when sidebars are active */}
      {(showConversationList || showContextualInfo) &&
        window.innerWidth <= 768 && (
          <div
            className="mobile-overlay"
            onClick={() => {
              setShowConversationList(false);
              setShowContextualInfo(false);
            }}
          />
        )}
    </div>
  );
};

export default Chat;
