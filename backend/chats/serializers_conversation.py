from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models_conversation import Conversation

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'avatar', 'status']

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'name', 'is_group', 'is_direct', 'participants', 
                 'created_at', 'updated_at', 'direct_participants', 'last_message']
    
    def get_last_message(self, obj):
        from .cassandra_models_conversation import ChatMessage
        import uuid
        
        try:
            # Get the most recent message for this conversation
            messages = ChatMessage.objects.filter(
                conversation_id=uuid.UUID(str(obj.id))
            ).limit(1)
            
            if messages:
                message = messages[0]
                return {
                    'id': str(message.message_id),
                    'text': message.text,
                    'sender_id': str(message.sender_id),
                    'timestamp': message.timestamp.isoformat(),
                    'is_read': message.is_read
                }
        except Exception as e:
            print(f"Error getting last message: {str(e)}")
        
        return None

class MessageSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    conversation_id = serializers.UUIDField()
    sender_id = serializers.UUIDField()
    text = serializers.CharField()
    timestamp = serializers.DateTimeField()
    is_read = serializers.BooleanField()
    read_at = serializers.DateTimeField(allow_null=True)
    is_edited = serializers.BooleanField()
    edited_at = serializers.DateTimeField(allow_null=True)
    is_deleted = serializers.BooleanField()
    deleted_at = serializers.DateTimeField(allow_null=True)
