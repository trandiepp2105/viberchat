from cassandra.cqlengine import columns
from cassandra.cqlengine.models import Model
from datetime import datetime
import uuid


class ChatMessage(Model):
    """Cassandra model for chat messages.
    Optimized for high-volume writes and reads by conversation_id.
    """    
    conversation_id = columns.UUID(primary_key=True, partition_key=True)
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
    
    # For pinned messages
    is_pinned = columns.Boolean(default=False)
    pinned_at = columns.DateTime()
    pinned_by = columns.UUID()
    
    __table_name__ = "conversation_message"
    
    @classmethod
    def create_message(cls, conversation_id, sender_id, text, has_attachment=False):
        """Helper method to create a new message"""
        # Ensure conversation_id is a UUID
        if not isinstance(conversation_id, uuid.UUID):
            try:
                conversation_id = uuid.UUID(str(conversation_id))
            except ValueError:
                # If conversion fails, create a deterministic UUID
                conversation_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"conversation-{conversation_id}")
        
        # Ensure sender_id is a UUID
        if not isinstance(sender_id, uuid.UUID):
            sender_id_str = str(sender_id)
            try:
                # Check if it's a valid UUID string
                if len(sender_id_str) == 36 and '-' in sender_id_str:
                    sender_id = uuid.UUID(sender_id_str)
                else:
                    # For integer IDs (Django default), create a deterministic UUID
                    # This ensures we can reliably map back to the Django user later
                    try:
                        int(sender_id_str)  # Check if it's an integer
                        # Use uuid5 with DNS namespace for consistent generation
                        sender_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"user-{sender_id_str}")
                    except ValueError:
                        # Not an integer or UUID - create a hash-based UUID
                        sender_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"user-{sender_id_str}")
            except ValueError:
                # Fallback to a deterministic UUID
                sender_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"user-{sender_id_str}")
        
        # For debugging, print the sender_id being used
        print(f"Creating message with sender_id UUID: {sender_id}")
        return cls.create(
            conversation_id=conversation_id,
            message_id=uuid.uuid4(),
            sender_id=sender_id,
            text=text,
            has_attachment=has_attachment
        )
    
    @classmethod
    def get_messages(cls, conversation_id, limit=50, last_message_id=None):
        """Get messages for a conversation with pagination"""
        # Debug info
        print(f"--- DEBUG: get_messages ---")
        print(f"Conversation ID: {conversation_id}")
        print(f"Limit: {limit}")
        print(f"Last message ID: {last_message_id}")
        
        # Ensure conversation_id is a UUID
        if not isinstance(conversation_id, uuid.UUID):
            try:
                conversation_id = uuid.UUID(str(conversation_id))
                print(f"Converted conversation_id to UUID: {conversation_id}")
            except ValueError:
                # If conversion fails, create a deterministic UUID
                conversation_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"conversation-{conversation_id}")
                print(f"Created deterministic UUID for conversation_id: {conversation_id}")
        
        if last_message_id:
            # Ensure last_message_id is a UUID
            if not isinstance(last_message_id, uuid.UUID):
                try:
                    last_message_id = uuid.UUID(str(last_message_id))
                except ValueError:
                    # If conversion fails, create a deterministic UUID
                    last_message_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"msg-{last_message_id}")
            
            # Query with pagination (starting after last_message_id)
            query = cls.objects.filter(
                conversation_id=conversation_id,
                message_id__lt=last_message_id
            ).limit(limit)
        else:
            # Query the most recent messages
            query = cls.objects.filter(
                conversation_id=conversation_id
            ).limit(limit)
        
        # Execute query and return results
        try:
            messages = list(query)
            print(f"Query successful, found {len(messages)} messages")
            return messages
        except Exception as e:
            print(f"Error retrieving messages: {str(e)}")
            return []
    
    @classmethod
    def mark_as_read(cls, conversation_id, message_id):
        """Mark a message as read"""
        try:
            message = cls.objects.get(conversation_id=conversation_id, message_id=message_id)
            message.is_read = True
            message.read_at = datetime.now()
            message.save()
            return message
        except Exception as e:
            print(f"Error marking message as read: {str(e)}")
            return None
    @classmethod
    def edit_message(cls, conversation_id, message_id, new_text):
        """Edit a message's text"""
        try:
            message = cls.objects.get(conversation_id=conversation_id, message_id=message_id)
            message.text = new_text
            message.is_edited = True
            message.edited_at = datetime.now()
            message.save()
            return message
        except Exception as e:
            print(f"Error editing message: {str(e)}")
            return None
    
    @classmethod
    def delete_message(cls, conversation_id, message_id):
        """Soft delete a message"""
        try:
            message = cls.objects.get(conversation_id=conversation_id, message_id=message_id)
            message.is_deleted = True
            message.deleted_at = datetime.now()
            message.save()
            return message
        except Exception as e:
            print(f"Error deleting message: {str(e)}")
            return None
            
    @classmethod
    def pin_message(cls, conversation_id, message_id, user_id):
        """Pin a message in a conversation"""
        try:
            # Ensure IDs are UUID objects
            if not isinstance(conversation_id, uuid.UUID):
                conversation_id = uuid.UUID(str(conversation_id))
            if not isinstance(message_id, uuid.UUID):
                message_id = uuid.UUID(str(message_id))
            if not isinstance(user_id, uuid.UUID):
                user_id_str = str(user_id)
                try:
                    if len(user_id_str) == 36 and '-' in user_id_str:
                        user_id = uuid.UUID(user_id_str)
                    else:
                        user_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"user-{user_id_str}")
                except ValueError:
                    user_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"user-{user_id_str}")
            
            # Check if message exists
            message = cls.objects.get(conversation_id=conversation_id, message_id=message_id)
            message.is_pinned = True
            message.pinned_at = datetime.now()
            message.pinned_by = user_id
            message.save()
            return message
        except Exception as e:
            print(f"Error pinning message: {str(e)}")
            return None
            
    @classmethod
    def unpin_message(cls, conversation_id, message_id):
        """Unpin a message in a conversation"""
        try:
            # Ensure IDs are UUID objects
            if not isinstance(conversation_id, uuid.UUID):
                conversation_id = uuid.UUID(str(conversation_id))
            if not isinstance(message_id, uuid.UUID):
                message_id = uuid.UUID(str(message_id))
                
            # Check if message exists
            message = cls.objects.get(conversation_id=conversation_id, message_id=message_id)
            message.is_pinned = False
            message.save()
            return message
        except Exception as e:
            print(f"Error unpinning message: {str(e)}")
            return None
            
    @classmethod
    def get_pinned_messages(cls, conversation_id, limit=10):
        """Get all pinned messages for a conversation"""
        try:
            # Ensure conversation_id is a UUID
            if not isinstance(conversation_id, uuid.UUID):
                conversation_id = uuid.UUID(str(conversation_id))
                
            # Query for pinned messages
            query = cls.objects.filter(
                conversation_id=conversation_id,
                is_pinned=True
            ).allow_filtering().limit(limit)
            
            return list(query)
        except Exception as e:
            print(f"Error getting pinned messages: {str(e)}")
            return []
