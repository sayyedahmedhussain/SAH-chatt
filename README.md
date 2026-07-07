# SAH-chatt

A real-time chat application built with the **MERN stack** (MongoDB, Express, React, Node.js) — featuring dual OTP-based registration (Email & Phone), JWT authentication, one-to-one and group messaging, file sharing, and live presence/typing indicators powered by Socket.io.

## Features

- 🔐 **Authentication** — JWT-based login with bcrypt-hashed passwords
- ✅ **Dual OTP Verification** — users choose to verify via **Email** (Nodemailer) or **Phone Number** (Twilio Verify API) at registration
- 💬 **Real-time Messaging** — instant message delivery via Socket.io
- 👥 **Group Chats** — create groups, manage participants, group admin controls
- 📎 **File Sharing** — send images and file attachments in any chat
- ✍️ **Typing Indicators** — see when the other person is typing
- 🟢 **Online Status** — live online/offline presence for all users
- 😀 **Message Reactions & Replies** — react with emojis, reply to specific messages
- ✏️ **Edit / Delete Messages** — soft-delete keeps conversation history intact
- 🌓 **Light/Dark Theme** — theme toggle via React Context

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, React Router |
| State Management | React Context API |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| Real-time | Socket.io |
| Auth | JWT (jsonwebtoken), bcrypt |
| Email OTP | Nodemailer |
| Phone OTP | Twilio Verify API |
| File Uploads | Multer |

## Project Structure

```
SAH-chatt/
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/      # Route logic (auth, messages, conversations, users)
│   ├── middleware/        # JWT auth guard, file upload handling
│   ├── models/             # Mongoose schemas (User, Conversation, Message)
│   ├── routes/              # Express route definitions
│   ├── socket/               # Socket.io real-time event handling
│   ├── utils/                 # OTP generation, email service, Twilio helpers
│   └── server.js               # App entry point
└── frontend/
    └── src/
        ├── components/    # Reusable UI components (chat, auth)
        ├── context/        # Global state (Auth, Chat, Socket, Theme)
        ├── pages/            # Route-level pages (Login, Register, Chat, VerifyOtp)
        └── services/          # API call wrappers
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- A MongoDB connection string (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A Twilio account with a [Verify Service](https://console.twilio.com/us1/develop/verify/services) (for phone OTP)
- An email account/app password for Nodemailer (for email OTP)

### 1. Clone the repo
```bash
git clone https://github.com/sayyedahmedhussain/SAH-chatt.git
cd SAH-chatt
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
```
Fill in `.env` with your own values:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid
```
Run the server:
```bash
npm run dev
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

The app will be running at `http://localhost:5174` (frontend) and `http://localhost:5000` (backend), or whichever ports your `.env` files specify.

## Security Notes

- Passwords are hashed with **bcrypt** before being stored — never saved or returned in plain text.
- OTP verification (both email and phone) happens entirely **server-side**; no user account is created/activated until the code is verified.
- Phone OTPs are verified through **Twilio's Verify API**, which manages code generation, expiry, and validation — no OTP codes are stored in this app's own database.
- All chat/message routes are protected by JWT middleware — a valid, unexpired token is required to access any conversation or message data.

## Possible Improvements

- [ ] Rate limiting on OTP and login endpoints
- [ ] Input validation library (e.g. `express-validator` / `zod`)
- [ ] Automated tests (Jest / Supertest)
- [ ] Message pagination for large conversations
- [ ] Cloud file storage (e.g. S3 / Cloudinary) instead of local disk
- [ ] Refresh token flow
