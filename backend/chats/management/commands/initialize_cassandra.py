from django.core.management.base import BaseCommand
from chats.cassandra_connection import connect_to_cassandra
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Initialize Cassandra connection and sync tables'

    def handle(self, *args, **options):
        self.stdout.write('Initializing Cassandra connection...')
        
        # Connect and sync tables (connect_to_cassandra already handles keyspace creation)
        try:
            if connect_to_cassandra():
                self.stdout.write(self.style.SUCCESS('Successfully connected to Cassandra and synced tables'))
            else:
                self.stdout.write(self.style.ERROR('Failed to connect to Cassandra'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error connecting to Cassandra: {str(e)}'))
