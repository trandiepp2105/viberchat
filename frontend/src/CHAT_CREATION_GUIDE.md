# Hướng Dẫn Tạo Chat - Đã Cập Nhật Cho Mô Hình Conversation

Tài liệu này hướng dẫn cách tạo cuộc trò chuyện trong ViberChat với mô hình Conversation.

## Cuộc Trò Chuyện Trực Tiếp (1-1)

Để tạo cuộc trò chuyện trực tiếp với một người dùng khác:

```javascript
// Tạo cuộc trò chuyện trực tiếp với một người dùng
const startDirectChat = async (participantId, initialMessage = "") => {
  try {
    const response = await chatAPI.startDirectConversation(
      participantId,
      initialMessage
    );

    // response.data chứa thông tin cuộc trò chuyện mới
    const newChat = response.data;

    // Cập nhật danh sách chats
    setChats((prev) => [...prev, newChat]);

    // Chọn cuộc trò chuyện mới tạo
    setSelectedChatId(newChat.id);

    return newChat;
  } catch (error) {
    console.error("Error starting direct conversation:", error);
    throw error;
  }
};
```

## Tạo Nhóm Chat

Để tạo nhóm chat với nhiều người dùng:

```javascript
// Tạo nhóm chat với nhiều người dùng
const createGroupChat = async (
  participantIds,
  groupName,
  initialMessage = ""
) => {
  try {
    const response = await chatAPI.createGroupConversation(
      participantIds,
      groupName,
      initialMessage
    );

    // response.data chứa thông tin nhóm chat mới
    const newGroupChat = response.data;

    // Cập nhật danh sách chats
    setChats((prev) => [...prev, newGroupChat]);

    // Chọn nhóm chat mới tạo
    setSelectedChatId(newGroupChat.id);

    return newGroupChat;
  } catch (error) {
    console.error("Error creating group conversation:", error);
    throw error;
  }
};
```

## Xử Lý Tin Nhắn Ghim

```javascript
// Ghim một tin nhắn
const pinMessage = async (messageId) => {
  try {
    await chatAPI.pinMessage(selectedChatId, messageId);

    // Cập nhật trạng thái tin nhắn trong UI
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        (msg.id || msg.message_id) === messageId
          ? { ...msg, is_pinned: true, pinned_at: new Date().toISOString() }
          : msg
      )
    );
  } catch (error) {
    console.error("Error pinning message:", error);
  }
};

// Gỡ ghim một tin nhắn
const unpinMessage = async (messageId) => {
  try {
    await chatAPI.unpinMessage(selectedChatId, messageId);

    // Cập nhật trạng thái tin nhắn trong UI
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        (msg.id || msg.message_id) === messageId
          ? { ...msg, is_pinned: false }
          : msg
      )
    );
  } catch (error) {
    console.error("Error unpinning message:", error);
  }
};

// Lấy danh sách tin nhắn ghim
const fetchPinnedMessages = async () => {
  try {
    const response = await chatAPI.getPinnedMessages(selectedChatId);

    // Cập nhật state cho tin nhắn ghim
    setPinnedMessages(response.data);
  } catch (error) {
    console.error("Error fetching pinned messages:", error);
  }
};
```

## Kết Nối WebSocket

```javascript
// Kết nối WebSocket cho cuộc trò chuyện
useEffect(() => {
  if (selectedChatId) {
    // Tạo WebSocket mới
    const wsService = new WebSocketService();

    // Kết nối đến WebSocket cho conversation hiện tại
    wsService
      .connect(selectedChatId)
      .then((ws) => {
        setWebSocket(ws);

        // Thêm các handler cho các sự kiện
        ws.addMessageHandler(handleNewMessage);
        ws.addTypingHandler(handleTypingIndicator);
        ws.addPinnedHandler(handleMessagePinned);
        ws.addUnpinnedHandler(handleMessageUnpinned);
        // ... Thêm các handler khác
      })
      .catch((err) => {
        console.error("Error connecting to WebSocket:", err);
      });

    // Cleanup khi component unmount hoặc selectedChatId thay đổi
    return () => {
      if (wsService) {
        wsService.disconnect();
      }
    };
  }
}, [selectedChatId]);
```
