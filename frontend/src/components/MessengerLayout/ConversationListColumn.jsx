import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./MessengerLayout.scss"; // Assuming this contains .conversation-list-column and other relevant styles
import { userAPI, chatAPI } from "../../services"; // Added chatAPI

const ConversationListColumn = ({
  chats,
  contacts, // Keep contacts prop for new chat modal
  onSelectChat,
  selectedChatId,
  onCreateChat, // Prop to create new direct or group chats
  onLoadChats, // Callback to fetch chats when tab changes
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatType, setNewChatType] = useState("direct"); // "direct" or "group"
  const [selectedContactsForNewChat, setSelectedContactsForNewChat] = useState(
    []
  );
  const [groupChatName, setGroupChatName] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("direct"); // "direct" or "group"
  const [isSearchMode, setIsSearchMode] = useState(false); // New state for search mode UI
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef(null);

  // Function to handle tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);

    if (onLoadChats) {
      setLoading(true);
      onLoadChats(tab).finally(() => {
        setLoading(false);
      });
    }
  };

  // Function to handle searching users for new conversations
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setUserSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const response = await userAPI.searchUsers(query);
      setUserSearchResults(response.data || []);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // Effect to handle search based on query
  useEffect(() => {
    if (isSearchMode && searchQuery.length >= 2) {
      const delaySearch = setTimeout(() => {
        searchUsers(searchQuery);
      }, 500);

      return () => clearTimeout(delaySearch);
    }
  }, [searchQuery, isSearchMode]);

  // Handle entering search mode
  const enterSearchMode = () => {
    setIsSearchMode(true);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  // Handle exiting search mode
  const exitSearchMode = () => {
    setIsSearchMode(false);
    setSearchQuery("");
    setUserSearchResults([]);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!isSearchMode && query) {
      setIsSearchMode(true);
    }
  };
  // Start a chat with a selected user from search
  const startChatWithUser = (user) => {
    if (onCreateChat) {
      onCreateChat([user.id], false, "", "");
    }
    // Reset search state
    exitSearchMode();
  };

  // Filter chats based on search query
  const filteredChats = Array.isArray(chats)
    ? chats.filter((chat) => {
        let nameToSearch = "";
        if (chat.name) {
          nameToSearch = chat.name;
        } else if (chat.participants && chat.participants.length > 0) {
          nameToSearch = chat.participants
            .map((p) => p.username || "") // Ensure p.username is a string
            .join(" ");
        }
        return nameToSearch.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : [];

  // Group search results by type
  const knownUsers = userSearchResults.filter(
    (user) => contacts && contacts.some((contact) => contact.id === user.id)
  );

  const otherUsers = userSearchResults.filter(
    (user) => !contacts || !contacts.some((contact) => contact.id === user.id)
  );

  const getChatName = (chat) => {
    if (chat.name) return chat.name;
    if (chat.participants && chat.participants.length > 0) {
      return chat.participants.map((p) => p.username || "User").join(", ");
    }
    return "Chat";
  };
  const getChatLastMessage = (chat) => {
    if (!chat.last_message) return "No messages yet";
    if (chat.last_message.is_deleted) return "This message was deleted";
    if (chat.last_message.has_attachment) return "Attachment";
    let messageText =
      chat.last_message.text ||
      chat.last_message.content ||
      (typeof chat.last_message === "string"
        ? chat.last_message
        : "New message");
    return messageText.length > 30
      ? `${messageText.substring(0, 30)}...`
      : messageText;
  };

  // This function is kept for future use but commented out to avoid warnings
  // const getChatAvatar = (chat) => {
  //   return chat.avatar || `https://i.pravatar.cc/40?u=${chat.id}`;
  // };

  const getChatTime = (chat) => {
    const timestamp =
      chat.last_message?.message_timestamp ||
      chat.last_message?.timestamp ||
      chat.updated_at;
    if (!timestamp) return "";
    const dateObj = new Date(timestamp);
    if (isNaN(dateObj.getTime())) return "";
    const now = new Date();
    if (dateObj.toDateString() === now.toDateString()) {
      return dateObj.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    const diffDays = Math.round(
      (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 7 && diffDays >= 0) {
      return dateObj.toLocaleDateString([], { weekday: "short" });
    }
    return dateObj.toLocaleDateString([], { month: "short", day: "numeric" });
  };
  const navigate = useNavigate();

  // Navigate to the dedicated new chat page
  const openNewChatModalHandler = () => {
    navigate("/chat/new");
  };

  const toggleContactSelectionForNewChat = (contact) => {
    setSelectedContactsForNewChat((prevSelected) => {
      if (prevSelected.find((c) => c.id === contact.id)) {
        return prevSelected.filter((c) => c.id !== contact.id);
      } else {
        return newChatType === "direct"
          ? [contact]
          : [...prevSelected, contact];
      }
    });
  };

  const handleCreateNewChat = async () => {
    if (selectedContactsForNewChat.length === 0) return;
    if (newChatType === "group" && !groupChatName.trim()) {
      alert("Group name is required for group chats.");
      return;
    }

    const participantIds = selectedContactsForNewChat.map((c) => c.id);
    const isGroup = newChatType === "group";
    const name = isGroup ? groupChatName.trim() : "";

    try {
      await onCreateChat(participantIds, isGroup, name, initialMessage.trim());
      setShowNewChatModal(false);
      setSearchQuery("");
      setUserSearchResults([]);
      setSelectedContactsForNewChat([]);
      setGroupChatName("");
      setInitialMessage("");
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  // Render search mode UI
  if (isSearchMode) {
    return (
      <div
        className={`messenger-column conversation-list-column ${
          className || ""
        }`}
      >
        <div className="conversation-list-column__search-mode">
          <div className="search-header">
            <button className="back-button" onClick={exitSearchMode}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="search-input-container">
              <i className="fas fa-search"></i>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="enter username or email"
                autoFocus
              />
              {searchQuery && (
                <button
                  className="clear-search"
                  onClick={() => setSearchQuery("")}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          <div className="search-prompt-box">
            <div className="search-icon">
              <i className="fas fa-search"></i>
            </div>
            <div className="search-prompt-text">
              Search messages for {searchQuery || "username"}
            </div>
          </div>

          <div className="search-results">
            {isSearchingUsers ? (
              <div className="searching-indicator">
                <span>Searching...</span>
              </div>
            ) : (
              <>
                {knownUsers.length > 0 && (
                  <div className="user-list">
                    {knownUsers.map((user) => (
                      <div
                        key={user.id}
                        className="user-item"
                        onClick={() => startChatWithUser(user)}
                      >
                        <div className="user-avatar">
                          <img
                            src={
                              user.avatar ||
                              "https://scontent.fsgn19-1.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=dst-png_s100x100&_nc_cat=1&ccb=1-7&_nc_sid=136b72&_nc_ohc=duGw32spGhUQ7kNvwFzBlL2&_nc_oc=Adn1Mg19a5yaVuZdzuTIlhVO_1HVCiWk80ndOZxSB4wjjm03hCXhpIW0dRugQTGWEgU&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent.fsgn19-1.fna&oh=00_AfIWs567zBmNdwByVWYK5eLUt06DBDzNzxxKh5QZdob-KA&oe=68527EBA"
                            }
                            alt={user.username}
                          />
                        </div>
                        <div className="user-name">{user.username}</div>
                      </div>
                    ))}
                  </div>
                )}

                {otherUsers.length > 0 && (
                  <>
                    <div className="results-section-header">
                      <span>Other people</span>
                    </div>
                    <div className="user-list">
                      {otherUsers.map((user) => (
                        <div
                          key={user.id}
                          className="user-item"
                          onClick={() => startChatWithUser(user)}
                        >
                          <div className="user-avatar">
                            <img
                              src={
                                user.avatar ||
                                "https://scontent.fsgn19-1.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=dst-png_s100x100&_nc_cat=1&ccb=1-7&_nc_sid=136b72&_nc_ohc=duGw32spGhUQ7kNvwFzBlL2&_nc_oc=Adn1Mg19a5yaVuZdzuTIlhVO_1HVCiWk80ndOZxSB4wjjm03hCXhpIW0dRugQTGWEgU&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent.fsgn19-1.fna&oh=00_AfIWs567zBmNdwByVWYK5eLUt06DBDzNzxxKh5QZdob-KA&oe=68527EBA"
                              }
                              alt={user.username}
                            />
                          </div>
                          <div className="user-name">{user.username}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {userSearchResults.length === 0 && searchQuery.length >= 2 && (
                  <div className="no-results">
                    <span>No matching results found</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default UI (not in search mode)
  return (
    <div
      className={`messenger-column conversation-list-column ${className || ""}`}
    >
      <div className="conversation-list-column__header">
        <h2>conversations</h2>
        <div className="actions">
          <button
            onClick={openNewChatModalHandler}
            title="Create new conversation"
          >
            <svg
              viewBox="6 6 24 24"
              fill="currentColor"
              width="20"
              height="20"
              aria-hidden="true"
              class="xfx01vb x1lliihq x1tzjh5l x1k90msu x2h7rmj x1qfuztq"
              overflow="visible"
              style={{
                color: "#050505",
              }}
            >
              <path d="M17.305 16.57a1.998 1.998 0 0 0-.347.467l-1.546 2.87a.5.5 0 0 0 .678.677l2.87-1.545c.171-.093.328-.21.466-.347l8.631-8.631a1.5 1.5 0 1 0-2.121-2.122l-8.631 8.632z"></path>
              <path d="M18 10.5a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-6a4 4 0 0 0-4 4v12a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4v-6a1 1 0 0 0-1-1h-.5a1 1 0 0 0-1 1v6a1.5 1.5 0 0 1-1.5 1.5H12a1.5 1.5 0 0 1-1.5-1.5V12a1.5 1.5 0 0 1 1.5-1.5h6z"></path>
            </svg>
          </button>
          {/* <button title="Tuỳ chọn">
            <i className="fas fa-ellipsis-h"></i>
          </button> */}
        </div>
      </div>
      <div
        className="conversation-list-column__search"
        onClick={enterSearchMode}
      >
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Search on viberchat"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={enterSearchMode}
        />
      </div>{" "}
      <div className="conversation-list-column__tabs">
        <button
          className={activeTab === "direct" ? "active" : ""}
          onClick={() => handleTabChange("direct")}
        >
          Messages
        </button>
        <button
          className={activeTab === "group" ? "active" : ""}
          onClick={() => handleTabChange("group")}
        >
          Groups
        </button>
      </div>{" "}
      <div className="conversation-list-column__list">
        {loading ? (
          <div className="loading-indicator">
            <span>Loading conversations...</span>
          </div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${
                selectedChatId === chat.id ? "selected" : ""
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="chat-item__avatar">
                <img
                  // src={
                  //   getChatAvatar(chat) ||
                  //   "http://scontent.fsgn19-1.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=dst-png_s100x100&_nc_cat=1&ccb=1-7&_nc_sid=136b72&_nc_ohc=duGw32spGhUQ7kNvwFzBlL2&_nc_oc=Adn1Mg19a5yaVuZdzuTIlhVO_1HVCiWk80ndOZxSB4wjjm03hCXhpIW0dRugQTGWEgU&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent.fsgn19-1.fna&oh=00_AfKLjwFqWH1pIRG5HLU8eAE4rQGLDdseO_vyja-jEYN5Pg&oe=6852B6FA"
                  // }
                  src="https://scontent.fsgn19-1.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=dst-png_s100x100&_nc_cat=1&ccb=1-7&_nc_sid=136b72&_nc_ohc=duGw32spGhUQ7kNvwFzBlL2&_nc_oc=Adn1Mg19a5yaVuZdzuTIlhVO_1HVCiWk80ndOZxSB4wjjm03hCXhpIW0dRugQTGWEgU&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent.fsgn19-1.fna&oh=00_AfKLjwFqWH1pIRG5HLU8eAE4rQGLDdseO_vyja-jEYN5Pg&oe=6852B6FA"
                  alt={getChatName(chat)}
                />
              </div>
              <div className="chat-item__content">
                <div className="chat-item__name">{getChatName(chat)}</div>
                <div className="chat-item__last-message">
                  {getChatLastMessage(chat)}
                </div>
              </div>
              <div className="chat-item__time">{getChatTime(chat)}</div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>
              No {activeTab === "direct" ? "direct messages" : "group chats"}{" "}
              found.
            </p>
          </div>
        )}
      </div>
      {/* Modal for creating a new chat is no longer needed as we redirect to the NewChat page */}
      {false && showNewChatModal && (
        <div className="modal">
          <div className="modal__content">
            <div className="modal__header">
              <h3>Tạo đoạn chat mới</h3>
              <button
                className="modal__close"
                onClick={() => setShowNewChatModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal__body">
              <div className="modal__tabs">
                <button
                  className={newChatType === "direct" ? "active" : ""}
                  onClick={() => setNewChatType("direct")}
                >
                  Chat trực tiếp
                </button>
                <button
                  className={newChatType === "group" ? "active" : ""}
                  onClick={() => setNewChatType("group")}
                >
                  Chat nhóm
                </button>
              </div>

              {newChatType === "group" && (
                <div className="form-group">
                  <label htmlFor="groupName">Tên nhóm</label>
                  <input
                    type="text"
                    id="groupName"
                    value={groupChatName}
                    onChange={(e) => setGroupChatName(e.target.value)}
                    placeholder="Nhập tên nhóm"
                    className="form-control"
                  />
                </div>
              )}

              <div className="form-group">
                <label>
                  Chọn{" "}
                  {newChatType === "direct"
                    ? "Liên hệ"
                    : "Liên hệ (tối đa 1 cho chat trực tiếp)"}
                </label>
                <div className="contact-list-for-modal">
                  {Array.isArray(contacts) && contacts.length > 0 ? (
                    contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`contact-item-modal ${
                          selectedContactsForNewChat.find(
                            (c) => c.id === contact.id
                          )
                            ? "selected"
                            : ""
                        } ${
                          newChatType === "direct" &&
                          selectedContactsForNewChat.length > 0 &&
                          !selectedContactsForNewChat.find(
                            (c) => c.id === contact.id
                          )
                            ? "disabled"
                            : ""
                        }`}
                        onClick={() => {
                          if (
                            newChatType === "direct" &&
                            selectedContactsForNewChat.length > 0 &&
                            !selectedContactsForNewChat.find(
                              (c) => c.id === contact.id
                            )
                          ) {
                            return;
                          }
                          toggleContactSelectionForNewChat(contact);
                        }}
                      >
                        <img
                          src={
                            contact.avatar ||
                            `https://i.pravatar.cc/30?u=${contact.id}`
                          }
                          alt={contact.username}
                          className="contact-modal-avatar"
                        />
                        <span>{contact.username}</span>
                        {selectedContactsForNewChat.find(
                          (c) => c.id === contact.id
                        ) && (
                          <i className="fas fa-check-circle contact-selected-icon"></i>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>
                      Không có liên hệ nào trong danh sách của bạn. Tìm kiếm ở
                      trên để tìm người dùng.
                    </p>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="initialMessage">
                  Tin nhắn ban đầu (Tuỳ chọn)
                </label>
                <textarea
                  id="initialMessage"
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Nhập tin nhắn đầu tiên của bạn..."
                  rows={2}
                  className="form-control"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="button-secondary"
              >
                Huỷ
              </button>
              <button
                onClick={handleCreateNewChat}
                className="button-primary"
                disabled={
                  selectedContactsForNewChat.length === 0 ||
                  (newChatType === "group" && !groupChatName.trim())
                }
              >
                Bắt đầu chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationListColumn;
