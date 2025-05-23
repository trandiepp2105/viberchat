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
  const { id: urlChatId } = useParams();
  const [selectedChatId, setSelectedChatId] = useState(urlChatId || null);
  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [webSocket, setWebSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [activeConversationType, setActiveConversationType] =
    useState("direct");

  // States for managing visibility of columns
  const [showContextualInfo, setShowContextualInfo] = useState(true); // Default to true for desktop
  const [showConversationList, setShowConversationList] = useState(
    window.innerWidth > 768
  ); // Show by default on tablets and larger

  const handlersRef = useRef({});

  // Updates fetchData to include conversation type filtering
  const fetchChats = useCallback(async (type = "direct") => {
    setLoading(true);
    try {
      // Use the type parameter to filter conversations
      const response = await chatAPI.getChats(type);
      setChats(response.data);
      setActiveConversationType(type);
      return response.data;
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError("Failed to load conversations");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Load contacts
  const fetchContacts = useCallback(async () => {
    try {
      const response = await userAPI.getContacts();
      setContacts(response.data || []);
    } catch (err) {
      console.error("Error fetching contacts:", err);
    }
  }, []);

  // Handle selecting a chat and loading its messages
  const handleSelectChat = useCallback(async (chatId) => {
    setSelectedChatId(chatId);

    // Update URL without reloading
    window.history.pushState({}, "", `/chat/${chatId}`);

    try {
      setLoading(true);
      // Fetch chat details and messages
      const [chatDetailsResponse, messagesResponse, pinnedMessagesResponse] =
        await Promise.all([
          chatAPI.getChat(chatId),
          chatAPI.getMessages(chatId),
          chatAPI.getPinnedMessages(chatId),
        ]);

      // Update messages state
      setMessages(messagesResponse.data || []);
      setPinnedMessages(pinnedMessagesResponse.data || []);

      // Set selected chat with full details
      setSelectedChatId(chatId);
    } catch (err) {
      console.error("Error loading chat:", err);
      setError("Failed to load chat messages");
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle creating a new chat
  const handleCreateChat = async (
    participantIds,
    isGroup,
    name,
    initialMessage
  ) => {
    try {
      setLoading(true);
      let response;

      if (isGroup) {
        response = await chatAPI.createGroupConversation(
          participantIds,
          name,
          initialMessage
        );
      } else {
        response = await chatAPI.startDirectConversation(
          participantIds[0],
          initialMessage
        );
      }

      const newChatId = response.data.id;

      // Refresh the chat list and select the new chat
      await fetchChats(isGroup ? "group" : "direct");
      handleSelectChat(newChatId);

      return response.data;
    } catch (err) {
      console.error("Error creating chat:", err);
      setError("Failed to create conversation");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text) => {
    if (!selectedChatId || !text.trim()) return;

    try {
      const response = await chatAPI.sendMessage(selectedChatId, text);

      // Update messages list with the new message
      const newMessage = response.data;
      setMessages((prev) => [
        {
          id: newMessage.message_id,
          conversation_id: selectedChatId,
          sender_id: newMessage.sender_id,
          text: newMessage.text,
          timestamp: newMessage.message_timestamp,
          is_read: false,
          read_at: null,
          is_edited: false,
          edited_at: null,
          is_deleted: false,
          deleted_at: null,
          is_pinned: false,
          is_self: true, // This will be true since the current user sent the message
        },
        ...prev,
      ]);

      // Also update the selected chat in the list to show the latest message
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === selectedChatId
            ? {
                ...chat,
                last_message: {
                  text: text,
                  timestamp: new Date().toISOString(),
                  sender_id: newMessage.sender_id,
                },
              }
            : chat
        )
      );
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    }
  };

  // Handle typing indicators
  const handleTypingStart = () => {
    setIsTyping(true);
    if (webSocket && selectedChatId) {
      webSocket.send(
        JSON.stringify({
          type: "typing_indicator",
          conversation_id: selectedChatId,
          is_typing: true,
        })
      );
    }
  };

  const handleTypingEnd = () => {
    setIsTyping(false);
    if (webSocket && selectedChatId) {
      webSocket.send(
        JSON.stringify({
          type: "typing_indicator",
          conversation_id: selectedChatId,
          is_typing: false,
        })
      );
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const initWebSocket = async () => {
      try {
        const ws = new WebSocketService();
        await ws.connect();

        // Set up message handler
        ws.onMessage((event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "chat_message" && data.conversation_id) {
              // If this is for the currently selected chat, add it to messages
              if (data.conversation_id === selectedChatId) {
                setMessages((prev) => [
                  {
                    id: data.message_id,
                    conversation_id: data.conversation_id,
                    sender_id: data.sender_id,
                    text: data.text,
                    timestamp: data.timestamp,
                    is_read: false,
                    is_self: false,
                    // Add other required fields...
                  },
                  ...prev,
                ]);
              }

              // Update the conversations list to show latest message
              setChats((prev) =>
                prev.map((chat) =>
                  chat.id === data.conversation_id
                    ? {
                        ...chat,
                        last_message: {
                          text: data.text,
                          timestamp: data.timestamp,
                          sender_id: data.sender_id,
                        },
                      }
                    : chat
                )
              );
            } else if (
              data.type === "typing_indicator" &&
              data.conversation_id === selectedChatId
            ) {
              setOtherUserTyping(data.is_typing);
            }
          } catch (error) {
            console.error("Error handling WebSocket message:", error);
          }
        });

        setWebSocket(ws);

        return () => {
          ws.disconnect();
        };
      } catch (error) {
        console.error("WebSocket connection error:", error);
      }
    };

    initWebSocket();
  }, [selectedChatId]);

  // Initial data fetch
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchChats("direct"), // Default to loading direct messages
          fetchContacts(),
        ]);

        // If URL contains a chat ID, select it
        if (urlChatId) {
          handleSelectChat(urlChatId);
        }
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [fetchChats, fetchContacts, handleSelectChat, urlChatId]);

  // Toggle sidebar for mobile
  const handleToggleSidebar = () => {
    setShowContextualInfo(!showContextualInfo);
  };

  // Toggle conversation list for mobile
  const handleToggleMainSidebar = () => {
    setShowConversationList(!showConversationList);
  };

  // Get currently selected chat object
  const selectedChat = chats.find((chat) => chat.id === selectedChatId) || null;

  return (
    <div className="messenger-layout">
      {/* Left Column - Conversations List */}
      <div
        className={`messenger-layout__column messenger-layout__column--left ${
          showConversationList ? "show" : "hide-on-mobile"
        }`}
      >
        <ConversationListColumn
          chats={chats}
          contacts={contacts}
          onSelectChat={handleSelectChat}
          selectedChatId={selectedChatId}
          onCreateChat={handleCreateChat}
          onLoadChats={fetchChats}
          className="full-height"
        />
      </div>

      {/* Middle Column - Message Area */}
      <div className="messenger-layout__column messenger-layout__column--middle">
        <MessageColumn
          selectedChat={selectedChat}
          messages={messages}
          pinnedMessages={pinnedMessages}
          onSendMessage={handleSendMessage}
          onInputChange={handleTypingStart}
          onEditMessage={(messageId, newText) =>
            chatAPI.editMessage(selectedChatId, messageId, newText)
          }
          onDeleteMessage={(messageId) =>
            chatAPI.deleteMessage(selectedChatId, messageId)
          }
          onPinMessage={(messageId) =>
            chatAPI.pinMessage(selectedChatId, messageId)
          }
          onUnpinMessage={(messageId) =>
            chatAPI.unpinMessage(selectedChatId, messageId)
          }
          isTyping={isTyping}
          otherUserTyping={otherUserTyping}
          onToggleConversationList={handleToggleMainSidebar}
          loading={loading}
          error={error}
          onToggleContextualInfo={handleToggleSidebar}
        />
      </div>

      {/* Right Column - Contextual Info */}
      <div
        className={`messenger-layout__column messenger-layout__column--right ${
          showContextualInfo ? "show" : "hide"
        }`}
      >
        <ContextualInfoColumn
          chat={selectedChat}
          onClose={handleToggleSidebar}
          contacts={contacts}
        />
      </div>
    </div>
  );
};

export default Chat;
