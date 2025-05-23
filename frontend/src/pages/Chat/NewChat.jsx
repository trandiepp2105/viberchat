import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Chat.scss";
import ConversationListColumn from "../../components/MessengerLayout/ConversationListColumn";
import MessageColumn from "../../components/MessengerLayout/MessageColumn";
import ContextualInfoColumn from "../../components/MessengerLayout/ContextualInfoColumn";
import "../../components/MessengerLayout/MessengerLayout.scss";

import { chatAPI, userAPI } from "../../services";

const NewChat = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // States for managing visibility of columns
  const [showContextualInfo, setShowContextualInfo] = useState(true);
  const [showConversationList, setShowConversationList] = useState(
    window.innerWidth > 768
  );

  // Fetch user contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getContacts();
        setContacts(response.data || []);
      } catch (err) {
        console.error("Error fetching contacts:", err);
        setError("Failed to load contacts");
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  // Handle creating a new chat
  const handleCreateChat = async (
    participantIds,
    isGroup,
    groupName,
    initialMessage
  ) => {
    try {
      setLoading(true);
      let response;

      if (isGroup) {
        response = await chatAPI.createGroupConversation(
          participantIds,
          groupName,
          initialMessage
        );
      } else {
        // Direct conversation with first participant
        response = await chatAPI.startDirectConversation(
          participantIds[0],
          initialMessage
        );
      }

      const newConversationId = response.data.id;
      navigate(`/chat/${newConversationId}`);
    } catch (err) {
      console.error("Error creating conversation:", err);
      setError("Failed to create conversation");
      setLoading(false);
    }
  };

  // Handle selecting an existing chat
  const handleSelectChat = (chatId) => {
    navigate(`/chat/${chatId}`);
  };

  // Toggle sidebar for mobile
  const handleToggleSidebar = () => {
    setShowContextualInfo(!showContextualInfo);
  };

  // Toggle conversation list for mobile
  const handleToggleMainSidebar = () => {
    setShowConversationList(!showConversationList);
  };
  return (
    <div className="messenger-layout">
      {/* Left Column - Conversations List */}
      <div
        className={`messenger-layout__column messenger-layout__column--left ${
          showConversationList ? "show" : "hide-on-mobile"
        }`}
      >
        <ConversationListColumn
          chats={[]}
          contacts={contacts}
          onSelectChat={handleSelectChat}
          onCreateChat={handleCreateChat}
          className="full-height"
        />
      </div>

      {/* Middle Column - Message Area */}
      <div className="messenger-layout__column messenger-layout__column--middle">
        <MessageColumn
          selectedChat={null}
          messages={[]}
          loading={loading}
          error={error}
          onToggleSidebar={handleToggleSidebar}
          onToggleConversationList={handleToggleMainSidebar}
          onToggleContextualInfo={handleToggleSidebar}
          emptyStateMessage="Select a contact to start a new conversation"
        />
      </div>

      {/* Right Column - Contextual Info */}
      <div
        className={`messenger-layout__column messenger-layout__column--right ${
          showContextualInfo ? "show" : "hide"
        }`}
      >
        <ContextualInfoColumn onClose={handleToggleSidebar} />
      </div>
    </div>
  );
};

export default NewChat;
