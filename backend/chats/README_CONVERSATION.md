# Conversation Model Implementation

## Introduction

This update replaces the ChatSession model with a new Conversation model in the ViberChat application. The main benefit is ensuring that each pair of users has only one direct conversation while still allowing multiple group conversations.

## Key Files

### Backend

- **Models**: `chats/models_conversation.py` → `chats/models.py`
- **Cassandra**: `chats/cassandra_models_conversation.py`
- **WebSocket**: `chats/consumers_conversation.py`
- **Utilities**: `chats/conversation_utils.py`
- **Endpoints**: `chats/views_conversation.py`
- **Serializers**: `chats/serializers_conversation.py`

### Documentation

- **Migration Guide**: `chats/MIGRATION_GUIDE.md`
- **Technical Documentation**: `chats/CONVERSATION_MODEL_DOCS.md`
- **Frontend Integration**: `frontend/src/CONVERSATION_INTEGRATION.md`

## Migration Plan

### 1. Create Database Migrations

```
python manage.py makemigrations
python manage.py migrate
```

### 2. Setup Cassandra

```
python manage.py setup_conversation_cassandra
```

### 3. Migrate Data

```
python manage.py migrate_to_conversations
python manage.py migrate_conversation_messages
```

### 4. Replace Files

- Replace `models.py` with `models_new.py`
- Replace `routing.py` with `routing_new.py`
- Replace `urls.py` with `urls_new.py`

### 5. Test Application

Verify the application works correctly with the new model structure.

### 6. Update Frontend

Follow the guide in `frontend/src/CONVERSATION_INTEGRATION.md`.

### 7. Clean Up

After successful migration, remove old models and clean up Cassandra tables.

## Features

### Direct Conversations

- Each pair of users has exactly one direct conversation
- System automatically creates or retrieves the right conversation

### Group Conversations

- Multiple group conversations can exist with the same participants
- Group conversations have names and preserve all previous functionality

### WebSocket Integration

- Real-time updates for new messages, typing indicators, and read receipts
- Improved error handling and security checks

## Testing

Run the tests to verify the implementation:

```
python manage.py test chats.tests_conversation
```
