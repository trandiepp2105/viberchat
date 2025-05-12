#!/bin/bash

# Define a function to check connection, trying multiple commands
check_connection() {
  local host=$1
  local port=$2
  
  # Try nc.traditional first (Debian/Ubuntu)
  if command -v nc.traditional &> /dev/null; then
    nc.traditional -z $host $port
    return $?
  fi
  
  # Try regular nc next
  if command -v nc &> /dev/null; then
    nc -z $host $port
    return $?
  fi
  
  # Try netcat as last resort
  if command -v netcat &> /dev/null; then
    netcat -z $host $port
    return $?
  fi
  
  echo "No netcat command found. Cannot check connection."
  return 1
}

# Wait for MySQL to be ready
echo "Waiting for MySQL..."
while ! check_connection viberchat_mysql 3306; do
  sleep 1
done
echo "MySQL started"

# Wait for Cassandra to be ready
echo "Waiting for Cassandra..."
while ! check_connection viberchat_cassandra 9042; do
  sleep 1
done
echo "Cassandra started"

# Apply database migrations
# echo "Applying migrations..."
# python manage.py makemigrations


# Create superuser if it doesn't exist
# echo "Creating superuser..."
# python manage.py shell -c "
# from django.contrib.auth import get_user_model;
# User = get_user_model();
# if not User.objects.filter(username='admin').exists():
#     User.objects.create_superuser('admin', 'admin@gmail.com', 'admin');
#     print('Superuser created.');
# else:
#     print('Superuser already exists.');
# "

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Initialize Cassandra tables
echo "Setting up Cassandra..."
python manage.py initialize_cassandra
echo "Cassandra setup completed"

# # Keep the container running
tail -f /dev/null
# Start Gunicorn server
# exec gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3 --reload

# if [ "$DJANGO_ENV" = "development" ]; then
#     # In development mode, use reload for auto-restarting on code changes
#     exec gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3 --reload
# else
#     # In production, run without reload
#     exec gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3
# fi
