"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatManager = void 0;
const types_1 = require("../types");
const room_controller_1 = require("../controller/room.controller");
class ChatManager {
    constructor() {
        this.rooms = new Map();
        this.admin = new Map();
        this.roomObj = new Map();
    }
    addRoom(ws, data) {
        const { roomId, adminId } = data;
        this.rooms.set(roomId, adminId);
        this.admin.set(adminId, ws);
    }
    joinRoom(ws, roomId, user) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { userId } = (_a = JSON.parse(user.toString())) === null || _a === void 0 ? void 0 : _a.id;
            if (this.rooms.has(roomId)) {
                yield (0, room_controller_1.createNewMember)(userId, roomId)
                    .then((res) => {
                    if (res.success) {
                        if (res.isAdmin) {
                            // Join him to the room
                            this.admin.set(userId, ws);
                        }
                        else {
                            // Ask the admin to accept the user"
                            const adminId = this.rooms.get(roomId);
                            const adminWs = this.admin.get(adminId);
                            if (adminWs) {
                                adminWs.send(JSON.stringify({
                                    type: types_1.PERMISSION,
                                    data: {
                                        user,
                                        roomId,
                                        message: "A new user is trying to join the room, please accept or reject him"
                                    }
                                }));
                            }
                            else {
                                ws.send(JSON.stringify({ type: types_1.ROOM_NOT_FOUND, data: { roomId } }));
                            }
                        }
                    }
                });
            }
            else {
                ws.send(JSON.stringify({ type: types_1.ROOM_NOT_FOUND, data: { roomId } }));
            }
        });
    }
    acceptUser(ws, roomId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId } = JSON.parse(user.toString());
            yield (0, room_controller_1.createNewMember)(userId, roomId)
                .then((response) => {
                if (response.success) {
                    ws.send(JSON.stringify({
                        type: types_1.JOIN_ROOM,
                        data: {
                            userId,
                            roomId,
                            message: "You have been accepted to the room"
                        }
                    }));
                    const adminId = this.rooms.get(roomId);
                    const adminWs = this.admin.get(adminId);
                    if (adminWs) {
                        adminWs.send(JSON.stringify({
                            type: types_1.JOIN_ROOM,
                            data: {
                                userId,
                                roomId,
                                message: "The user has been accepted to the room"
                            }
                        }));
                    }
                }
            })
                .catch((err) => {
                console.log('Error accepting user:', err);
            });
        });
    }
    sendMessage(ws, userId, roomId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const roomManager = this.roomObj.get(roomId);
            if (!roomManager) {
                ws.send(JSON.stringify({ type: types_1.ROOM_NOT_FOUND, data: { roomId } }));
                return;
            }
            roomManager.handleMessage(userId, message);
        });
    }
    endRoom(roomId, requesterId) {
        const adminId = this.rooms.get(roomId);
        if (adminId !== requesterId)
            return;
        const roomManager = this.roomObj.get(roomId);
        if (!roomManager)
            return;
        roomManager.endRoom(); // Broadcasts ROOM_CLOSED and disconnects everyone
        // Clean up maps
        this.rooms.delete(roomId);
        this.admin.delete(adminId);
        this.roomObj.delete(roomId);
    }
    isAdmin(ws, roomId) {
        const adminId = this.rooms.get(roomId);
        const adminWs = this.admin.get(adminId);
        return ws === adminWs;
    }
}
exports.ChatManager = ChatManager;
