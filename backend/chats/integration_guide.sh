#!/bin/bash

# Conversation Model Integration Script
# This script is a guideline for the steps needed to integrate the Conversation model
# into the main application. Execute the commands manually, one step at a time.

echo "Conversation Model Integration Guide"
echo "===================================="
echo ""
echo "Follow these steps carefully to integrate the Conversation model:"
echo ""

echo "Step 1: Create database migrations"
echo "---------------------------------"
echo "Run: python manage.py makemigrations"
echo ""

echo "Step 2: Apply migrations to create the Conversation table"
echo "------------------------------------------------------"
echo "Run: python manage.py migrate"
echo ""

echo "Step 3: Setup Cassandra for Conversations"
echo "--------------------------------------"
echo "Run: python manage.py setup_conversation_cassandra"
echo ""

echo "Step 4: Migrate data from ChatSession to Conversation"
echo "--------------------------------------------------"
echo "Run: python manage.py migrate_to_conversations"
echo ""

echo "Step 5: Migrate messages from old table to new table"
echo "-------------------------------------------------"
echo "Run: python manage.py migrate_conversation_messages"
echo ""

echo "Step 6: Replace the main files with the new versions"
echo "-------------------------------------------------"
echo "Move these files (or copy their contents):"
echo "- models_new.py -> models.py"
echo "- routing_new.py -> routing.py"
echo "- urls_new.py -> urls.py"
echo ""

echo "Step 7: Test the application"
echo "-------------------------"
echo "Verify the application works correctly with the new model structure"
echo ""

echo "Step 8 (After successful testing): Clean up old Cassandra table"
echo "------------------------------------------------------------"
echo "Run this CQL command in the Cassandra container:"
echo "  DROP TABLE IF EXISTS viberchat.chat_message;"
echo ""

echo "Integration complete!"
