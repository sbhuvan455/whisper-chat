"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const ws_1 = require("ws");
const prisma_1 = require("../generated/prisma");
const express_2 = require("@clerk/express");
const room_routes_1 = __importDefault(require("./routes/room.routes"));
exports.app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
const server = (0, http_1.createServer)(exports.app);
const wss = new ws_1.WebSocketServer({ server });
exports.app.use(express_1.default.json());
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use((0, express_2.clerkMiddleware)());
exports.prisma = new prisma_1.PrismaClient();
wss.on('connection', (ws) => {
    console.log('A new client connected');
    ws.on('error', console.error);
    ws.on('message', (data) => {
        console.log('received:', data.toString());
        ws.send(`Server received: ${data}`);
    });
    ws.send('Welcome to Whisper Chat WebSocket server!');
});
exports.app.use("/api/v1/room", room_routes_1.default);
server.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
