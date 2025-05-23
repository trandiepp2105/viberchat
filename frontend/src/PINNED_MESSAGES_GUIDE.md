// Tài liệu này hướng dẫn cách làm việc với tính năng tin nhắn ghim trong ViberChat

## Về Tính Năng Tin Nhắn Ghim

Tính năng ghim tin nhắn cho phép người dùng ghim các tin nhắn quan trọng trong một cuộc trò chuyện để dễ dàng tìm thấy chúng sau này. Khi một tin nhắn được ghim:

- Nó sẽ hiển thị biểu tượng ghim
- Nó sẽ xuất hiện trong danh sách "Pinned Messages" trong cuộc trò chuyện
- Tất cả người dùng trong cuộc trò chuyện có thể xem tin nhắn đã ghim

## API Tin Nhắn Ghim

### Ghim một tin nhắn

```javascript
// Ghim một tin nhắn
await chatAPI.pinMessage(conversationId, messageId);
```

### Gỡ ghim một tin nhắn

```javascript
// Gỡ ghim một tin nhắn
await chatAPI.unpinMessage(conversationId, messageId);
```

### Lấy danh sách tin nhắn đã ghim

```javascript
// Lấy danh sách tin nhắn đã ghim
const response = await chatAPI.getPinnedMessages(conversationId);
const pinnedMessages = response.data;
```

## Sự Kiện WebSocket

Khi một tin nhắn được ghim hoặc gỡ ghim, các sự kiện WebSocket tương ứng sẽ được gửi đến tất cả các client trong cuộc trò chuyện:

### Sự kiện "pinned"

```javascript
{
  "type": "pinned",
  "message_id": "123",
  "user_id": "456",
  "pinned_at": "2025-05-10T12:30:45.123Z"
}
```

### Sự kiện "unpinned"

```javascript
{
  "type": "unpinned",
  "message_id": "123",
  "user_id": "456"
}
```

## Xử Lý Trong UI

### Hiển thị Tin Nhắn Ghim

Tin nhắn ghim được hiển thị với biểu tượng ghim và có thể được truy cập từ phần trên cùng của cửa sổ chat. UI bao gồm:

1. Biểu tượng để hiển thị số lượng tin nhắn đã ghim
2. Danh sách tin nhắn đã ghim khi người dùng nhấp vào
3. Biểu tượng ghim trên các tin nhắn riêng lẻ

### Quy Trình Ghim/Gỡ Ghim

1. Người dùng nhấp vào menu tùy chọn của tin nhắn
2. Chọn "Ghim tin nhắn" hoặc "Gỡ ghim"
3. Gửi yêu cầu đến API
4. Cập nhật UI ngay lập tức
5. Lắng nghe sự kiện WebSocket để cập nhật cho tất cả người dùng

## Thử Nghiệm Tính Năng

### Ghim Tin Nhắn

1. Mở một cuộc trò chuyện
2. Nhấp vào menu tùy chọn trên một tin nhắn
3. Chọn "Ghim tin nhắn"
4. Xác minh rằng biểu tượng ghim xuất hiện trên tin nhắn
5. Xác minh rằng tin nhắn đã ghim xuất hiện trong danh sách tin nhắn đã ghim

### Gỡ Ghim Tin Nhắn

1. Mở một cuộc trò chuyện có tin nhắn đã ghim
2. Nhấp vào menu tùy chọn trên tin nhắn đã ghim
3. Chọn "Gỡ ghim"
4. Xác minh rằng biểu tượng ghim biến mất khỏi tin nhắn
5. Xác minh rằng tin nhắn không còn trong danh sách tin nhắn đã ghim
