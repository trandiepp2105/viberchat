from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class ChatsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chats'

    def ready(self):
        import chats.signals # Ensure signals are imported if you have any
        
        # Initialize Cassandra connection
        from .cassandra_connection import connect_to_cassandra
        try:
            connect_to_cassandra()
            logger.info("Cassandra connection established during app startup")
        except Exception as e:
            logger.error(f"Error setting up Cassandra connection during app startup: {str(e)}")
            # Don't fail app startup, but log the error
