# 💬 Talklet

Talklet is a modern, premium real-time chat and communication platform. Built with a robust MERN stack, WebRTC, and Socket.io, it offers rich messaging, voice/video calls, group chats, account visibility controls, and media sharing.

---

## 🚀 Features

### 1. Real-Time Messaging & Presence
* **Instant Delivery**: Powered by **Socket.io** for low-latency communication.
* **Activity Indicators**: Live typing and voice recording indicator states.
* **Presence Tracking**: Displays real-time online/offline statuses of friends.

### 2. Integrated WebRTC Voice & Video Calls
* Peer-to-peer high-quality calling directly inside the browser.
* Call state handling (offer, answer, ICE candidates, reject, and end events) bridged smoothly over socket signaling.

### 3. User Privacy & Profile Visibility
* **Public vs. Private Profiles**: Users can choose to hide/show their profiles.
* **Public Directory**: Browse and discover public users to expand your connections.
* **Auto-Accept Requests**: Toggle automated accepting of friend requests for public accounts.

### 4. Group Chats
* Create group conversations, invite multiple contacts, and chat collectively with real-time updates.

### 5. Smart DB Housekeeping & Automation
* **Daily Message Cleanup**: Automatically scans and prunes messages older than 30 days while preserving the last 3 messages of each conversation to maintain storage efficiency.
* **Seeded Support Bot**: Seed script available to spin up the Bumble Bee bot user.

---

## 🛠️ Tech Stack

### Frontend (Client)
* **Core Framework**: React 19 & Vite
* **Styling**: Tailwind CSS v4.x & Bootstrap 5 (with Bootstrap Icons)
* **Routing & State**: React Router DOM v7 & Context Providers
* **Notifications**: React Hot Toast
* **Real-time Client**: Socket.io-client

### Backend (Server)
* **Runtime & Framework**: Node.js & Express v5
* **Database**: MongoDB Atlas with Mongoose ORM
* **Sockets**: Socket.io Server
* **Media Cloud**: Cloudinary SDK (for profile and media attachments)
* **Security & Auth**: JWT (JSON Web Tokens) & bcryptjs (password hashing)

---

## 📁 Repository Structure

```text
Talklet/
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Friend requests, homepage, login/signup, profiles, directory
│   │   ├── context/     # Global state management
│   │   ├── lib/         # Axios client and socket setup
│   │   └── App.jsx      # Main application router
│   ├── vercel.json      # Client production deployment routing
│   └── vite.config.js   # Vite configuration
│
└── server/              # Node.js Express backend
    ├── controller/      # API controller functions
    ├── lib/             # DB connector and utility libraries
    ├── middleware/      # Auth and route middleware
    ├── models/          # Mongoose database schemas (User, Message, Group, Friend)
    ├── routes/          # API route definitions
    ├── scripts/         # Housekeeping and migration scripts
    ├── seedBot/         # Seed script for Bot assistant (Bumble Bee)
    ├── server.js        # Entrypoint & Socket connection handler
    └── vercel.json      # Server production serverless deployment
```

---

## ⚙️ Setup & Installation

### Prerequisites
* **Node.js** (v18+ recommended)
* **MongoDB Atlas** database URI
* **Cloudinary** account (for media storage)

---

### Step 1: Environment Configuration

Create a `.env` file in the **server** directory:
```env
# Database & Network
MONGODB_URI="your_mongodb_connection_string"
PORT=5000

# Authentication
JWT_SECRET="your_secure_jwt_secret"

# Cloudinary Config
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Auto-Accept Logic (Optional)
AUTO_ACCEPT_PUBLIC=true
```

Create a `.env` file in the **client** directory:
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

### Step 2: Backend Installation

1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (runs via nodemon):
   ```bash
   npm run server
   ```

---

### Step 3: Frontend Installation

1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗃️ Migrations & Utility Scripts

All scripts are executed from the `/server` directory:

### Run Default Account Visibility Migration
Ensures all existing legacy user profiles without an `isPublic` field are updated to `isPublic: false`.
```bash
node scripts/migrations/set-default-visibility.js
```

### Seed Bumble Bee (AI Bot Assistant)
Creates the assistant bot profile in your database.
```bash
node seedBot/seedBot.js
```

### Reset / Cleanup Database User Records
Wipes all registered users, associated messages, and groups (excluding the system Bot).
```bash
node scripts/cleanupUsers.js
```

---

## 🌐 Deployment

The application features dedicated `vercel.json` setups for zero-config deployments to Vercel.

* **Client**: Configured to handle Single Page Application (SPA) routing.
* **Server**: Deploys server.js as a serverless function forwarding all routing appropriately.

---

## 📝 License
This project is licensed under the ISC License.
