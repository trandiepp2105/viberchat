import React, { useRef, useEffect, useState } from "react";
import "./MessengerLayout.scss"; // Main layout styles

// Helper function to get message timestamp
const getMessageTime = (message) => {
  return message.message_timestamp || message.timestamp;
};

// Helper function to format date for message groups
const formatMessageDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const MessageColumn = ({
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
  onToggleConversationList, // Function to toggle conversation list visibility on mobile
  loading,
  error,
  onToggleContextualInfo,
  emptyStateMessage = "Select a conversation to start chatting",
}) => {
  const messagesEndRef = useRef(null);
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Group messages by sender for better UI presentation
  const groupedMessages = messages.reduce((groups, message, index) => {
    const previousMessage = index > 0 ? messages[index - 1] : null;

    // Create a new group if:
    // 1. This is the first message
    // 2. The sender changed from the previous message
    // 3. Time between messages is more than 5 minutes
    if (
      !previousMessage ||
      previousMessage.sender_id !== message.sender_id ||
      Math.abs(getMessageTime(message) - getMessageTime(previousMessage)) >
        300000
    ) {
      groups.push({
        sender_id: message.sender_id,
        messages: [message],
        timestamp: getMessageTime(message),
      });
    } else {
      // Add to the last group
      groups[groups.length - 1].messages.push(message);
    }

    return groups;
  }, []);

  // Group messages by date
  const messagesByDate = groupedMessages.reduce((dateGroups, group) => {
    const date = new Date(group.timestamp).toDateString();

    if (!dateGroups[date]) {
      dateGroups[date] = [];
    }

    dateGroups[date].push(group);
    return dateGroups;
  }, {});

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageText.trim()) {
      onSendMessage(messageText);
      setMessageText("");
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessageText(value);
    if (onInputChange) {
      onInputChange(value);
    }
  };

  // Format user info for header
  const getChatHeaderInfo = () => {
    if (!selectedChat) return { name: "Loading...", avatar: null };

    if (selectedChat.name) {
      return {
        name: selectedChat.name,
        avatar:
          selectedChat.avatar ||
          "https://scontent.fsgn19-1.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=dst-png_s100x100&_nc_cat=1&ccb=1-7&_nc_sid=136b72&_nc_ohc=duGw32spGhUQ7kNvwFzBlL2&_nc_oc=Adn1Mg19a5yaVuZdzuTIlhVO_1HVCiWk80ndOZxSB4wjjm03hCXhpIW0dRugQTGWEgU&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent.fsgn19-1.fna&oh=00_AfKLjwFqWH1pIRG5HLU8eAE4rQGLDdseO_vyja-jEYN5Pg&oe=6852B6FA",
      };
    }

    if (selectedChat.participants && selectedChat.participants.length > 0) {
      const otherParticipants = selectedChat.participants.filter(
        (p) => !p.is_self
      );
      if (otherParticipants.length > 0) {
        return {
          name: otherParticipants.map((p) => p.username || "User").join(", "),
          avatar:
            otherParticipants[0].avatar ||
            "https://scontent.fsgn19-1.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=dst-png_s100x100&_nc_cat=1&ccb=1-7&_nc_sid=136b72&_nc_ohc=duGw32spGhUQ7kNvwFzBlL2&_nc_oc=Adn1Mg19a5yaVuZdzuTIlhVO_1HVCiWk80ndOZxSB4wjjm03hCXhpIW0dRugQTGWEgU&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent.fsgn19-1.fna&oh=00_AfKLjwFqWH1pIRG5HLU8eAE4rQGLDdseO_vyja-jEYN5Pg&oe=6852B6FA",
        };
      }
    }

    return {
      name: "Chat",
      avatar:
        "https://scontent.fsgn19-1.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=dst-png_s100x100&_nc_cat=1&ccb=1-7&_nc_sid=136b72&_nc_ohc=duGw32spGhUQ7kNvwFzBlL2&_nc_oc=Adn1Mg19a5yaVuZdzuTIlhVO_1HVCiWk80ndOZxSB4wjjm03hCXhpIW0dRugQTGWEgU&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent.fsgn19-1.fna&oh=00_AfKLjwFqWH1pIRG5HLU8eAE4rQGLDdseO_vyja-jEYN5Pg&oe=6852B6FA",
    };
  };

  const chatInfo = getChatHeaderInfo();
  if (!selectedChat) {
    return (
      <div className="messenger-column message-column">
        <div className="empty-state">
          <div className="wrapper-empty-state-image">
            <i
              data-visualcompletion="css-img"
              className=""
              style={{
                backgroundImage:
                  'url("https://static.xx.fbcdn.net/rsrc.php/v4/yd/r/JpdPZF6qqZN.png")',
                backgroundPosition: "0px -181px",
                backgroundSize: "auto",
                width: "245px",
                height: "180px",
                backgroundRepeat: "no-repeat",
                display: "inline-block",
              }}
            ></i>
          </div>
          <h2>{emptyStateMessage}</h2>
          {/* <p>Chọn một đoạn chat để bắt đầu</p> */}
        </div>
      </div>
    );
  }

  return (
    <div className="messenger-column message-column">
      {/* Chat header */}
      <div className="message-column__header">
        <div className="message-column__header-info">
          {/* Mobile-only menu button to toggle conversation list */}
          <button
            className="mobile-menu-btn hide-on-desktop"
            onClick={onToggleConversationList}
            title="Danh sách trò chuyện"
          >
            <i className="fas fa-bars"></i>
          </button>

          <div className="message-column__header-info-avatar">
            <img
              src={
                chatInfo.avatar ||
                "https://scontent.fsgn19-1.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=dst-png_s100x100&_nc_cat=1&ccb=1-7&_nc_sid=136b72&_nc_ohc=duGw32spGhUQ7kNvwFzBlL2&_nc_oc=Adn1Mg19a5yaVuZdzuTIlhVO_1HVCiWk80ndOZxSB4wjjm03hCXhpIW0dRugQTGWEgU&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent.fsgn19-1.fna&oh=00_AfKLjwFqWH1pIRG5HLU8eAE4rQGLDdseO_vyja-jEYN5Pg&oe=6852B6FA"
              }
              alt={chatInfo.name}
            />
            <span className="status-indicator online"></span>
          </div>
          <div className="message-column__header-text">
            <div className="message-column__header-info-name">
              {chatInfo.name}
            </div>
            <div className="message-column__header-info-status">Online</div>
          </div>
        </div>
        <div className="message-column__header-actions">
          <button className="action-button" title="Gọi video">
            <i className="fas fa-video"></i>
          </button>
          <button className="action-button" title="Gọi thoại">
            <i className="fas fa-phone"></i>
          </button>
          <button className="action-button" title="Tìm kiếm">
            <i className="fas fa-search"></i>
          </button>
          <button
            className="action-button"
            onClick={onToggleContextualInfo}
            title="Thông tin"
          >
            <i className="fas fa-info-circle"></i>
          </button>
        </div>
      </div>
      {/* Messages area */}
      <div className="message-column__messages">
        {loading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>Đang tải tin nhắn...</span>
          </div>
        ) : error ? (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            <span>Có lỗi xảy ra: {error}</span>
          </div>
        ) : (
          // Display messages by date
          Object.keys(messagesByDate).map((date) => (
            <React.Fragment key={date}>
              <div className="message-date-divider">
                <span>{formatMessageDate(new Date(date))}</span>
              </div>

              {messagesByDate[date].map((group, groupIndex) => {
                const isSelf =
                  group.messages[0].sender_id === "self" ||
                  group.messages[0].is_self ||
                  group.messages[0].isCurrentUser;

                return (
                  <div
                    key={`${date}-${groupIndex}`}
                    className={`message-group ${isSelf ? "self" : "other"}`}
                  >
                    {!isSelf && (
                      <div className="message-group__avatar">
                        <img
                          src={
                            selectedChat.participants?.find(
                              (p) => p.user_id === group.sender_id
                            )?.avatar ||
                            "https://scontent.fsgn19-1.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=dst-png_s100x100&_nc_cat=1&ccb=1-7&_nc_sid=136b72&_nc_ohc=duGw32spGhUQ7kNvwFzBlL2&_nc_oc=Adn1Mg19a5yaVuZdzuTIlhVO_1HVCiWk80ndOZxSB4wjjm03hCXhpIW0dRugQTGWEgU&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent.fsgn19-1.fna&oh=00_AfKLjwFqWH1pIRG5HLU8eAE4rQGLDdseO_vyja-jEYN5Pg&oe=6852B6FA"
                          }
                          alt="User"
                        />
                      </div>
                    )}{" "}
                    <div className="message-group__content">
                      {!isSelf &&
                        group.messages &&
                        group.messages.length > 0 && (
                          <div className="sender-name">
                            {selectedChat.participants?.find(
                              (p) => p.user_id === group.sender_id
                            )?.username || "User"}
                          </div>
                        )}
                      {group.messages.map((message, messageIndex) => (
                        <div
                          key={message.id || message.message_id || messageIndex}
                          className={`message-bubble ${
                            message.is_pinned ? "pinned" : ""
                          } ${message.is_self ? "self" : "other"}`}
                        >
                          {message.is_pinned && (
                            <div className="pinned-indicator">
                              <i className="fas fa-thumbtack"></i>
                            </div>
                          )}{" "}
                          <div className="message-text">
                            {message.content || message.text}
                          </div>
                          {/* <div className="message-timestamp">
                            {new Date(
                              message.message_timestamp || message.timestamp
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div> */}
                          <div className="message-actions">
                            <button
                              onClick={() =>
                                onPinMessage(message.id || message.message_id)
                              }
                              title={message.is_pinned ? "Bỏ ghim" : "Ghim"}
                            >
                              <i
                                className={`fas fa-thumbtack ${
                                  message.is_pinned ? "active" : ""
                                }`}
                              ></i>
                            </button>
                            <button
                              onClick={() => {
                                /* Handle forwarding */
                              }}
                              title="Chuyển tiếp"
                            >
                              <i className="fas fa-share"></i>
                            </button>
                            <button
                              onClick={() => {
                                /* Handle reaction */
                              }}
                              title="Thêm biểu cảm"
                            >
                              <i className="far fa-smile"></i>
                            </button>
                            <button
                              onClick={() =>
                                onDeleteMessage(
                                  message.id || message.message_id
                                )
                              }
                              title="Xóa"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))
        )}
        <div ref={messagesEndRef} />

        {/* Typing indicator */}
        {otherUserTyping && (
          <div className="typing-indicator">
            <div className="typing-indicator__dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="typing-indicator__text">
              Đang soạn tin nhắn...
            </span>
          </div>
        )}
      </div>{" "}
      {/* Message input area */}
      <div className="message-column__input">
        <form onSubmit={handleSendMessage} className="message-input-form">
          <div className="message-actions">
            <button
              type="button"
              className="action-button plus-button"
              title="Thêm tệp đính kèm"
            >
              <svg
                class="x1lliihq x1tzjh5l x1k90msu x11xpdln x1qfuztq xsrhx6k x7p49u4"
                height="20px"
                viewBox="0 0 24 24"
                width="20px"
              >
                <g fill-rule="evenodd">
                  <polygon
                    fill="none"
                    points="-6,30 30,30 30,-6 -6,-6 "
                  ></polygon>
                  <path
                    d="m18,11l-5,0l0,-5c0,-0.552 -0.448,-1 -1,-1c-0.5525,0 -1,0.448 -1,1l0,5l-5,0c-0.5525,0 -1,0.448 -1,1c0,0.552 0.4475,1 1,1l5,0l0,5c0,0.552 0.4475,1 1,1c0.552,0 1,-0.448 1,-1l0,-5l5,0c0.552,0 1,-0.448 1,-1c0,-0.552 -0.448,-1 -1,-1m-6,13c-6.6275,0 -12,-5.3725 -12,-12c0,-6.6275 5.3725,-12 12,-12c6.627,0 12,5.3725 12,12c0,6.6275 -5.373,12 -12,12"
                    fill="#3653e8"
                  ></path>
                </g>
              </svg>
            </button>
            <button
              type="button"
              className="action-button"
              title="Thêm hình ảnh"
            >
              <svg
                class="x1lliihq x1tzjh5l"
                height="20px"
                viewBox="0 -1 17 17"
                width="20px"
              >
                <g fill="none" fill-rule="evenodd">
                  <path
                    d="M2.882 13.13C3.476 4.743 3.773.48 3.773.348L2.195.516c-.7.1-1.478.647-1.478 1.647l1.092 11.419c0 .5.2.9.4 1.3.4.2.7.4.9.4h.4c-.6-.6-.727-.951-.627-2.151z"
                    fill="#3653e8"
                  ></path>
                  <circle cx="8.5" cy="4.5" fill="#3653e8" r="1.5"></circle>
                  <path
                    d="M14 6.2c-.2-.2-.6-.3-.8-.1l-2.8 2.4c-.2.1-.2.4 0 .6l.6.7c.2.2.2.6-.1.8-.1.1-.2.1-.4.1s-.3-.1-.4-.2L8.3 8.3c-.2-.2-.6-.3-.8-.1l-2.6 2-.4 3.1c0 .5.2 1.6.7 1.7l8.8.6c.2 0 .5 0 .7-.2.2-.2.5-.7.6-.9l.6-5.9L14 6.2z"
                    fill="#3653e8"
                  ></path>
                  <path
                    d="M13.9 15.5l-8.2-.7c-.7-.1-1.3-.8-1.3-1.6l1-11.4C5.5 1 6.2.5 7 .5l8.2.7c.8.1 1.3.8 1.3 1.6l-1 11.4c-.1.8-.8 1.4-1.6 1.3z"
                    stroke="#3653e8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                </g>
              </svg>
            </button>
            <button type="button" className="action-button" title="Thêm tệp">
              <svg
                class="x1lliihq x1tzjh5l xsrhx6k"
                height="20px"
                viewBox="0 0 17 16"
                width="20px"
                x="0px"
                y="0px"
              >
                <g fill-rule="evenodd">
                  <circle cx="5.5" cy="5.5" fill="none" r="1"></circle>
                  <circle cx="11.5" cy="4.5" fill="none" r="1"></circle>
                  <path
                    d="M5.3 9c-.2.1-.4.4-.3.7.4 1.1 1.2 1.9 2.3 2.3h.2c.2 0 .4-.1.5-.3.1-.3 0-.5-.3-.6-.8-.4-1.4-1-1.7-1.8-.1-.2-.4-.4-.7-.3z"
                    fill="none"
                  ></path>
                  <path
                    d="M10.4 13.1c0 .9-.4 1.6-.9 2.2 4.1-1.1 6.8-5.1 6.5-9.3-.4.6-1 1.1-1.8 1.5-2 1-3.7 3.6-3.8 5.6z"
                    fill="#3653e8"
                  ></path>
                  <path
                    d="M2.5 13.4c.1.8.6 1.6 1.3 2 .5.4 1.2.6 1.8.6h.6l.4-.1c1.6-.4 2.6-1.5 2.7-2.9.1-2.4 2.1-5.4 4.5-6.6 1.3-.7 1.9-1.6 1.9-2.8l-.2-.9c-.1-.8-.6-1.6-1.3-2-.7-.5-1.5-.7-2.4-.5L3.6 1.5C1.9 1.8.7 3.4 1 5.2l1.5 8.2zm9-8.9c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm-3.57 6.662c.3.1.4.4.3.6-.1.3-.3.4-.5.4h-.2c-1-.4-1.9-1.3-2.3-2.3-.1-.3.1-.6.3-.7.3-.1.5 0 .6.3.4.8 1 1.4 1.8 1.7zM5.5 5.5c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z"
                    fill="#3653e8"
                    fill-rule="nonzero"
                  ></path>
                </g>
              </svg>
            </button>
            <button type="button" className="action-button" title="Thêm GIF">
              <svg
                class="x1lliihq x1tzjh5l xsrhx6k"
                height="20px"
                viewBox="0 0 16 16"
                width="20px"
                x="0px"
                y="0px"
              >
                <path
                  d="M.783 12.705c.4.8 1.017 1.206 1.817 1.606 0 0 1.3.594 2.5.694 1 .1 1.9.1 2.9.1s1.9 0 2.9-.1 1.679-.294 2.479-.694c.8-.4 1.157-.906 1.557-1.706.018 0 .4-1.405.5-2.505.1-1.2.1-3 0-4.3-.1-1.1-.073-1.976-.473-2.676-.4-.8-.863-1.408-1.763-1.808-.6-.3-1.2-.3-2.4-.4-1.8-.1-3.8-.1-5.7 0-1 .1-1.7.1-2.5.5s-1.417 1.1-1.817 1.9c0 0-.4 1.484-.5 2.584-.1 1.2-.1 3 0 4.3.1 1 .2 1.705.5 2.505zm10.498-8.274h2.3c.4 0 .769.196.769.696 0 .5-.247.68-.747.68l-1.793.02.022 1.412 1.252-.02c.4 0 .835.204.835.704s-.442.696-.842.696H11.82l-.045 2.139c0 .4-.194.8-.694.8-.5 0-.7-.3-.7-.8l-.031-5.631c0-.4.43-.696.93-.696zm-3.285.771c0-.5.3-.8.8-.8s.8.3.8.8l-.037 5.579c0 .4-.3.8-.8.8s-.8-.4-.8-.8l.037-5.579zm-3.192-.825c.7 0 1.307.183 1.807.683.3.3.4.7.1 1-.2.4-.7.4-1 .1-.2-.1-.5-.3-.9-.3-1 0-2.011.84-2.011 2.14 0 1.3.795 2.227 1.695 2.227.4 0 .805.073 1.105-.127V8.6c0-.4.3-.8.8-.8s.8.3.8.8v1.8c0 .2.037.071-.063.271-.7.7-1.57.991-2.47.991C2.868 11.662 1.3 10.2 1.3 8s1.704-3.623 3.504-3.623z"
                  fill="#3653e8"
                  fill-rule="nonzero"
                ></path>
              </svg>
            </button>
          </div>

          <div className="message-input-container">
            <input
              type="text"
              value={messageText}
              onChange={handleInputChange}
              placeholder="Aa"
              className="message-input"
            />

            <div className="input-actions">
              <button
                type="button"
                className="emoji-button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Biểu tượng cảm xúc"
              >
                <i className="far fa-smile"></i>
              </button>

              <button
                type="button"
                className="mic-button"
                title="Ghi âm tin nhắn"
              >
                <i className="fas fa-microphone"></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`send-button ${messageText.trim() ? "active" : ""}`}
            disabled={!messageText.trim()}
            title="Gửi"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>

        {showEmojiPicker && (
          <div className="emoji-picker">
            {/* Simplified emoji picker for demonstration */}
            <div className="emoji-picker__header">
              <span>Biểu tượng cảm xúc</span>
              <button onClick={() => setShowEmojiPicker(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="emoji-picker__emojis">
              {[
                "😀",
                "😁",
                "😂",
                "🤣",
                "😃",
                "😄",
                "😅",
                "😆",
                "😉",
                "😊",
                "😋",
                "😎",
                "😍",
                "😘",
              ].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setMessageText((prevText) => prevText + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="emoji-item"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageColumn;
