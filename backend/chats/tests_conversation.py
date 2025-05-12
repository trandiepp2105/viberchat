from django.test import TestCase
from django.contrib.auth import get_user_model
from .models_conversation import Conversation
from .conversation_utils import get_or_create_direct_conversation, create_group_conversation
import uuid

User = get_user_model()

class ConversationModelTests(TestCase):
    def setUp(self):
        # Create test users
        self.user1 = User.objects.create_user(
            username='user1', 
            email='user1@example.com', 
            password='password123'
        )
        self.user2 = User.objects.create_user(
            username='user2', 
            email='user2@example.com', 
            password='password123'
        )
        self.user3 = User.objects.create_user(
            username='user3', 
            email='user3@example.com', 
            password='password123'
        )

    def test_direct_conversation_creation(self):
        # Test creating a direct conversation
        conversation, created = get_or_create_direct_conversation(self.user1, self.user2)
        
        # Check that the conversation was created correctly
        self.assertTrue(created)
        self.assertTrue(conversation.is_direct)
        self.assertFalse(conversation.is_group)
        self.assertEqual(conversation.participants.count(), 2)
        self.assertIn(self.user1, conversation.participants.all())
        self.assertIn(self.user2, conversation.participants.all())
        
        # Check that the direct_participants field is set correctly
        participant_ids = sorted([str(self.user1.id), str(self.user2.id)])
        expected_key = '-'.join(participant_ids)
        self.assertEqual(conversation.direct_participants, expected_key)
        
        # Test retrieving the same conversation
        conversation2, created2 = get_or_create_direct_conversation(self.user1, self.user2)
        self.assertFalse(created2)
        self.assertEqual(conversation.id, conversation2.id)
        
        # Test that the order of users doesn't matter
        conversation3, created3 = get_or_create_direct_conversation(self.user2, self.user1)
        self.assertFalse(created3)
        self.assertEqual(conversation.id, conversation3.id)

    def test_group_conversation_creation(self):
        # Test creating a group conversation
        conversation = create_group_conversation(
            creator=self.user1,
            name="Test Group",
            participant_ids=[str(self.user2.id), str(self.user3.id)]
        )
        
        # Check that the conversation was created correctly
        self.assertTrue(conversation.is_group)
        self.assertFalse(conversation.is_direct)
        self.assertEqual(conversation.name, "Test Group")
        self.assertEqual(conversation.participants.count(), 3)
        self.assertIn(self.user1, conversation.participants.all())
        self.assertIn(self.user2, conversation.participants.all())
        self.assertIn(self.user3, conversation.participants.all())
        self.assertEqual(conversation.direct_participants, "")  # Should be empty for groups

    def test_conversation_uniqueness(self):
        # Create two direct conversations
        conv1, _ = get_or_create_direct_conversation(self.user1, self.user2)
        conv2, _ = get_or_create_direct_conversation(self.user1, self.user3)
        
        # They should have different IDs
        self.assertNotEqual(conv1.id, conv2.id)
        
        # Create two group conversations with the same participants but different names
        group1 = create_group_conversation(
            creator=self.user1,
            name="Group 1",
            participant_ids=[str(self.user2.id), str(self.user3.id)]
        )
        group2 = create_group_conversation(
            creator=self.user1,
            name="Group 2",
            participant_ids=[str(self.user2.id), str(self.user3.id)]
        )
        
        # They should have different IDs
        self.assertNotEqual(group1.id, group2.id)
