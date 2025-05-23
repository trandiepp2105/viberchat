"""
This module initializes Cassandra connection when Django starts
"""
from django.conf import settings
from cassandra.cluster import Cluster
from cassandra.cqlengine import connection
from cassandra.cqlengine.management import sync_table
import logging
import os

logger = logging.getLogger(__name__)

def connect_to_cassandra():
    try:
        # Ensure environment variable is set
        os.environ['CQLENG_ALLOW_SCHEMA_MANAGEMENT'] = '1'
        
        # Configure connection to Cassandra
        connection.setup(
            settings.CASSANDRA_HOSTS,
            settings.CASSANDRA_KEYSPACE,
            retry_connect=True,
            # Add 30 second timeout to allow Cassandra container to start in development
            connect_timeout=30
        )
        
        # Sync table to ensure schema is up to date
        from chats.cassandra_models import ChatMessage
        table_name = getattr(ChatMessage, '__table_name__', None)
        logger.info(f"Syncing table: {table_name}")
        sync_table(ChatMessage)
        
        logger.info(f"Successfully connected to Cassandra keyspace {settings.CASSANDRA_KEYSPACE}")
        return True
    except Exception as e:
        logger.error(f"Failed to connect to Cassandra: {str(e)}")
        return False

def check_cassandra_connection():
    """
    Kiểm tra kết nối Cassandra hiện có, nếu mất kết nối thì thử kết nối lại.
    Có thể được sử dụng trong các health check hoặc theo dõi kết nối.
    """
    try:
        # Thử một truy vấn đơn giản để kiểm tra kết nối
        from cassandra.cqlengine.connection import get_session
        session = get_session()
        session.execute("SELECT now() FROM system.local")
        logger.debug("Cassandra connection is active")
        return True
    except Exception as e:
        logger.warning(f"Cassandra connection check failed: {str(e)}")
        # Thử kết nối lại
        return connect_to_cassandra()
