
import express from 'express';
import { createServer } from 'http'; 
import { WebSocketServer } from 'ws';
import { PrismaClient } from '../generated/prisma'

import { clerkMiddleware } from '@clerk/express'

import roomRouter from "./routes/room.routes"
import { ChatManager } from './utils/chatManager';
import { ACCEPT_USER, CREATE_ROOM, JOIN_ROOM } from './types';

export const app = express();
const PORT = process.env.PORT || 8080;

const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(clerkMiddleware())

export const prisma = new PrismaClient()

const chatManager = new ChatManager();

wss.on('connection', (ws) => {
  console.log('A new client connected');

  ws.on('error', console.error);

  ws.send('Welcome to Whisper Chat WebSocket server!');

  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message.toString());

    const { type, data } = parsedMessage;

    if(type === CREATE_ROOM){
      chatManager.addRoom(ws, data);
    }

    if(type === JOIN_ROOM){
      chatManager.joinRoom(ws, data.roomId, data.user);
    }

    if(type === ACCEPT_USER){
      
    }
  })
});

app.use("/api/v1/room", roomRouter)

server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
