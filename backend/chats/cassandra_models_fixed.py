from cassandra.cqlengine import columns
from cassandra.cqlengine.models import Model
from datetime import datetime
import uuid


class ChatMessage(Model):
    """Cassandra model for chat messages.
    Optimized for high-volume writes and reads by chat_session_id.
    """
    chat_session_id = columns.UUID(primary_key=True, partition_key=True)
    message_id = columns.UUID(primary_key=True, clustering_order="DESC")
    sender_id = columns.UUID(required=True)
    text = columns.Text()
    message_timestamp = columns.DateTime(default=datetime.now)
    
    # For tracking if message is read
    is_read = columns.Boolean(default=False)
    read_at = columns.DateTime()
    
    # For edited messages
    is_edited = columns.Boolean(default=False)
    edited_at = columns.DateTime()
    
    # If message has attachment
    has_attachment = columns.Boolean(default=False)
    
    # For deleted messages - soft delete
    is_deleted = columns.Boolean(default=False)
    deleted_at = columns.DateTime()
    
    class Meta:
        table_name = "chat_message"
    
    @classmethod
    def create_message(cls, chat_session_id, sender_id, text, has_attachment=False):
        """Helper method to create a new message"""
        # Ensure chat_session_id is a UUID
        if not isinstance(chat_session_id, uuid.UUID):
            try:
                chat_session_id = uuid.UUID(str(chat_session_id))
            except ValueError:
                # If conversion fails, create a deterministic UUID
                chat_session_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"chat-{chat_session_id}")
        
        # Ensure sender_id is a UUID 
        if not isinstance(sender_id, uuid.UUID):
            sender_id_str = str(sender_id)
            try:
                # Check if it's a valid UUID string
                if len(sender_id_str) == 36 and '-' in sender_id_str:
                    sender_id = uuid.UUID(sender_id_str)
                else:
                    # Create a deterministic UUID for numeric IDs
                    sender_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"user-{sender_id_str}")
            except ValueError:
                # Fallback to a deterministic UUID
                sender_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"user-{sender_id_str}")
        
        return cls.create(
            chat_session_id=chat_session_id,
            message_id=uuid.uuid4(),
            sender_id=sender_id,
            text=text,
            has_attachment=has_attachment
        )
    
    @classmethod
    def get_messages(cls, chat_session_id, limit=50, last_message_id=None):
        """Get messages for a chat session with pagination"""
        # Ensure chat_session_id is a UUID
        if not isinstance(chat_session_id, uuid.UUID):
            try:
                chat_session_id = uuid.UUID(str(chat_session_id))
            except ValueError:
                # If conversion fails, create a deterministic UUID
                chat_session_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"chat-{chat_session_id}")
        
        if last_message_id:
            # Ensure last_message_id is a UUID
            if not isinstance(last_message_id, uuid.UUID):
                try:
                    last_message_id = uuid.UUID(str(last_message_id))
                except ValueError:
                    # If conversion fails, create a deterministic UUID
                    last_message_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"msg-{last_message_id}")
                    
            return list(cls.objects.filter(
                chat_session_id=chat_session_id,
                message_id__lt=last_message_id
            ).limit(limit))
        
        return list(cls.objects.filter(
            chat_session_id=chat_session_id
        ).limit(limit))
        
    @classmethod
    def get_unread_messages(cls, chat_session_id, exclude_sender_id=None):
        """
        Get unread messages for a chat session, optionally excluding messages from a specific sender.
        Note: This might be inefficient for large result sets since we have to filter in Python.
        """
        # Ensure chat_session_id is a UUID
        if not isinstance(chat_session_id, uuid.UUID):
            try:
                chat_session_id = uuid.UUID(str(chat_session_id))
            except ValueError:
                # If conversion fails, create a deterministic UUID
                chat_session_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"chat-{chat_session_id}")
                
        # Get all messages for this chat session
        messages = list(cls.objects.filter(
            chat_session_id=chat_session_id
        ))
        
        # Filter for unread messages
        unread_messages = [msg for msg in messages if not msg.is_read]
        
        # If exclude_sender_id is provided, exclude messages from that sender
        if exclude_sender_id:
            # Ensure exclude_sender_id is a UUID
            if not isinstance(exclude_sender_id, uuid.UUID):
                try:
                    exclude_sender_id = uuid.UUID(str(exclude_sender_id))
                except ValueError:
                    # If not a valid UUID, create a deterministic one
                    exclude_sender_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"user-{exclude_sender_id}")
                    
            return [msg for msg in unread_messages if msg.sender_id != exclude_sender_id]
            
        return unread_messages
    
    @classmethod
    def mark_as_read(cls, chat_session_id, message_id, read_at=None):
        """Mark a message as read"""
        # Ensure chat_session_id and message_id are UUIDs
        if not isinstance(chat_session_id, uuid.UUID):
            try:
                chat_session_id = uuid.UUID(str(chat_session_id))
            except ValueError:
                # If conversion fails, create a deterministic UUID
                chat_session_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"chat-{chat_session_id}")
                
        if not isinstance(message_id, uuid.UUID):
            try:
                message_id = uuid.UUID(str(message_id))
            except ValueError:
                # If conversion fails, create a deterministic UUID
                message_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"msg-{message_id}")
        
        if read_at is None:
            read_at = datetime.now()
            
        message = cls.objects.get(chat_session_id=chat_session_id, message_id=message_id)
        message.is_read = True
        message.read_at = read_at
        message.save()
        return message
    
    @classmethod
    def delete_message(cls, chat_session_id, message_id):
        """Soft delete a message"""
        # Ensure chat_session_id and message_id are UUIDs
        if not isinstance(chat_session_id, uuid.UUID):
            try:
                chat_session_id = uuid.UUID(str(chat_session_id))
            except ValueError:
                # If conversion fails, create a deterministic UUID
                chat_session_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"chat-{chat_session_id}")
                
        if not isinstance(message_id, uuid.UUID):
            try:
                message_id = uuid.UUID(str(message_id))
            except ValueError:
                # If conversion fails, create a deterministic UUID
                message_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"msg-{message_id}")
        
        message = cls.objects.get(chat_session_id=chat_session_id, message_id=message_id)
        message.is_deleted = True
        message.deleted_at = datetime.now()
        message.save()
        return message
        
    @classmethod
    def edit_message(cls, chat_session_id, message_id, new_text):
        """Edit a message's text and mark it as edited"""
        # Ensure chat_session_id and message_id are UUIDs
        if not isinstance(chat_session_id, uuid.UUID):
            try:
                chat_session_id = uuid.UUID(str(chat_session_id))
            except ValueError:
                # If conversion fails, create a deterministic UUID
                chat_session_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"chat-{chat_session_id}")
                
        if not isinstance(message_id, uuid.UUID):
            try:
                message_id = uuid.UUID(str(message_id))
            except ValueError:
                # If conversion fails, create a deterministic UUID
                message_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"msg-{message_id}")
                
        message = cls.objects.get(chat_session_id=chat_session_id, message_id=message_id)
        message.text = new_text
        message.is_edited = True
        message.edited_at = datetime.now()
        message.save()
        return message
