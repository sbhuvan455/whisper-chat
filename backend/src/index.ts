import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { PrismaClient } from '../generated/prisma'

// import { clerkMiddleware } from '@clerk/express'

import roomRouter from "./routes/room.routes"
import { ChatManager } from './utils/chatManager';
import { ACCEPT_USER, CREATE_ROOM, DELETE_MESSAGE, END_ROOM, JOIN_ROOM, LEAVE, NEW_MESSAGE, REMOVE_USER, SEND_FILE } from './types';
import { initializeActiveRooms } from './controller/room.controller';

export const app = express();
const PORT = process.env.PORT || 8080;

const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json())
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}))
app.use(express.urlencoded({ extended: true }))

export const prisma = new PrismaClient()

const chatManager = new ChatManager();
initializeActiveRooms(chatManager);

wss.on('connection', (ws) => {
  console.log('A new client connected');

  ws.on('error', console.error);

  ws.send('Welcome to Whisper Chat WebSocket server!');

  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message.toString());

    const { type, data } = parsedMessage;

    if (type === CREATE_ROOM) {
      chatManager.addRoom(ws, data);
    }

    if (type === JOIN_ROOM) {
      console.log('Received JOIN_ROOM message:', data);
      chatManager.joinRoom(ws, data.roomId, data.user);
    }

    if (type === ACCEPT_USER) {
      console.log('Received ACCEPT_USER message:', data);
      chatManager.acceptUser(data.roomId, data.user);
    }

    if (type === NEW_MESSAGE) {
      chatManager.sendMessage(ws, data.user, data.roomId, data.message);
    }

    if (type === SEND_FILE) {
      chatManager.sendFile(ws, data.user, data.roomId, data.file, data.fileName, data.fileSize);
    }

    if (type === REMOVE_USER) {
      chatManager.removeUser(data.roomId, data.user, data.adminId);
    }

    if (type === DELETE_MESSAGE) {
      chatManager.deleteMessage(data.roomId, data.messageId, data.userId);
    }

    if (type === END_ROOM) {
      chatManager.endRoom(data.roomId, data.userId);
    }

    if (type === LEAVE) {
      chatManager.leaveRoom(ws, data.roomId, data.userId);
    }
  })
});

app.use("/api/v1/room", roomRouter)

server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT} and ${process.env.CORS_ORIGIN}`);
});
