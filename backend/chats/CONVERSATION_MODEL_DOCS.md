# Conversation Model Implementation

## Overview

We've refactored our chat system to use a Conversation model instead of ChatSession.
This change improves the application by:

1. Ensuring that each pair of users has only one direct conversation
2. Clearly distinguishing between direct conversations and group chats
3. Improving database organization and query performance

## Key Changes

### New Models and Components

1. **Conversation Model**

   - Replaced ChatSession with a more versatile Conversation model
   - Added `is_direct` flag to distinguish 1-to-1 chats from groups
   - Added `direct_participants` field for unique constraint on direct conversations

2. **Cassandra Models**

   - Created new `conversation_message` table in Cassandra
   - Optimized message storage for both direct and group conversations

3. **Utility Functions**

   - Added `get_or_create_direct_conversation` to enforce uniqueness
   - Added `create_group_conversation` for group chat creation

4. **WebSocket Consumers**

   - New `ConversationConsumer` handles all message types
   - Improved error handling and input validation

5. **API Endpoints**
   - New conversation-based REST endpoints for CRUD operations
   - Added specialized actions for direct and group conversations

## Client Integration

When updating the frontend, change these key points:

1. **API Endpoints**

   - Use `/api/chats/conversations/` instead of `/api/chats/sessions/`
   - Use specialized endpoints like `start_direct_conversation` and `create_group_conversation`

2. **WebSocket Connections**

   - Connect to `/ws/conversation/{id}/` instead of `/ws/chat/{id}/`

3. **Message Handling**
   - The structure of message objects remains similar, but the parent ID is now `conversation_id` instead of `chat_session_id`

## Technical Details

### Direct Conversation Uniqueness

We enforce uniqueness for direct conversations by:

1. Sorting user IDs in ascending order
2. Joining them with a dash separator
3. Storing the result in the `direct_participants` field
4. Adding a unique constraint for this field when `is_direct=True`

### Data Migration

The migration process involves:

1. Creating the new Conversation model in the database
2. Setting up the new Cassandra table
3. Migrating data from ChatSession to Conversation
4. Migrating messages from the old Cassandra table to the new one

Management commands have been created to automate these steps.

## Testing

Run the tests to verify the implementation:

```
python manage.py test chats.tests_conversation
```
