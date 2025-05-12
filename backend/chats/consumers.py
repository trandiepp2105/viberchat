import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models_conversation import Conversation
from .cassandra_models_conversation import ChatMessage
import uuid

User = get_user_model()


class ConversationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        print("\n===== DEBUG: WebSocket Consumer xử lý kết nối =====")
        print(f"User: {self.user}, Anonymous: {self.user.is_anonymous}")
        
        # Anonymous users can't connect
        if self.user.is_anonymous:
            print("WebSocket connection rejected: Anonymous user")
            await self.close()
            return
            
        # Get conversation ID from URL
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        print(f"Conversation ID: {self.conversation_id}")
        
        # Check if user is a participant in this conversation
        if not await self.is_participant():
            print(f"WebSocket connection rejected: User {self.user.id} is not a participant in conversation {self.conversation_id}")
            await self.close()
            return
            
        # Create a unique group name for this conversation
        self.room_group_name = f'conversation_{self.conversation_id}'
        
        # Join the group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        # Accept the connection
        await self.accept()
        print(f"WebSocket connection accepted for user {self.user.id} in conversation {self.conversation_id}")
        
        # Update user status to online
        await self.update_user_status('online')

    async def disconnect(self, close_code):
        # Leave the group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            
        # Update user status to offline
        await self.update_user_status('offline')
        
    async def receive(self, text_data):
        print("\n===== DEBUG: WebSocket Consumer nhận tin nhắn =====")
        print(f"WebSocket received data: {text_data}")
        
        data = json.loads(text_data)
        message_type = data.get('type', 'message')
        print(f"Loại tin nhắn: {message_type}")
        
        if message_type == 'message':
            print("Xử lý tin nhắn chat mới")
            # Process a new chat message
            await self.handle_chat_message(data)
        elif message_type == 'typing':
            print("Xử lý typing indicator")
            # Process typing indicator
            await self.handle_typing_indicator(data)        
        elif message_type == 'read':
            print("Xử lý đánh dấu đã đọc")
            # Process read receipts
            await self.handle_read_receipt(data)
        elif message_type == 'edit':
            print("Xử lý chỉnh sửa tin nhắn")
            # Process message edits
            await self.handle_edit_message(data)
        elif message_type == 'delete':
            print("Xử lý xóa tin nhắn")
            # Process message deletions
            await self.handle_delete_message(data)

    async def handle_chat_message(self, data):
        print("===== DEBUG: Lưu và broadcast tin nhắn =====")
        text = data.get('text', '')
        print(f"Nội dung tin nhắn: {text}")
        
        # Store message in Cassandra
        message = await self.save_message(text)
        print(f"Đã lưu tin nhắn với ID: {message.message_id}")
        
        # Broadcast message to group
        message_data = {
            'type': 'chat_message',
            'message': {
                'id': str(message.message_id),
                'sender_id': str(message.sender_id),
                'text': message.text,
                'timestamp': message.timestamp.isoformat(),
            }
        }
        print(f"Broadcast tin nhắn tới group {self.room_group_name}: {message_data}")
        
        await self.channel_layer.group_send(
            self.room_group_name,
            message_data
        )

    async def handle_typing_indicator(self, data):
        # Broadcast typing indicator to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user_id': str(self.user.id),
                'is_typing': data.get('is_typing', False)
            }
        )

    async def handle_read_receipt(self, data):
        message_ids = data.get('message_ids', [])
        
        # Mark messages as read
        if message_ids:
            await self.mark_messages_as_read(message_ids)
            
            # Broadcast read receipt to group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'read_receipt',
                    'user_id': str(self.user.id),
                    'message_ids': message_ids
                }
            )

    async def handle_edit_message(self, data):
        message_id = data.get('message_id')
        new_text = data.get('text')
        
        if not message_id or not new_text:
            return
            
        # Check if the message exists and user is the sender
        if not await self.can_modify_message(message_id):
            return
            
        # Update message in database
        message = await self.edit_message(message_id, new_text)
        
        # Broadcast edited message to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'edited_message',
                'message_id': str(message.message_id),
                'text': message.text,
                'user_id': str(self.user.id),
                'timestamp': message.edited_at.isoformat()
            }
        )
        
    async def handle_delete_message(self, data):
        message_id = data.get('message_id')
        
        if not message_id:
            return
            
        # Check if the message exists and user is the sender
        if not await self.can_modify_message(message_id):
            return
            
        # Delete message in database
        message = await self.delete_message(message_id)
        
        # Broadcast deleted message to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'deleted_message',
                'message_id': str(message.message_id),
                'user_id': str(self.user.id)
            }
        )
        
    async def chat_message(self, event):
        # Send message to WebSocket
        print("===== DEBUG: Gửi tin nhắn tới WebSocket client =====")
        print(f"Event: {event}")
        
        message_data = {
            'type': 'message',
            'message': event['message']
        }
        print(f"Data gửi đi: {message_data}")
        
        await self.send(text_data=json.dumps(message_data))

    async def typing_indicator(self, event):
        # Send typing indicator to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'is_typing': event['is_typing']
        }))

    async def read_receipt(self, event):
        # Send read receipt to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'read',
            'user_id': event['user_id'],
            'message_ids': event['message_ids']
        }))

    async def edited_message(self, event):
        # Send edited message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'edited',
            'message_id': event['message_id'],
            'text': event['text'],
            'user_id': event['user_id'],
            'timestamp': event['timestamp']
        }))
        
    async def deleted_message(self, event):
        # Send deleted message notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'deleted',
            'message_id': event['message_id'],
            'user_id': event['user_id']
        }))

    @database_sync_to_async
    def is_participant(self):
        try:
            print(f"Checking if user {self.user.id} is participant in conversation {self.conversation_id}")
            
            # Try to parse the UUID
            conversation_id = uuid.UUID(self.conversation_id)
            print(f"Valid UUID format: {conversation_id}")
            
            # Check if the conversation exists
            conversation_exists = Conversation.objects.filter(id=conversation_id).exists()
            if not conversation_exists:
                print(f"Conversation {conversation_id} does not exist")
                return False
                
            # Now check if user is a participant
            is_participant = Conversation.objects.filter(
                id=conversation_id,
                participants=self.user
            ).exists()
            
            print(f"User {self.user.id} is{' ' if is_participant else ' not '}a participant in conversation {conversation_id}")
            return is_participant
            
        except ValueError as e:
            print(f"Invalid UUID format: {self.conversation_id} - {str(e)}")
            return False
        except Exception as e:
            print(f"Error checking participant status: {str(e)}")
            return False

    @database_sync_to_async
    def save_message(self, text):
        message = ChatMessage.create_message(
            conversation_id=uuid.UUID(self.conversation_id),
            sender_id=self.user.id,
            text=text
        )
        
        # Update the Conversation's updated_at timestamp
        Conversation.objects.filter(id=uuid.UUID(self.conversation_id)).update(
            updated_at=timezone.now()
        )
        
        return message
    
    @database_sync_to_async
    def mark_messages_as_read(self, message_ids):
        for message_id in message_ids:
            try:
                ChatMessage.mark_as_read(
                    conversation_id=uuid.UUID(self.conversation_id),
                    message_id=uuid.UUID(message_id)
                )
            except Exception as e:
                print(f"Error marking message {message_id} as read: {str(e)}")
    
    @database_sync_to_async
    def update_user_status(self, status):
        User.objects.filter(id=self.user.id).update(
            status=status,
            last_active=timezone.now()
        )
        
    @database_sync_to_async
    def can_modify_message(self, message_id):
        """Check if the user can modify (edit or delete) this message"""
        try:
            message = ChatMessage.objects.get(
                conversation_id=uuid.UUID(self.conversation_id),
                message_id=uuid.UUID(message_id)
            )
            # User can only modify their own messages
            return message.sender_id == self.user.id
        except Exception as e:
            print(f"Error checking if user can modify message: {str(e)}")
            return False
    
    @database_sync_to_async
    def edit_message(self, message_id, new_text):
        """Edit a message's text"""
        return ChatMessage.edit_message(
            conversation_id=uuid.UUID(self.conversation_id),
            message_id=uuid.UUID(message_id),
            new_text=new_text
        )
    
    @database_sync_to_async
    def delete_message(self, message_id):
        """Soft delete a message"""
        return ChatMessage.delete_message(
            conversation_id=uuid.UUID(self.conversation_id),
            message_id=uuid.UUID(message_id)
        )
