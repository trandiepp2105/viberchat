from django.core.management.base import BaseCommand
from django.conf import settings
from cassandra.cluster import Cluster
from cassandra.cqlengine import connection
from cassandra.cqlengine.management import sync_table, create_keyspace_simple
import logging
import time
import os

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Thiết lập đầy đủ Cassandra cho ứng dụng ViberChat'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Bắt đầu thiết lập Cassandra...'))
        
        # Đảm bảo biến môi trường được thiết lập
        os.environ['CQLENG_ALLOW_SCHEMA_MANAGEMENT'] = '1'
        
        # Thử kết nối đến Cassandra và đợi nếu cần
        max_retries = 10
        retry_count = 0
        connected = False
        
        while not connected and retry_count < max_retries:
            try:
                hosts = settings.CASSANDRA_HOSTS
                self.stdout.write(f'Đang kết nối tới Cassandra hosts: {hosts}')
                
                # Thử kết nối trực tiếp đến Cassandra cluster
                cluster = Cluster(hosts)
                session = cluster.connect()
                connected = True
                
                self.stdout.write(self.style.SUCCESS('Kết nối thành công tới Cassandra'))
                
                # Tạo keyspace nếu chưa tồn tại
                keyspace = settings.CASSANDRA_KEYSPACE
                self.stdout.write(f'Đang kiểm tra và tạo keyspace "{keyspace}" nếu cần...')
                
                # Kiểm tra xem keyspace đã tồn tại chưa
                keyspaces = session.execute("SELECT keyspace_name FROM system_schema.keyspaces")
                keyspace_exists = any(ks.keyspace_name == keyspace.lower() for ks in keyspaces)
                
                if not keyspace_exists:
                    session.execute(f"""
                    CREATE KEYSPACE {keyspace} 
                    WITH replication = {{'class': 'SimpleStrategy', 'replication_factor': '1'}}
                    """)
                    self.stdout.write(self.style.SUCCESS(f'Keyspace "{keyspace}" đã được tạo'))                
                else:
                    self.stdout.write(f'Keyspace "{keyspace}" đã tồn tại')
                
                # Đóng kết nối trực tiếp
                cluster.shutdown()
                
                # Thiết lập kết nối thông qua cqlengine
                self.stdout.write('Thiết lập kết nối với cqlengine...')
                connection.setup(hosts, keyspace, protocol_version=4)
                
                # Đồng bộ các bảng
                self.stdout.write('Đồng bộ bảng conversation_message...')
                # Đảm bảo table_name khớp
                from chats.cassandra_models import ChatMessage
                table_name = getattr(ChatMessage, '__table_name__', None)
                self.stdout.write(f'Tên bảng trong model: {table_name}')
                sync_table(ChatMessage)
                
                # Kiểm tra bảng đã được tạo chưa
                self.check_table_exists(keyspace, table_name)
                
                self.stdout.write(self.style.SUCCESS('Thiết lập Cassandra hoàn tất thành công!'))
                return
                
            except Exception as e:
                retry_count += 1
                self.stdout.write(self.style.WARNING(f'Không thể kết nối tới Cassandra: {str(e)}'))                
                self.stdout.write(f'Thử lại ({retry_count}/{max_retries}) sau 5 giây...')
                time.sleep(5)
        
        if not connected:
            self.stdout.write(self.style.ERROR('Không thể kết nối tới Cassandra sau nhiều lần thử. Vui lòng kiểm tra lại cấu hình và đảm bảo dịch vụ Cassandra đang chạy.'))
    
    def check_table_exists(self, keyspace, table_name):
        """Kiểm tra xem bảng đã tồn tại trong keyspace hay chưa"""
        try:
            cluster = Cluster(settings.CASSANDRA_HOSTS)
            session = cluster.connect()
            
            # Thực hiện truy vấn kiểm tra bảng
            tables = session.execute(f"SELECT table_name FROM system_schema.tables WHERE keyspace_name='{keyspace}'")
            table_exists = any(t.table_name == table_name.lower() for t in tables)
            
            if table_exists:
                self.stdout.write(self.style.SUCCESS(f'Bảng "{table_name}" đã tồn tại trong keyspace "{keyspace}"'))
            else:
                self.stdout.write(self.style.ERROR(f'Bảng "{table_name}" KHÔNG tồn tại trong keyspace "{keyspace}"'))
                
            cluster.shutdown()
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Lỗi khi kiểm tra bảng: {str(e)}'))
