"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const ws_1 = require("ws");
const prisma_1 = require("../generated/prisma");
// import { clerkMiddleware } from '@clerk/express'
const room_routes_1 = __importDefault(require("./routes/room.routes"));
const chatManager_1 = require("./utils/chatManager");
const types_1 = require("./types");
const room_controller_1 = require("./controller/room.controller");
exports.app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
const server = (0, http_1.createServer)(exports.app);
const wss = new ws_1.WebSocketServer({ server });
exports.app.use(express_1.default.json());
exports.app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.prisma = new prisma_1.PrismaClient();
const chatManager = new chatManager_1.ChatManager();
(0, room_controller_1.initializeActiveRooms)(chatManager);
wss.on('connection', (ws) => {
    console.log('A new client connected');
    ws.on('error', console.error);
    ws.send('Welcome to Whisper Chat WebSocket server!');
    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message.toString());
        const { type, data } = parsedMessage;
        if (type === types_1.CREATE_ROOM) {
            chatManager.addRoom(ws, data);
        }
        if (type === types_1.JOIN_ROOM) {
            console.log('Received JOIN_ROOM message:', data);
            chatManager.joinRoom(ws, data.roomId, data.user);
        }
        if (type === types_1.ACCEPT_USER) {
            chatManager.acceptUser(data.ws, data.roomId, data.user);
        }
        if (type === types_1.NEW_MESSAGE) {
            chatManager.sendMessage(ws, data.user, data.roomId, data.message);
        }
        if (type === types_1.REMOVE_USER) {
            chatManager.removeUser(data.roomId, data.user, data.adminId);
        }
    });
});
exports.app.use("/api/v1/room", room_routes_1.default);
server.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT} and ${process.env.CORS_ORIGIN}`);
});
