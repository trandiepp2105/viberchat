"""
This module initializes Cassandra connection when Django starts
"""
from django.conf import settings
from cassandra.cluster import Cluster
from cassandra.cqlengine import connection
from cassandra.cqlengine.management import sync_table, create_keyspace_simple
import logging

logger = logging.getLogger(__name__)

def connect_to_cassandra():
    try:
        # Configure connection to Cassandra
        connection.setup(
            settings.CASSANDRA_HOSTS,
            settings.CASSANDRA_KEYSPACE,
            retry_connect=True,
            # Add 30 second timeout to allow Cassandra container to start in development
            connect_timeout=30
        )
        
        # Create keyspace if it doesn't exist
        create_keyspace_if_not_exists()
        
        # Sync tables to ensure schema is up to date
        from .cassandra_models import ChatMessage
        sync_table(ChatMessage)
        
        logger.info(f"Successfully connected to Cassandra keyspace {settings.CASSANDRA_KEYSPACE}")
        return True
    except Exception as e:
        logger.error(f"Failed to connect to Cassandra: {str(e)}")
        return False

def create_keyspace_if_not_exists():
    try:
        # Connect to Cassandra without keyspace first
        cluster = Cluster(settings.CASSANDRA_HOSTS)
        session = cluster.connect()
        
        keyspace = settings.CASSANDRA_KEYSPACE
        replication_factor = 1  # Use higher for production
        
        # Check if keyspace exists
        keyspaces = session.execute("SELECT keyspace_name FROM system_schema.keyspaces")
        keyspace_exists = any(ks[0] == keyspace.lower() for ks in keyspaces)
        
        if not keyspace_exists:
            logger.info(f"Creating keyspace {keyspace}...")
            session.execute(f"""
                CREATE KEYSPACE {keyspace}
                WITH REPLICATION = {{ 'class' : 'SimpleStrategy', 'replication_factor' : {replication_factor} }}
            """)
            logger.info(f"Keyspace {keyspace} created successfully")
        
        session.shutdown()
        cluster.shutdown()
        return True
    except Exception as e:
        logger.error(f"Error creating keyspace: {str(e)}")
        return False
