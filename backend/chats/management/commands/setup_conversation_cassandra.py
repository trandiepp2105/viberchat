from django.core.management.base import BaseCommand
from cassandra.cqlengine import connection
from cassandra.cqlengine.management import sync_table
from chats.cassandra_models_conversation import ChatMessage
from django.conf import settings
import os


class Command(BaseCommand):
    help = 'Sets up and syncs the Cassandra tables for the conversation model'

    def handle(self, *args, **options):
        # Get Cassandra host from settings or use default
        hosts = getattr(settings, 'CASSANDRA_HOSTS', ['cassandra'])
        keyspace = getattr(settings, 'CASSANDRA_KEYSPACE', 'viberchat')
        
        self.stdout.write(self.style.SUCCESS(f'Connecting to Cassandra at {hosts} with keyspace {keyspace}'))
        
        # Setup the connection
        connection.setup(hosts, keyspace, protocol_version=4)
        
        # Create/sync the tables
        self.stdout.write('Creating/syncing Cassandra tables...')
        sync_table(ChatMessage)
        
        self.stdout.write(self.style.SUCCESS('Cassandra tables created/synced successfully!'))
