# Frontend Integration Guide

This guide helps you update the React frontend to work with the new Conversation model.

## API Service Updates

### 1. Update API Endpoints

```javascript
// Old
const getChatSessions = () => {
  return api.get("/api/chats/sessions/");
};

// New
const getConversations = () => {
  return api.get("/api/chats/conversations/");
};
```

### 2. Starting Direct Conversations

```javascript
// Old
const startChat = (userId) => {
  return api.post("/api/chats/sessions/", { participants: [userId] });
};

// New
const startDirectConversation = (userId) => {
  return api.post("/api/chats/conversations/start_direct_conversation/", {
    user_id: userId,
  });
};
```

### 3. Creating Group Chats

```javascript
// Old
const createGroupChat = (name, participantIds) => {
  return api.post("/api/chats/sessions/", {
    name,
    participants: participantIds,
    is_group_chat: true,
  });
};

// New
const createGroupConversation = (name, participantIds) => {
  return api.post("/api/chats/conversations/create_group_conversation/", {
    name,
    participants: participantIds,
  });
};
```

### 4. Getting Messages

```javascript
// Old
const getMessages = (chatSessionId, lastMessageId = null, limit = 50) => {
  let url = `/api/chats/sessions/${chatSessionId}/messages/`;
  if (lastMessageId) {
    url += `?last_message_id=${lastMessageId}&limit=${limit}`;
  }
  return api.get(url);
};

// New
const getMessages = (conversationId, lastMessageId = null, limit = 50) => {
  let url = `/api/chats/conversations/${conversationId}/messages/`;
  if (lastMessageId) {
    url += `?last_message_id=${lastMessageId}&limit=${limit}`;
  }
  return api.get(url);
};
```

## WebSocket Connection Updates

### 1. Connection URL

```javascript
// Old
const connectWebSocket = (chatSessionId) => {
  const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(
    `${wsScheme}://${window.location.host}/ws/chat/${chatSessionId}/`
  );
  return socket;
};

// New
const connectWebSocket = (conversationId) => {
  const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(
    `${wsScheme}://${window.location.host}/ws/conversation/${conversationId}/`
  );
  return socket;
};
```

### 2. Message Format (Remains Similar)

Incoming messages follow the same structure, but have `conversation_id` instead of `chat_session_id`.

## UI Changes

### 1. Direct vs Group Conversation Display

You can use the `is_direct` and `is_group` flags to display different UI for each type:

```jsx
{
  conversation.is_direct ? (
    <DirectConversationItem conversation={conversation} />
  ) : (
    <GroupConversationItem conversation={conversation} />
  );
}
```

### 2. Conversation List Rendering

For direct conversations, you may want to show the other participant's name instead of the conversation name:

```jsx
const getConversationDisplayName = (conversation, currentUserId) => {
  if (conversation.is_direct) {
    // Find the other participant (not current user)
    const otherParticipant = conversation.participants.find(
      (p) => p.id !== currentUserId
    );
    return otherParticipant
      ? `${otherParticipant.first_name} ${otherParticipant.last_name}`
      : "Direct Message";
  }
  // For group chats, use the conversation name
  return conversation.name;
};
```

## Migration Period

During the migration period, both old and new endpoints will work. After the migration is complete, only the new endpoints will be available.
