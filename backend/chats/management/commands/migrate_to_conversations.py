from django.core.management.base import BaseCommand
from chats.models import ChatSession
from chats.models_conversation import Conversation
from cassandra.cqlengine import connection
from django.conf import settings
import uuid


class Command(BaseCommand):
    help = 'Migrates data from ChatSession to Conversation model'

    def handle(self, *args, **options):
        self.stdout.write('Starting migration from ChatSession to Conversation...')
        
        # Get all existing chat sessions
        chat_sessions = ChatSession.objects.all()
        self.stdout.write(f'Found {chat_sessions.count()} chat sessions to migrate')
        
        # Track stats
        sessions_migrated = 0
        skipped = 0
        
        for session in chat_sessions:
            try:
                # Check if a conversation with this ID already exists
                if Conversation.objects.filter(id=session.id).exists():
                    self.stdout.write(f'Conversation with ID {session.id} already exists, skipping...')
                    skipped += 1
                    continue
                
                # Create conversation with the same ID
                conversation = Conversation(
                    id=session.id,  # Keep the same ID for easy reference
                    name=session.name or '',
                    is_group=session.is_group_chat,
                    is_direct=not session.is_group_chat,
                    created_at=session.created_at,
                    updated_at=session.updated_at,
                )
                
                if not session.is_group_chat:
                    # For direct conversations, create the direct_participants field
                    participants = session.participants.all()
                    if participants.count() == 2:
                        participant_ids = sorted([str(p.id) for p in participants])
                        conversation.direct_participants = '-'.join(participant_ids)
                
                conversation.save()
                
                # Add participants
                for participant in session.participants.all():
                    conversation.participants.add(participant)
                
                self.stdout.write(f'Created conversation {conversation.id} from session {session.id}')
                sessions_migrated += 1
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error migrating session {session.id}: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS(
            f'Migration completed! {sessions_migrated} chat sessions migrated, {skipped} skipped.'
        ))
