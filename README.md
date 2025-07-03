# PulseChat 💬

PulseChat is a real-time chat application built using **WebSockets**, **Next.js**, **Clerk authentication**, **Prisma**, and **PostgreSQL**.
Users can create or join rooms, exchange messages instantly, and recover from disconnections via automatic reconnection logic.

---
# Demo
<video src="https://github.com/user-attachments/assets/3ccf9935-3fec-4983-b330-ae31f23099bb" controls="controls" muted="muted" playsinline="playsinline"></video>
---
## 🚀 Features

- 🔒 Secure authentication with [Clerk](https://clerk.com/)
- 🧑‍🤝‍🧑 Room-based chat with admin controls
- 🔁 Auto-reconnect on socket disconnect
- 📁 File sharing via [Firebase Storage](https://firebase.google.com/)
- ✨ Emoji support & chat summaries

---

## 🧱 Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/), [ShadCN UI](https://ui.shadcn.dev/)
- **Backend**: Node.js, [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Auth**: [Clerk.dev](https://clerk.com/)
- **Storage**: [Firebase Storage](https://firebase.google.com/)

---

## Backend .env

```
DATABASE_URL="postgresql://username:password@localhost:5432/whisperchat?schema=public"

# WebSocket Server
PORT=8080
CORS_ORIGIN=*

# Gemini API (Optional)
GEMINI_API_KEY=
```

## Frontend .env

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# WebSocket URL
NEXT_PUBLIC_WS_URL=

# Firebase
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=

```
