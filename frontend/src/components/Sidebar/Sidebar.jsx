import React, { useState } from "react";
import "./Sidebar.scss";
import { userAPI } from "../../services";

const Sidebar = ({
  chats,
  contacts,
  onSelectChat,
  selectedChatId,
  onCreateChat,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatType, setNewChatType] = useState("direct"); // "direct" or "group"
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupChatName, setGroupChatName] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  // Filter chats based on search query
  const filteredChats = Array.isArray(chats)
    ? chats.filter((chat) => {
        if (!chat.name) {
          // For direct chats without a name, search in participant names
          const participantNames = chat.participants
            ?.map((p) => p.username)
            .join(" ")
            .toLowerCase();
          return participantNames?.includes(searchQuery.toLowerCase());
        }
        return chat.name?.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : [];

  console.log("===== DEBUG: Sidebar - Chats data =====");
  console.log("Total chats:", Array.isArray(chats) ? chats.length : 0);
  console.log("Filtered chats:", filteredChats.length);
  if (Array.isArray(chats) && chats.length > 0) {
    console.log("Sample chat object:", chats[0]);
    console.log("Last message of first chat:", chats[0].last_message);
  }

  // Filter contacts based on search query
  const filteredContacts = Array.isArray(contacts)
    ? contacts.filter((contact) =>
        contact.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Get chat display name
  const getChatName = (chat) => {
    if (chat.name) return chat.name;

    // For direct chats, show the other user's name
    const otherUser = chat.participants?.find((p) => p.id !== chat.user_id);
    return otherUser ? otherUser.username : "Chat";
  };
  // Get last message preview
  const getLastMessagePreview = (chat) => {
    console.log(
      `Getting last message preview for chat ${chat.id}:`,
      chat.last_message
    );

    // Step 1: Check if last_message exists
    if (!chat.last_message) {
      console.log("No last message found for this chat");
      return "No messages yet";
    }

    // Step 2: Handle special cases
    if (chat.last_message.is_deleted) {
      return "This message was deleted";
    }

    if (chat.last_message.has_attachment) {
      return "Attachment";
    }

    // Step 3: Try multiple ways to extract the message text
    let messageText = null;

    if (typeof chat.last_message === "string") {
      // Case 1: last_message is directly a string
      messageText = chat.last_message;
    } else if (chat.last_message.text) {
      // Case 2: last_message has a text property
      messageText = chat.last_message.text;
    } else if (chat.last_message.message && chat.last_message.message.text) {
      // Case 3: nested message object
      messageText = chat.last_message.message.text;
    } else if (chat.last_message.content) {
      // Case 4: content field
      messageText = chat.last_message.content;
    }

    // Step 4: If we still couldn't find text, check all properties
    if (!messageText) {
      console.log(
        "No standard text field found, checking all last_message properties:"
      );
      for (const key in chat.last_message) {
        if (
          typeof chat.last_message[key] === "string" &&
          key !== "id" &&
          key !== "sender_id" &&
          key !== "timestamp" &&
          key !== "message_timestamp"
        ) {
          console.log(
            `Found possible text in '${key}' property:`,
            chat.last_message[key]
          );
          messageText = chat.last_message[key];
          break;
        }
      }
    }

    // Step 5: If still no text found, return generic message
    if (!messageText) {
      console.log("No message text found in last_message:", chat.last_message);
      return "New message";
    }

    // Step 6: Format the message preview
    return messageText.length > 25
      ? `${messageText.substring(0, 25)}...`
      : messageText;
  };
  // Format timestamp to display time or date
  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    let dateObj;
    try {
      // Handle various timestamp formats
      if (typeof timestamp === "object" && timestamp instanceof Date) {
        dateObj = timestamp;
      } else if (typeof timestamp === "number") {
        // Handle Unix timestamp (in seconds or milliseconds)
        dateObj = new Date(
          timestamp > 1000000000000 ? timestamp : timestamp * 1000
        );
      } else {
        // Parse ISO string or other string formats
        dateObj = new Date(timestamp);
      }

      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        console.log("Invalid timestamp:", timestamp);
        return "";
      }

      const now = new Date();

      // If the message is from today, show time only
      if (dateObj.toDateString() === now.toDateString()) {
        return dateObj.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // If from this week, show day name
      const diffDays = Math.round((now - dateObj) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        return dateObj.toLocaleDateString([], { weekday: "short" });
      }

      // Otherwise show short date
      return dateObj.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch (error) {
      console.error("Error formatting timestamp:", error, timestamp);
      return "";
    }
  };

  // Handle search input changes and user search
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      setIsSearching(true);
      try {
        const response = await userAPI.searchUsers(query);
        setSearchResults(response.data);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  // Start a chat with a user from search results
  const startChatWithUser = async (userId) => {
    try {
      // Create a direct chat with this user
      const participantIds = [userId]; // Array of user IDs
      const isGroupChat = false; // Not a group chat
      const name = ""; // No name for direct chat
      const initialMsg = ""; // No automatic initial message

      console.log("Starting chat with:", {
        participantIds,
        isGroupChat,
        name,
        initialMsg,
      });

      await onCreateChat(participantIds, isGroupChat, name, initialMsg);

      // Clear search results
      setSearchResults([]);
      setSearchQuery("");
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };
  // Open modal to create a new chat
  const openNewChatModal = (type = "direct") => {
    setNewChatType(type);
    setSelectedContacts([]);
    setGroupChatName("");
    setInitialMessage("");
    setShowNewChatModal(true);
  };

  // Toggle selection of a contact in the new chat modal
  const toggleContactSelection = (contact) => {
    if (selectedContacts.find((c) => c.id === contact.id)) {
      setSelectedContacts(selectedContacts.filter((c) => c.id !== contact.id));
    } else {
      // For direct chat, only allow one contact
      if (newChatType === "direct") {
        setSelectedContacts([contact]);
      } else {
        setSelectedContacts([...selectedContacts, contact]);
      }
    }
  };

  // Create a new chat with selected contact(s)
  const createNewChat = () => {
    if (selectedContacts.length === 0) return;

    const participantIds = selectedContacts.map((c) => c.id);
    const isGroupChat = newChatType === "group";
    const name = isGroupChat ? groupChatName : "";

    onCreateChat(participantIds, isGroupChat, name, initialMessage);
    setShowNewChatModal(false);
  };

  // Start a chat with a contact directly from contacts tab
  const startChatWithContact = (contact) => {
    if (onCreateChat) {
      onCreateChat([contact.id], false, "", "");
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar__search">
        <div className="search-input">
          <i className="fas fa-search search-input__icon"></i>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input__field"
          />
        </div>
        <button
          className="sidebar__new-chat-btn"
          onClick={() => openNewChatModal()}
          title="New chat"
        >
          <i className="fas fa-edit"></i>
        </button>
      </div>

      <div className="sidebar__tabs">
        <button
          className={`sidebar__tab ${
            activeTab === "chats" ? "sidebar__tab--active" : ""
          }`}
          onClick={() => setActiveTab("chats")}
        >
          Chats
        </button>
        <button
          className={`sidebar__tab ${
            activeTab === "contacts" ? "sidebar__tab--active" : ""
          }`}
          onClick={() => setActiveTab("contacts")}
        >
          Contacts
        </button>
      </div>

      <div className="sidebar__content">
        {activeTab === "chats" ? (
          <div className="sidebar__chats">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`sidebar__chat-item ${
                    selectedChatId === chat.id
                      ? "sidebar__chat-item--active"
                      : ""
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="sidebar__chat-avatar">
                    <img
                      src={chat.avatar || "https://i.pravatar.cc/150?img=8"}
                      alt={getChatName(chat)}
                    />
                    {chat.is_group_chat && (
                      <span className="group-indicator">
                        <i className="fas fa-users"></i>
                      </span>
                    )}
                  </div>
                  <div className="sidebar__chat-info">
                    <h3 className="sidebar__chat-name">{getChatName(chat)}</h3>
                    <p className="sidebar__chat-message">
                      {getLastMessagePreview(chat)}
                    </p>
                  </div>{" "}
                  <div className="sidebar__chat-meta">
                    <span className="sidebar__chat-time">
                      {formatTime(
                        chat.last_message?.message_timestamp ||
                          chat.last_message?.timestamp ||
                          chat.updated_at
                      )}
                    </span>
                    {chat.unread_count > 0 && (
                      <span className="sidebar__chat-badge">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="sidebar__empty">
                <i className="fas fa-comments"></i>
                <p>No chats found</p>
                <button
                  className="sidebar__start-chat-btn"
                  onClick={() => setActiveTab("contacts")}
                >
                  Start a new chat
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="sidebar__contacts">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="sidebar__contact-item"
                  onClick={() => startChatWithContact(contact)}
                >
                  <div className="sidebar__contact-avatar">
                    <img
                      src={contact.avatar || "https://i.pravatar.cc/150?img=7"}
                      alt={contact.username}
                    />
                    {contact.status === "online" && (
                      <span className="status-indicator"></span>
                    )}
                  </div>
                  <div className="sidebar__contact-info">
                    <h3 className="sidebar__contact-name">
                      {contact.username}
                    </h3>
                    <p className="sidebar__contact-status">
                      {contact.status || "offline"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="sidebar__no-results">No contacts found</div>
            )}
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="sidebar__search-results">
          <h3 className="sidebar__search-results-title">Search Results</h3>
          {searchResults.map((user) => (
            <div
              key={user.id}
              className="sidebar__search-result-item"
              onClick={() => startChatWithUser(user.id)}
            >
              <div className="sidebar__search-result-avatar">
                <img
                  src={user.avatar || "https://i.pravatar.cc/150?img=6"}
                  alt={user.username}
                />
              </div>
              <div className="sidebar__search-result-info">
                <h3>{user.username}</h3>
                <p>
                  {user.first_name} {user.last_name}
                </p>
              </div>
              <button className="sidebar__search-result-action">
                <i className="fas fa-comment"></i>
              </button>
            </div>
          ))}
        </div>
      )}
      {isSearching && (
        <div className="sidebar__search-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Searching for users...</p>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div
          className="sidebar__modal-overlay"
          onClick={() => setShowNewChatModal(false)}
        >
          <div className="sidebar__modal" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar__modal-header">
              <h3>
                {newChatType === "direct" ? "New Chat" : "New Group Chat"}
              </h3>
              <button
                className="sidebar__modal-close"
                onClick={() => setShowNewChatModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="sidebar__modal-content">
              <div className="sidebar__modal-tabs">
                <button
                  className={`sidebar__modal-tab ${
                    newChatType === "direct" ? "sidebar__modal-tab--active" : ""
                  }`}
                  onClick={() => setNewChatType("direct")}
                >
                  Direct Message
                </button>
                <button
                  className={`sidebar__modal-tab ${
                    newChatType === "group" ? "sidebar__modal-tab--active" : ""
                  }`}
                  onClick={() => setNewChatType("group")}
                >
                  Group Chat
                </button>
              </div>

              {newChatType === "group" && (
                <div className="form-group">
                  <label>Group Name</label>
                  <input
                    type="text"
                    value={groupChatName}
                    onChange={(e) => setGroupChatName(e.target.value)}
                    placeholder="Enter group name"
                    className="form-control"
                  />
                </div>
              )}

              <div className="form-group">
                <label>
                  Select {newChatType === "direct" ? "Contact" : "Contacts"}
                </label>{" "}
                <div className="sidebar__modal-contacts">
                  {Array.isArray(contacts) &&
                    contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`sidebar__modal-contact ${
                          selectedContacts.find((c) => c.id === contact.id)
                            ? "sidebar__modal-contact--selected"
                            : ""
                        }`}
                        onClick={() => toggleContactSelection(contact)}
                      >
                        <div className="sidebar__modal-contact-avatar">
                          <img
                            src={
                              contact.avatar ||
                              "https://i.pravatar.cc/150?img=7"
                            }
                            alt={contact.username}
                          />
                        </div>
                        <div className="sidebar__modal-contact-info">
                          <h4>{contact.username}</h4>
                          <p>{contact.status || "offline"}</p>
                        </div>
                        {selectedContacts.find((c) => c.id === contact.id) && (
                          <i className="fas fa-check-circle sidebar__modal-contact-check"></i>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              <div className="form-group">
                <label>Initial Message (Optional)</label>
                <textarea
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Type your first message..."
                  className="form-control"
                  rows={3}
                ></textarea>
              </div>
            </div>

            <div className="sidebar__modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowNewChatModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={createNewChat}
                disabled={
                  selectedContacts.length === 0 ||
                  (newChatType === "group" && !groupChatName)
                }
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
