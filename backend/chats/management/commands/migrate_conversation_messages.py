from django.core.management.base import BaseCommand
from cassandra.cqlengine import connection
from django.conf import settings
from chats.cassandra_models import ChatMessage as OldChatMessage
from chats.cassandra_models_conversation import ChatMessage as NewChatMessage
from chats.models_conversation import Conversation
import uuid


class Command(BaseCommand):
    help = 'Migrates messages from old Cassandra table to new Conversation-based table'

    def handle(self, *args, **options):
        # Get Cassandra host from settings or use default
        hosts = getattr(settings, 'CASSANDRA_HOSTS', ['cassandra'])
        keyspace = getattr(settings, 'CASSANDRA_KEYSPACE', 'viberchat')
        
        self.stdout.write(f'Connecting to Cassandra at {hosts} with keyspace {keyspace}')
        
        # Setup the connection
        connection.setup(hosts, keyspace, protocol_version=4)
        
        # Get all conversations that were migrated from chat sessions
        conversations = Conversation.objects.all()
        
        self.stdout.write(f'Found {conversations.count()} conversations to process')
        
        # Track statistics
        total_messages = 0
        successful_messages = 0
        error_count = 0
        
        for conversation in conversations:
            try:
                # Try to get messages for this conversation (which was previously a chat session)
                self.stdout.write(f'Processing messages for conversation {conversation.id}')
                
                old_messages = OldChatMessage.objects.filter(chat_session_id=conversation.id)
                session_messages = list(old_messages)
                
                self.stdout.write(f'Found {len(session_messages)} messages to migrate')
                total_messages += len(session_messages)
                
                for old_message in session_messages:
                    try:
                        # Create new message in the conversation_message table
                        NewChatMessage.create(
                            conversation_id=conversation.id,
                            message_id=old_message.message_id,
                            sender_id=old_message.sender_id,
                            text=old_message.text,
                            timestamp=old_message.message_timestamp,
                            is_read=old_message.is_read,
                            read_at=old_message.read_at,
                            is_edited=old_message.is_edited,
                            edited_at=old_message.edited_at,
                            has_attachment=old_message.has_attachment,
                            is_deleted=old_message.is_deleted,
                            deleted_at=old_message.deleted_at
                        )
                        successful_messages += 1
                    except Exception as msg_error:
                        self.stdout.write(self.style.ERROR(
                            f'Error migrating message {old_message.message_id}: {str(msg_error)}'
                        ))
                        error_count += 1
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'Error processing conversation {conversation.id}: {str(e)}'
                ))
        
        self.stdout.write(self.style.SUCCESS(
            f'Message migration completed! Processed {total_messages} messages: '
            f'{successful_messages} migrated successfully, {error_count} errors.'
        ))
