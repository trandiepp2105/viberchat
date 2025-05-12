# 💬 Realtime Chat App - Online Chat Website

This is a real-time chat website that allows users to communicate instantly using WebSocket. Unlike traditional applications that use relational databases, this project uses **Apache Cassandra**, a distributed NoSQL database, to store chat messages efficiently and at scale.

## 🚀 Features

- 👤 User registration and login
- ⚡ Real-time messaging using WebSocket (`socket.io`)
- 👁️ Online user presence tracking
- 💾 Persistent chat history using Cassandra
- 🔐 JWT-based authentication
- 🖥️ Responsive and modern UI with React

## 🛠 Technologies Used

| Component           | Technology            |
| ------------------- | --------------------- |
| Backend             | Node.js / Express     |
| Real-time Messaging | Socket.io (WebSocket) |
| Database            | Apache Cassandra      |
| Authentication      | JSON Web Tokens (JWT) |
| Frontend            | React.js              |
| API Communication   | REST API + WebSocket  |
| Data Format         | JSON                  |

## 🚀 Getting Started (Local Development)

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Git
- Docker & Docker Compose
- Node.js & npm/yarn (if you intend to run frontend/admin outside Docker for development or manage dependencies)
- Python & pip (if you intend to run backend outside Docker for development)

### Installation with Docker

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/trandiepp2105/viberchat.git
    cd viberchat
    ```

2.  **Configure Environment Variables:**
    You will need to create `.env` files for the backend, frontend, and admin panel.
    **Do not commit your actual `.env` files with sensitive credentials.**

    - **Backend (`.env`):**
      Create this file at the same level as the docker-compose.yml file.
      For local development, it should look something like this (adjust paths and service names according to your `docker-compose.yml`):

      ```env
      DJANGO_SECRET_KEY=your_strong_local_secret_key # Change this!
      DJANGO_DEBUG=True

      # =======================================
      # URLS & ALLOWED HOSTS (Local Development)
      # =======================================
      # For local Docker, these might not be strictly needed if services communicate via Docker network
      # Or can be set to localhost for services exposed to the host machine
      APP_ORIGIN=http://localhost:8000
      FRONTEND_ORIGIN=http://localhost:3000 # Adjust port if your local frontend runs elsewhere
      FRONTEND_ACCESS_URL=http://localhost:3000/ # For VNPay return, etc.
      DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,backend,viberchat_backend # 'backend' or 'viberchat_backend' if that's the service name

      # =======================================
      # MYSQL CONFIGURATION
      # =======================================
      MYSQL_HOST=viberchat_mysql # Docker service name for MySQL
      MYSQL_PORT=3309             # MySQL port INSIDE its container
      MYSQL_ROOT_PASSWORD=your_mysql_root_password_local
      MYSQL_USER=trandiep
      MYSQL_PASSWORD=your_local_db_password # Change for local dev, DO NOT use production password
      MYSQL_DATABASE=viberchat

      # =======================================
      # REDIS CONFIGURATION
      # =======================================
      REDIS_HOST=viberchat_redis # Docker service name for Redis
      REDIS_CACHE_URL=redis://${REDIS_HOST}:6379/1

      # =======================================
      # CELERY CONFIGURATION
      # =======================================
      CELERY_BROKER_URL=redis://${REDIS_HOST}:6379/0
      CELERY_RESULT_BACKEND=redis://${REDIS_HOST}:6379/0

      # =======================================
      # EMAIL CONFIGURATION (Use a local mail catcher like MailHog for dev, or your test Gmail)
      # =======================================
      EMAIL_HOST=smtp.gmail.com # Or your local mail server (e.g., mailhog)
      EMAIL_PORT=587            # Or 1025 for MailHog
      EMAIL_USE_TLS=True
      EMAIL_HOST_USER=your_test_email@gmail.com
      EMAIL_HOST_PASSWORD=your_app_password_or_test_password # For Gmail, use an App Password

      # =======================================
      # JWT TOKEN LIFETIMES
      # =======================================
      ACCESS_TOKEN_LIFETIME_HOURS=5
      REFRESH_TOKEN_LIFETIME_DAYS=1

      # =======================================
      # ADMIN USER CREDENTIALS (For initial setup script if any, otherwise created via createsuperuser)
      # =======================================
      ADMIN_EMAIL="admin_local@example.com"
      ADMIN_PASSWORD="adminlocalpassword"
      ```

    - **Frontend (`frontend/.env`):**
      Create this file in your `frontend` directory. Copy from `frontend/.env.example` if available.

      ```env
      REACT_APP_API_URL=http://localhost:8000/api # URL of your Django backend API for local development
      # For production, this might be REACT_APP_API_URL=http://20.198.225.85/api (or via Nginx)

      # Example based on your provided production values, adjust for local if needed:
      # REACT_APP_SERVER_HOST=localhost
      # REACT_APP_SERVER_PORT=8000
      ```
3.  **Build and Run with Docker Compose:**
    From the root directory of the project (where `docker-compose.yml` is located):

    ```bash
    docker-compose up --build -d
    ```

    - `--build`: Forces a rebuild of the images if they've changed.
    - `-d`: Runs containers in detached mode.
4.  **Access the application:**
    The ports depend on your `docker-compose.yml` configuration for port mapping. Common defaults:
    - **Frontend:** `http://localhost:3000` (or the port you've mapped, e.g., `8081`)
    - **Backend API:** `http://localhost:8000` (or the port you've mapped)
## 📝 Notes

- Messages are stored in Cassandra using a partition key based on `conversation_id` for efficient retrieval.
- Real-time events (message sending, user presence, etc.) are handled by WebSocket.
- You can customize message format or add features like typing indicator, emojis, and file sharing.

---

## 🧪 Testing Ideas

- Open the app in two browser tabs with different users to simulate real-time conversation.
- Monitor Cassandra data with tools like `cqlsh`.
- Simulate large conversations to test scalability of Cassandra backend.

---

## 📚 References

- [Cassandra Documentation](https://cassandra.apache.org/doc/latest/)
- [Socket.IO Docs](https://socket.io/)
- [React.js Official Site](https://reactjs.org/)
---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

This project is licensed under the MIT License.
