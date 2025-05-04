
import express from 'express';
import { createServer } from 'http'; 
import { WebSocketServer } from 'ws';

const app = express();
const PORT = process.env.PORT || 8080;

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('A new client connected');

  ws.on('error', console.error);

  ws.on('message', (data) => {
    console.log('received:', data.toString());
    ws.send(`Server received: ${data}`);
  });

  ws.send('Welcome to Whisper Chat WebSocket server!');
});


server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
