#!/bin/bash

# Define a function to check connection, trying multiple commands
check_connection() {
  local host=$1
  local port=$2
  local max_attempts=${3:-30}
  local attempt=1
  
  echo "Checking connection to $host:$port (max attempts: $max_attempts)..."
  
  while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt/$max_attempts: Connecting to $host:$port..."
    
    # Try nc.traditional first (Debian/Ubuntu)
    if command -v nc.traditional &> /dev/null; then
      if nc.traditional -z $host $port -w 1; then
        echo "Successfully connected to $host:$port"
        return 0
      fi
    # Try regular nc next
    elif command -v nc &> /dev/null; then
      if nc -z $host $port -w 1; then
        echo "Successfully connected to $host:$port"
        return 0
      fi
    # Try netcat as last resort
    elif command -v netcat &> /dev/null; then
      if netcat -z $host $port -w 1; then
        echo "Successfully connected to $host:$port"
        return 0
      fi
    else
      echo "No netcat command found. Cannot check connection."
      return 1
    fi
    
    echo "Connection attempt failed. Waiting 1 second before retry..."
    sleep 1
    attempt=$((attempt+1))
  done
  
  echo "Max attempts reached. Could not connect to $host:$port"
  return 1
}

# =================================================================
# Environment setup
# =================================================================

# Set environment variable for Cassandra schema management
export CQLENG_ALLOW_SCHEMA_MANAGEMENT=1

# =================================================================
# Database connection checks
# =================================================================

echo "=== Checking database connections ==="

# Wait for MySQL to be ready
echo "Waiting for MySQL..."
if ! check_connection viberchat_mysql 3306 30; then
  echo "ERROR: Could not connect to MySQL. Exiting."
  exit 1
fi
echo "MySQL is available."

# Wait for Cassandra to be ready
echo "Waiting for Cassandra..."
if ! check_connection viberchat_cassandra 9042 30; then
  echo "ERROR: Could not connect to Cassandra. Exiting."
  exit 1
fi
echo "Cassandra is available."

# Wait for Redis to be ready
echo "Waiting for Redis..."
if ! check_connection viberchat_redis 6379 30; then
  echo "ERROR: Could not connect to Redis. Exiting."
  exit 1
fi
echo "Redis is available."

# =================================================================
# Cassandra setup
# =================================================================

# Use the Django management command to set up Cassandra properly
echo "Running setup_cassandra management command..."
python manage.py setup_cassandra

# =================================================================
# Django database setup
# =================================================================

echo "=== Setting up Django database ==="

# Reset core Django app migrations first to avoid content type issues
# echo "Resetting migrations..."
# python manage.py migrate auth zero --noinput
# python manage.py migrate contenttypes zero --noinput
# python manage.py migrate sessions zero --noinput
# python manage.py migrate admin zero --noinput
# python manage.py migrate sites zero --noinput

# Apply all migrations
# echo "Applying migrations..."
# python manage.py makemigrations
# python manage.py migrate --noinput

# =================================================================
# Static files and superuser setup
# =================================================================

# Collect static files
# echo "Collecting static files..."
# python manage.py collectstatic --noinput

# Create superuser if it doesn't exist
# echo "Creating superuser..."
# python manage.py create_admin

# =================================================================
# Setup complete
# =================================================================

# echo "==================================================="
# echo "SETUP COMPLETE"
# echo "==================================================="
# echo "To start the Django development server manually, run:"
# echo "docker-compose exec backend python manage.py runserver 0.0.0.0:8000"
# echo ""
# echo "For production, run Gunicorn:"
# echo "docker-compose exec backend gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3"
# echo "==================================================="

# Keep the container running without starting the server
# This is useful for development environments
exec tail -f /dev/null
