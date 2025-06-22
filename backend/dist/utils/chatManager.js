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
const roomManager_1 = require("./roomManager");
class ChatManager {
    constructor() {
        this.rooms = new Map();
        this.admin = new Map();
        this.roomObj = new Map();
        this.pendingMembers = new Map();
    }
    initRooms(roomId, adminId) {
        this.rooms.set(roomId, adminId);
    }
    clearRooms() {
        this.rooms.clear();
    }
    addRoom(ws, data) {
        const { roomId, adminId } = data;
        this.rooms.set(roomId, adminId);
        this.admin.set(adminId, ws);
    }
    joinRoom(ws, roomId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = user === null || user === void 0 ? void 0 : user.id;
            console.log('User trying to join room:', user, roomId);
            if (this.rooms.has(roomId)) {
                yield (0, room_controller_1.createNewMember)(user, roomId)
                    .then((res) => {
                    console.log('Response from createNewMember:', res);
                    if (res.success) {
                        if (res.isAdmin) {
                            // Join him to the room
                            this.admin.set(userId, ws);
                            const roomManager = this.roomObj.get(roomId);
                            if (roomManager) {
                                roomManager.addMember(user, ws);
                            }
                            else {
                                // Create a new RoomManager if it doesn't exist
                                const newRoomManager = new roomManager_1.RoomManager(roomId, userId);
                                newRoomManager.addMember(user, ws);
                                this.roomObj.set(roomId, newRoomManager);
                            }
                            ws.send(JSON.stringify({
                                type: types_1.JOIN_ROOM,
                                data: {
                                    user,
                                    isAdmin: true,
                                    roomId,
                                    message: "You have joined the room as an admin"
                                }
                            }));
                        }
                        else {
                            // Ask the admin to accept the user"
                            const adminId = this.rooms.get(roomId);
                            const adminWs = this.admin.get(adminId);
                            if (!this.pendingMembers.has(roomId)) {
                                this.pendingMembers.set(roomId, new Map());
                            }
                            this.pendingMembers.get(roomId).set(userId, ws);
                            console.log('Admin WebSocket:', user);
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
                                ws.send(JSON.stringify({ type: types_1.ADMIN_NOT_IN_ROOM, data: { roomId } }));
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
    acceptUser(roomId, user) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const userId = user.id;
            const pending = (_a = this.pendingMembers.get(roomId)) === null || _a === void 0 ? void 0 : _a.get(userId);
            if (!pending) {
                console.log(`No pending connection found for ${userId} in room ${roomId}`);
                return;
            }
            yield (0, room_controller_1.acceptUser)(user, roomId)
                .then((response) => {
                var _a;
                if (response.success) {
                    // Add the user to the room
                    const roomManager = this.roomObj.get(roomId);
                    if (roomManager) {
                        roomManager.addMember(user, pending);
                    }
                    // Send a message to the user that he has been accepted
                    pending.send(JSON.stringify({
                        type: types_1.JOIN_ROOM,
                        data: {
                            user,
                            roomId,
                            message: "You have been accepted to the room"
                        }
                    }));
                    (_a = this.pendingMembers.get(roomId)) === null || _a === void 0 ? void 0 : _a.delete(userId);
                }
            })
                .catch((err) => {
                console.log('Error accepting user:', err);
            });
        });
    }
    rejectUser(ws, roomId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const adminId = this.rooms.get(roomId);
            const adminWs = this.admin.get(adminId);
            if (adminWs) {
                adminWs.send(JSON.stringify({
                    type: types_1.PERMISSION,
                    data: {
                        ws,
                        user,
                        roomId,
                        message: "The user has been rejected from the room"
                    }
                }));
            }
            // Notify the user that he has been rejected
            ws.send(JSON.stringify({
                type: types_1.PERMISSION,
                data: {
                    message: "You have been rejected from the room",
                    roomId
                }
            }));
        });
    }
    removeUser(roomId, user, adminId) {
        const roomManager = this.roomObj.get(roomId);
        if (!roomManager)
            return;
        if (!roomManager.isAdmin(adminId)) {
            return; // Only admin can remove users
        }
        roomManager.removeMember(user);
    }
    sendMessage(ws, user, roomId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("I am sending the message", message);
            const roomManager = this.roomObj.get(roomId);
            console.log("Here");
            if (!roomManager) {
                ws.send(JSON.stringify({ type: types_1.ROOM_NOT_FOUND, data: { roomId } }));
                console.log("room nhi mila bhai");
                return;
            }
            roomManager.handleMessage(user, message);
            console.log("Ho gya join");
        });
    }
    sendFile(ws, user, roomId, fileUrl, fileName, fileSize) {
        return __awaiter(this, void 0, void 0, function* () {
            const roomManager = this.roomObj.get(roomId);
            if (!roomManager) {
                ws.send(JSON.stringify({ type: types_1.ROOM_NOT_FOUND, data: { roomId } }));
                return;
            }
            roomManager.handleFile(user, fileUrl, fileName, fileSize);
        });
    }
    leaveRoom(ws, roomId, user) {
        const roomManager = this.roomObj.get(roomId);
        if (!roomManager) {
            ws.send(JSON.stringify({ type: types_1.ROOM_NOT_FOUND, data: { roomId } }));
            return;
        }
        roomManager.removeMember(user);
        ws.send(JSON.stringify({ type: types_1.REMOVED, data: { message: "You have left the room", roomId } }));
    }
    deleteMessage(roomId, chatId, userId) {
        const roomManager = this.roomObj.get(roomId);
        if (!roomManager) {
            console.log("Room not found for deleting message");
            return;
        }
        roomManager.deleteMessage(chatId, userId);
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
