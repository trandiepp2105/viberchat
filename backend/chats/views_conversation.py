from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models_conversation import Conversation
from .serializers_conversation import ConversationSerializer, MessageSerializer
from .cassandra_models_conversation import ChatMessage
from .conversation_utils import get_or_create_direct_conversation, create_group_conversation
import uuid

User = get_user_model()

class ConversationViewSet(viewsets.ModelViewSet):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only return conversations where the user is a participant
        return Conversation.objects.filter(participants=self.request.user).order_by('-updated_at')
    
    @action(detail=False, methods=['post'])
    def start_direct_conversation(self, request):
        """Start or continue a direct conversation with another user"""
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            other_user = User.objects.get(id=user_id)
            
            # Don't allow conversation with yourself
            if other_user.id == request.user.id:
                return Response({"error": "Cannot start conversation with yourself"}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
            # Get or create a direct conversation
            conversation, created = get_or_create_direct_conversation(request.user, other_user)
            
            serializer = self.get_serializer(conversation)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def create_group_conversation(self, request):
        """Create a new group conversation"""
        name = request.data.get('name')
        participants = request.data.get('participants', [])
        
        if not name:
            return Response({"error": "name is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not participants:
            return Response({"error": "At least one participant is required"}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create a new group conversation
            conversation = create_group_conversation(request.user, name, participants)
            
            serializer = self.get_serializer(conversation)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages for a conversation"""
        try:
            # Ensure conversation exists and user is a participant
            conversation = self.get_object()
            
            # Get messages from Cassandra
            last_message_id = request.query_params.get('last_message_id')
            limit = int(request.query_params.get('limit', 50))
            
            if last_message_id:
                messages = ChatMessage.get_messages(
                    conversation_id=uuid.UUID(pk),
                    last_message_id=uuid.UUID(last_message_id),
                    limit=limit
                )
            else:
                messages = ChatMessage.get_messages(
                    conversation_id=uuid.UUID(pk),
                    limit=limit
                )
            
            # Convert to list for serialization
            message_list = []
            for msg in messages:
                message_list.append({
                    'id': msg.message_id,
                    'conversation_id': msg.conversation_id,
                    'sender_id': msg.sender_id,
                    'text': msg.text,
                    'timestamp': msg.timestamp,
                    'is_read': msg.is_read,
                    'read_at': msg.read_at,
                    'is_edited': msg.is_edited,
                    'edited_at': msg.edited_at,
                    'is_deleted': msg.is_deleted,
                    'deleted_at': msg.deleted_at
                })
            
            serializer = MessageSerializer(message_list, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message in a conversation"""
        text = request.data.get('text')
        
        if not text:
            return Response({"error": "text is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Ensure conversation exists and user is a participant
            conversation = self.get_object()
            
            # Create message in Cassandra
            message = ChatMessage.create_message(
                conversation_id=uuid.UUID(pk),
                sender_id=request.user.id,
                text=text
            )
            
            # Update conversation's updated_at
            conversation.updated_at = message.timestamp
            conversation.save(update_fields=['updated_at'])
            
            # Return the created message
            message_data = {
                'message_id': message.message_id,
                'sender_id': message.sender_id,
                'text': message.text,
                'message_timestamp': message.timestamp
            }
            
            return Response(message_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def edit_message(self, request, pk=None):
        """Edit a message in a conversation"""
        message_id = request.data.get('message_id')
        new_text = request.data.get('text')
        
        if not message_id or not new_text:
            return Response({"error": "message_id and text are required"}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Ensure conversation exists and user is a participant
            conversation = self.get_object()
            
            # Check if the message exists and can be edited by this user
            message = ChatMessage.objects.get(
                conversation_id=uuid.UUID(pk),
                message_id=uuid.UUID(message_id)
            )
            
            # Check if current user is the sender
            if str(message.sender_id) != str(request.user.id):
                return Response({"error": "You can only edit your own messages"}, 
                               status=status.HTTP_403_FORBIDDEN)
            
            # Edit the message
            updated_message = ChatMessage.edit_message(
                conversation_id=uuid.UUID(pk),
                message_id=uuid.UUID(message_id),
                new_text=new_text
            )
            
            # Return the updated message
            message_data = {
                'message_id': updated_message.message_id,
                'text': updated_message.text,
                'edited_at': updated_message.edited_at
            }
            
            return Response(message_data)
        except ChatMessage.DoesNotExist:
            return Response({"error": "Message not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def delete_message(self, request, pk=None):
        """Delete a message in a conversation"""
        message_id = request.data.get('message_id')
        
        if not message_id:
            return Response({"error": "message_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Ensure conversation exists and user is a participant
            conversation = self.get_object()
            
            # Check if the message exists and can be deleted by this user
            message = ChatMessage.objects.get(
                conversation_id=uuid.UUID(pk),
                message_id=uuid.UUID(message_id)
            )
            
            # Check if current user is the sender
            if str(message.sender_id) != str(request.user.id):
                return Response({"error": "You can only delete your own messages"}, 
                               status=status.HTTP_403_FORBIDDEN)
            
            # Delete the message
            ChatMessage.delete_message(
                conversation_id=uuid.UUID(pk),
                message_id=uuid.UUID(message_id)
            )
            
            return Response({"status": "Message deleted"})
        except ChatMessage.DoesNotExist:
            return Response({"error": "Message not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def mark_messages_read(self, request, pk=None):
        """Mark messages as read in a conversation"""
        message_ids = request.data.get('message_ids', [])
        
        if not message_ids:
            return Response({"error": "message_ids is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Ensure conversation exists and user is a participant
            conversation = self.get_object()
            
            # Mark each message as read
            for message_id in message_ids:
                ChatMessage.mark_as_read(
                    conversation_id=uuid.UUID(pk),
                    message_id=uuid.UUID(message_id)
                )
            
            return Response({"status": "Messages marked as read"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
