"""
Migration Guide from ChatSession to Conversation

This document outlines the steps needed to migrate from the old ChatSession model to the new
Conversation model, along with updating Cassandra storage.

Steps:

1. Install Required Files

---

- Replace models.py with the new version
- Replace routing.py with the new version
- Replace urls.py with the new version
- Create new cassandra_models_conversation.py
- Create new conversation_utils.py file
- Create new consumers_conversation.py file

2. Database Migrations

---

Run the following commands:

```
python manage.py makemigrations chats
python manage.py migrate
```

3. Create Cassandra Tables

---

Create the conversation_message table in Cassandra:

```python
from django.core.management.base import BaseCommand
from cassandra.cqlengine import connection
from cassandra.cqlengine.management import sync_table
from chats.cassandra_models_conversation import ChatMessage

def setup_cassandra():
    # Setup the connection
    connection.setup(['cassandra'], 'viberchat', protocol_version=4)

    # Create the tables
    sync_table(ChatMessage)

    print("Cassandra tables created successfully!")

# Run this in a management command or in a Django shell
setup_cassandra()
```

4. Data Migration

---

Migrate data from old ChatSession model to new Conversation model:

```python
from chats.models import ChatSession, Conversation
from chats.cassandra_models import ChatMessage as OldChatMessage
from chats.cassandra_models_conversation import ChatMessage as NewChatMessage
import uuid

def migrate_data():
    # Migrate chat sessions to conversations
    print("Migrating chat sessions to conversations...")
    for session in ChatSession.objects.all():
        # Create conversation
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

        print(f"Created conversation {conversation.id} from session {session.id}")

        # Migrate messages
        try:
            messages = OldChatMessage.objects.filter(chat_session_id=session.id)
            for old_message in messages:
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
            print(f"Migrated {len(messages)} messages for conversation {conversation.id}")
        except Exception as e:
            print(f"Error migrating messages for session {session.id}: {str(e)}")

    print("Migration completed!")

# Run this in a Django shell
migrate_data()
```

5. Update Frontend

---

Update the React frontend to use the new API endpoints:

- Update API service to use /api/chats/conversations/ instead of /api/chats/sessions/
- Update WebSocket connections to use /ws/conversation/{id}/ instead of /ws/chat/{id}/
- Update message handling to match the new schema

6. Testing

---

Test that both direct and group conversations work correctly:

- Creating new conversations
- Sending/receiving messages
- Real-time updates

7. Cleanup (After Successful Migration)

---

Once everything is working:

- Remove the old ChatSession model from models.py
- Remove references to the old models from views.py
- Update serializers to remove old implementations
- Drop the old Cassandra table

```cql
DROP TABLE IF EXISTS chat_message;
```

"""
