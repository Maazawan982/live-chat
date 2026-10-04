# LiveChat — Real-Time WebSocket Messaging & Calling Application

A full-stack real-time messaging and voice/video calling web application built with **React**, **TypeScript**, **Node.js**, **Express**, and **Socket.IO**. Designed with a responsive WhatsApp-inspired interface featuring **Direct Messages (Chats)**, **Channels**, **Voice & Video Calls**, and a unified **Bottom Navigation Bar** across mobile, tablet, and desktop viewports.

---

## Author

- **Name:** Maaz Awan
- **Email:** maazawan2468@gmail.com
- **Role:** Full Stack Engineer

---

## Key Features

### 1. Persistent Bi-Directional WebSocket Architecture
- Powered by **Socket.IO** over a unified Node.js HTTP server (`server.ts`).
- Event-driven lifecycle listeners for `connection`, `disconnect`, `room:join`, `room:leave`, `message:send`, `message:react`, `typing:start`, `typing:stop`, `call:start`, and `call:end`.
- Multi-tab session tracking (`Map<userId, Set<socketId>>`) so users remain seamlessly connected across multiple browser tabs or devices.

### 2. JWT Handshake Authentication
- Every incoming WebSocket connection is verified inside the `io.use()` middleware before the connection is established.
- Extracts and validates the **JSON Web Token (JWT)** passed in `socket.handshake.auth.token`.
- Unauthenticated or expired tokens are immediately rejected during the handshake phase, protecting all real-time socket pipelines.

### 3. Direct Messages, Public Channels & Message Persistence
- **Direct Chats (`Chats` Tab):** Private 1-on-1 conversations with online/offline status dots, read receipts (`✓✓`), and quick filters (*All*, *Online*, *Unread*).
- **Team Channels (`Channels` Tab):** Topic-based `#channel` rooms (`#general`, `#engineering`, `#product-design`, `#random`) with instant channel creation (`+ New Channel`).
- **Persistent Storage:** All users, rooms, messages, reactions, and call logs are persisted to disk (`data/chat_storage.json`) and automatically loaded when switching rooms or refreshing the browser.

### 4. Real-Time Voice & Video Calling (`Calls` Tab)
- Initiate real-time **Voice** or **Video** calls directly from any conversation header or from the **Calls** tab.
- Interactive call overlay featuring end-to-end encryption indicators, live call duration timer, microphone mute/unmute, camera toggle, speaker toggle, and incoming call notifications.
- Automatic call log history tracking (*Outgoing*, *Incoming*, *Missed*) with call duration and timestamps.

### 5. Responsive WhatsApp-Inspired UI & Bottom Navigation
- **Bottom Navigation Bar:** Provides 1-tap switching between **Chats**, **Channels**, **Calls**, and **Account** with live unread message counters and missed call badges.
- **Live Typing Indicators:** Debounced real-time `"User is typing..."` notifications in both the conversation header, message stream, and sidebar list.
- **Message Reactions:** Hover or tap any message bubble to react with emojis (`👍`, `❤️`, `🔥`, `🚀`, `🎉`, `👀`) synced instantaneously across all room participants.
- **Instant Account Switcher:** Switch between pre-configured accounts (**Maaz Awan**, **Sarah Miller**, **Marcus Vance**, **Elena Rostova**) or register a custom account in one click to test multi-user real-time messaging.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite |
| **Backend** | Node.js, Express, HTTP Server |
| **Real-Time Engine** | Socket.IO (`socket.io` & `socket.io-client`) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) |
| **Persistence** | Structured JSON Document Store (`server/storage.ts` & `data/chat_storage.json`) |

---

## Project Structure

```text
├── data/
│   └── chat_storage.json         # Persistent database store (auto-generated)
├── server/
│   └── storage.ts                # Data models, seed data, and persistence manager
├── src/
│   ├── components/
│   │   ├── ActiveCallModal.tsx   # Voice & video call overlay with controls
│   │   ├── ArchitectureModal.tsx # Live WebSocket diagnostics & architecture overview
│   │   ├── AuthModal.tsx         # Custom sign-in & registration modal
│   │   ├── BottomNavBar.tsx      # WhatsApp-style bottom navigation bar
│   │   ├── ChatArea.tsx          # Conversation view, message stream & input composer
│   │   ├── CreateRoomModal.tsx   # Modal for creating new public channels
│   │   ├── Header.tsx            # Top bar with quick navigation & user switcher
│   │   └── Sidebar.tsx           # Left panel for Chats, Channels, Calls & Account
│   ├── context/
│   │   └── AuthContext.tsx       # JWT session management & instant user switching
│   ├── services/
│   │   ├── api.ts                # REST API client wrapper
│   │   └── socket.ts             # Socket.IO client singleton & event listeners
│   ├── App.tsx                   # Root responsive layout & real-time state coordinator
│   ├── index.css                 # Tailwind CSS entry point
│   ├── main.tsx                  # React DOM entry point
│   └── types.ts                  # Shared TypeScript interfaces
├── index.html                    # HTML entry point & metadata
├── package.json                  # Scripts and dependencies
├── server.ts                     # Unified Express + Socket.IO + Vite server
├── tsconfig.json                 # TypeScript configuration
└── vite.config.ts                # Vite bundler configuration
```

---

## WebSocket Event Protocol

### Client-to-Server Events
| Event | Payload | Description |
| :--- | :--- | :--- |
| `room:join` | `{ roomId: string }` | Joins a channel or direct message room |
| `room:leave` | `{ roomId: string }` | Leaves a channel or direct message room |
| `message:send` | `{ roomId: string, content: string, receiverId?: string }` | Persists and broadcasts a new chat message |
| `message:react` | `{ messageId: string, emoji: string, roomId: string }` | Toggles an emoji reaction on a message |
| `typing:start` | `{ roomId: string }` | Broadcasts typing state to other room members |
| `typing:stop` | `{ roomId: string }` | Clears typing indicator for the user |
| `call:start` | `{ targetUserId: string, callType: 'voice' \| 'video' }` | Signals an incoming voice or video call to recipient |
| `call:end` | `{ targetUserId, callType, durationSeconds, status }` | Ends an active call and records the call log |

### Server-to-Client Events
| Event | Payload | Description |
| :--- | :--- | :--- |
| `connection:established` | `{ socketId, userId, serverTime, onlineUsers }` | Emitted upon successful JWT handshake verification |
| `message:new` | `Message` | Broadcasts a newly persisted message to active room members |
| `message:reaction_update`| `{ messageId: string, reactions: Record<string, string[]> }` | Updates emoji reaction counts in real time |
| `user:presence` | `{ userId: string, status: 'online' \| 'offline', lastSeen: number }` | Broadcasts live online/offline status changes |
| `typing:update` | `{ roomId: string, userId: string, username: string, isTyping: boolean }` | Updates the real-time typing indicator |
| `call:incoming` | `{ callerId, callerName, callerAvatar, callType, timestamp }` | Triggers incoming call screen for target user |
| `call:log_added` | `CallLog` | Appends completed/missed call entry to the Calls tab |

---

## REST API Endpoints

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | No | Authenticates a user and returns a signed JWT |
| `POST` | `/api/auth/register` | No | Registers a new user account and returns a signed JWT |
| `GET` | `/api/auth/me` | Yes (`Bearer`) | Verifies current JWT and returns active user profile |
| `GET` | `/api/users` | Yes (`Bearer`) | Lists all users with live online/offline status |
| `GET` | `/api/rooms` | Yes (`Bearer`) | Lists public channels and user's direct message rooms |
| `POST` | `/api/rooms` | Yes (`Bearer`) | Creates a new public channel room |
| `POST` | `/api/rooms/direct` | Yes (`Bearer`) | Gets or creates a private 1-on-1 direct message room |
| `GET` | `/api/rooms/:roomId/messages` | Yes (`Bearer`) | Fetches persisted message history for a room |
| `GET` | `/api/calls` | Yes (`Bearer`) | Retrieves persisted voice and video call history logs |

---

## Getting Started

### Prerequisites
- **Node.js** v18+ (v22 recommended)
- **npm**

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
Starts the unified Express + Socket.IO + Vite development server on `http://localhost:3000`:
```bash
npm run dev
```

### 3. Build for Production
Compiles the frontend production bundle into `dist/`:
```bash
npm run build
```

### 4. Start Production Server
Serves the compiled static bundle and WebSocket gateway on port `3000`:
```bash
npm start
```

---

## How to Test Real-Time Multi-User Features

1. **Open Two Browser Windows (or Tabs):**
   - In Window 1, stay signed in as **Maaz Awan**.
   - In Window 2, use the top-right user menu (or the **Account** tab in the bottom navigation bar) to switch to **Sarah Miller** or **Marcus Vance**.
2. **Test Instant Messaging & Typing Indicators:**
   - Open the direct chat between **Maaz Awan** and **Sarah Miller** (or join `#general`).
   - Start typing in Window 1 to observe the live `"Maaz Awan is typing..."` indicator in Window 2.
   - Send a message and watch it appear immediately without refreshing the page.
3. **Test Live Voice & Video Calls:**
   - Click the **Voice Call** or **Video Call** icon in the conversation header (or inside the **Calls** tab) to trigger an incoming real-time call on the recipient's screen.
