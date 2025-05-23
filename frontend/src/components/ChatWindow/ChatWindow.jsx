import React, { useRef, useEffect, useState } from "react";
import "./ChatWindow.scss";
import Header from "../Header/Header";
import Message from "../Message/Message";
import MessageInput from "../MessageInput/MessageInput";

// Helper function to handle both timestamp and message_timestamp fields
const getMessageTime = (message) => {
  return message.message_timestamp || message.timestamp;
};

const ChatWindow = ({
  selectedChat,
  messages,
  pinnedMessages = [],
  onSendMessage,
  onInputChange,
  onEditMessage,
  onDeleteMessage,
  onPinMessage,
  onUnpinMessage,
  isTyping,
  otherUserTyping,
  loading,
  error,
  onToggleSidebar,
  onToggleMainSidebar,
  showMainSidebar,
}) => {
  const messagesEndRef = useRef(null);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  // If no pinnedMessages prop is provided, fall back to filtering from all messages
  const displayedPinnedMessages =
    pinnedMessages.length > 0
      ? pinnedMessages
      : messages.filter((m) => m.is_pinned);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (text) => {
    if (text.trim() === "") return;
    onSendMessage(text);
  };

  const handleEditMessage = (messageId, newText) => {
    if (onEditMessage) {
      onEditMessage(messageId, newText);
    }
  };

  const handleDeleteMessage = (messageId) => {
    if (onDeleteMessage) {
      onDeleteMessage(messageId);
    }
  };

  const handlePinMessage = (messageId) => {
    if (onPinMessage) {
      onPinMessage(messageId);
    }
  };

  const handleUnpinMessage = (messageId) => {
    if (onUnpinMessage) {
      onUnpinMessage(messageId);
    }
  };

  // Get participant names for group chats or the other user for direct chats
  const getChatTitle = () => {
    if (!selectedChat) return "";

    if (selectedChat.name) return selectedChat.name;

    if (selectedChat.is_group_chat) {
      return selectedChat.participants.map((p) => p.username).join(", ");
    }

    // For direct chats, show the other user's name
    const otherUser = selectedChat.participants?.find(
      (p) => p.id !== selectedChat.user_id
    );
    return otherUser ? otherUser.username : "Chat";
  };

  return (
    <div className="chat-window">
      {loading ? (
        <div className="chat-window__loading">
          <div className="spinner"></div>
          <p>Loading chat...</p>
        </div>
      ) : error ? (
        <div className="chat-window__error">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      ) : selectedChat ? (
        <>
          {" "}
          <div className="chat-window__header-container">
            <button
              className="chat-window__sidebar-toggle hide-on-desktop"
              onClick={onToggleMainSidebar}
            >
              <i className={`fas fa-${showMainSidebar ? "times" : "bars"}`}></i>
            </button>
            <Header
              title={getChatTitle()}
              subtitle={
                selectedChat.is_group_chat
                  ? `${selectedChat.participants.length} members`
                  : "Online"
              }
              avatar={selectedChat.avatar || "https://i.pravatar.cc/150?img=8"}
            />{" "}
            <div className="chat-window__header-actions">
              {displayedPinnedMessages.length > 0 && (
                <button
                  className="chat-window__pinned-btn"
                  onClick={() => setShowPinnedMessages(!showPinnedMessages)}
                  title="Pinned Messages"
                >
                  <i className="fas fa-thumbtack"></i>
                  <span className="chat-window__pinned-count">
                    {displayedPinnedMessages.length}
                  </span>
                </button>
              )}
              <button
                className="chat-window__info-btn"
                onClick={onToggleSidebar}
              >
                <i className="fas fa-info-circle"></i>
              </button>
            </div>
          </div>
          {showPinnedMessages && displayedPinnedMessages.length > 0 && (
            <div className="chat-window__pinned-messages">
              <div className="chat-window__pinned-header">
                <h3>Pinned Messages</h3>
                <button onClick={() => setShowPinnedMessages(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="chat-window__pinned-list">
                {" "}
                {displayedPinnedMessages.map((message) => (
                  <Message
                    key={`pinned-${message.id || message.message_id}`}
                    id={message.id || message.message_id}
                    text={message.text}
                    isMe={
                      message.sender === "me" ||
                      message.sender?.id === selectedChat.user_id
                    }
                    timestamp={getMessageTime(message)}
                    isDeleted={message.is_deleted}
                    isEdited={message.is_edited}
                    isPinned={message.is_pinned}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                    onPin={handlePinMessage}
                    onUnpin={handleUnpinMessage}
                    sender={
                      message.sender_name ||
                      message.sender?.name ||
                      message.sender?.username
                    }
                    isGroupChat={selectedChat?.is_group_chat}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="chat-window__messages">
            <div className="chat-window__date-separator">
              <span>Today</span>
            </div>{" "}
            {messages.map((message) => (
              <Message
                key={message.id || message.message_id}
                id={message.id || message.message_id}
                text={message.text}
                isMe={
                  message.sender === "me" ||
                  message.sender?.id === selectedChat.user_id
                }
                timestamp={getMessageTime(message)}
                isDeleted={message.is_deleted}
                isEdited={message.is_edited}
                isPinned={message.is_pinned}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                onPin={handlePinMessage}
                onUnpin={handleUnpinMessage}
                sender={
                  message.sender_name ||
                  message.sender?.name ||
                  message.sender?.username
                }
                isGroupChat={selectedChat?.is_group_chat}
              />
            ))}
            {otherUserTyping && (
              <div className="chat-window__typing-indicator">
                <span>Typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <MessageInput
            onSendMessage={handleSendMessage}
            onInputChange={onInputChange}
          />
        </>
      ) : (
        <div className="chat-window__empty">
          <div className="chat-window__empty-content">
            <i className="fas fa-comments chat-window__empty-icon"></i>
            <h2>Select a conversation</h2>
            <p>Choose a contact from the list to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
