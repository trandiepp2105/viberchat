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

## 🧱 Cassandra Schema Example (schema.cql)

```sql
CREATE KEYSPACE IF NOT EXISTS chatapp
WITH REPLICATION = { 'class': 'SimpleStrategy', 'replication_factor': 1 };

USE chatapp;

CREATE TABLE IF NOT EXISTS messages (
    conversation_id text,
    timestamp timestamp,
    sender_id text,
    receiver_id text,
    content text,
    PRIMARY KEY ((conversation_id), timestamp)
) WITH CLUSTERING ORDER BY (timestamp ASC);
```

## 📦 Installation Guide

### 1. Requirements

- Node.js >= 18.x
- Apache Cassandra installed (or use Docker)
- npm or yarn
- Browser (Chrome, Firefox, etc.)

---

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/chat-app.git
cd chat-app
```

---

### 3. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` and add:

```env
PORT=5000
JWT_SECRET=your_jwt_secret
CASSANDRA_CONTACT_POINTS=127.0.0.1
CASSANDRA_KEYSPACE=chatapp
```

---

### 4. Frontend Setup

```bash
cd ../frontend
npm install
```

---

## ▶️ Running the App

### Start Cassandra

Make sure Cassandra is running, either:

- Directly:
  ```bash
  cassandra -f
  ```
- Or with Docker:
  ```bash
  docker run --name cassandra -p 9042:9042 -d cassandra
  ```

---

### Start Backend

```bash
cd backend
node server.js
```

---

### Start Frontend

```bash
cd frontend
npm start
```

Open your browser at [http://localhost:3000](http://localhost:3000)

---

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
- [Express.js](https://expressjs.com/)

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

This project is licensed under the MIT License.
