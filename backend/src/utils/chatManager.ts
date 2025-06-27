import { WebSocket } from 'ws';
import { ROOM, ROOM_NOT_FOUND, JOIN_ROOM, PERMISSION, User, ADMIN_NOT_IN_ROOM, REMOVED } from '../types';
import { acceptUser, createNewMember } from '../controller/room.controller';
import { RoomManager } from './roomManager';

export class ChatManager {
    private rooms: Map<string, string>;
    private admin: Map<string, WebSocket>;
    private roomObj: Map<string, RoomManager>;
    private pendingMembers: Map<string, Map<string, WebSocket>>;

    constructor() {
        this.rooms = new Map<string, string>();
        this.admin = new Map<string, WebSocket>();
        this.roomObj = new Map<string, RoomManager>();
        this.pendingMembers = new Map();
    }

    public initRooms(roomId: string, adminId: string) {
        this.rooms.set(roomId, adminId);
    }

    public clearRooms() {
        this.rooms.clear();
    }

    public addRoom(ws: WebSocket, data: ROOM) {
        const { roomId, adminId } = data;

        this.rooms.set(roomId, adminId);
        this.admin.set(adminId, ws);
    }

    public async joinRoom(ws: WebSocket, roomId: string, user: any) {
        const userId = user?.id;

        console.log('User trying to join room:', user, roomId);

        if (this.rooms.has(roomId)) {
            await createNewMember(user, roomId)
                .then((res) => {
                    console.log('Response from createNewMember:', res);
                    if (res.success) {
                        if (res.isAdmin) {
                            // Join him to the room
                            this.admin.set(userId, ws);

                            const roomManager = this.roomObj.get(roomId);
                            if (roomManager) {
                                roomManager.addMember(user, ws);
                            } else {
                                // Create a new RoomManager if it doesn't exist
                                const newRoomManager = new RoomManager(roomId, userId);
                                newRoomManager.addMember(user, ws);
                                this.roomObj.set(roomId, newRoomManager);
                            }

                            ws.send(JSON.stringify({
                                type: JOIN_ROOM,
                                data: {
                                    user,
                                    isAdmin: true,
                                    roomId,
                                    message: "You have joined the room as an admin"
                                }
                            }))

                        } else {
                            // Ask the admin to accept the user"
                            const adminId = this.rooms.get(roomId);
                            const adminWs = this.admin.get(adminId!);

                            if (!this.pendingMembers.has(roomId)) {
                                this.pendingMembers.set(roomId, new Map());
                            }
                            this.pendingMembers.get(roomId)!.set(userId, ws);

                            console.log('Admin WebSocket:', user);

                            if (adminWs) {
                                adminWs.send(JSON.stringify({
                                    type: PERMISSION,
                                    data: {
                                        user,
                                        roomId,
                                        message: "A new user is trying to join the room, please accept or reject him"
                                    }
                                }))
                            } else {
                                ws.send(JSON.stringify({ type: ADMIN_NOT_IN_ROOM, data: { roomId } }));
                            }
                        }
                    }
                })

        } else {
            ws.send(JSON.stringify({ type: ROOM_NOT_FOUND, data: { roomId } }));
        }
    }

    public async acceptUser(roomId: string, user: any) {
        const userId = user.id;
        const pending = this.pendingMembers.get(roomId)?.get(userId);

        if (!pending) {
            console.log(`No pending connection found for ${userId} in room ${roomId}`);
            return;
        }

        await acceptUser(user, roomId)
            .then((response) => {
                if (response.success) {
                    // Add the user to the room

                    const roomManager = this.roomObj.get(roomId);
                    if (roomManager) {
                        roomManager.addMember(user, pending);
                    }

                    // Send a message to the user that he has been accepted
                    pending.send(JSON.stringify({
                        type: JOIN_ROOM,
                        data: {
                            user,
                            roomId,
                            message: "You have been accepted to the room"
                        }
                    }))

                    this.pendingMembers.get(roomId)?.delete(userId);
                }
            })
            .catch((err) => {
                console.log('Error accepting user:', err);
            })
    }

    public async rejectUser(ws: WebSocket, roomId: string, user: any) {

        const adminId = this.rooms.get(roomId);
        const adminWs = this.admin.get(adminId!);

        if (adminWs) {
            adminWs.send(JSON.stringify({
                type: PERMISSION,
                data: {
                    ws,
                    user,
                    roomId,
                    message: "The user has been rejected from the room"
                }
            }))
        }

        // Notify the user that he has been rejected
        ws.send(JSON.stringify({
            type: PERMISSION,
            data: {
                message: "You have been rejected from the room",
                roomId
            }
        }));
    }

    public removeUser(roomId: string, user: any, adminId: string) {
        const roomManager = this.roomObj.get(roomId);
        if (!roomManager) return;

        if (!roomManager.isAdmin(adminId)) {
            return; // Only admin can remove users
        }

        roomManager.removeMember(user);
    }

    public async sendMessage(ws: WebSocket, user: string, roomId: string, message: string) {
        console.log("I am sending the message", message);
        const roomManager = this.roomObj.get(roomId);
        console.log("Here")

        if (!roomManager) {
            ws.send(JSON.stringify({ type: ROOM_NOT_FOUND, data: { roomId } }));
            console.log("room nhi mila bhai");
            return;
        }

        roomManager.handleMessage(user, message);
        console.log("Ho gya join");
    }

    public async sendFile(ws: WebSocket, user: string, roomId: string, fileUrl: string, fileName: string, fileSize: number) {
        const roomManager = this.roomObj.get(roomId);
        if (!roomManager) {
            ws.send(JSON.stringify({ type: ROOM_NOT_FOUND, data: { roomId } }));
            return;
        }

        roomManager.handleFile(user, fileUrl, fileName, fileSize);
    }

    public leaveRoom(ws: WebSocket, roomId: string, userId: string) {
        const roomManager = this.roomObj.get(roomId);

        if (!roomManager) {
            ws.send(JSON.stringify({ type: ROOM_NOT_FOUND, data: { roomId } }));
            return;
        }

        roomManager.leaveRoom(userId);
    }

    public deleteMessage(roomId: string, chatId: string, userId: string) {
        const roomManager = this.roomObj.get(roomId);

        if (!roomManager) {
            console.log("Room not found for deleting message");
            return;
        }

        roomManager.deleteMessage(chatId, userId);
    }

    public endRoom(roomId: string, requesterId: string) {
        const adminId = this.rooms.get(roomId);
        if (adminId !== requesterId) return;

        const roomManager = this.roomObj.get(roomId);
        if (!roomManager) return;

        roomManager.endRoom(); // Broadcasts ROOM_CLOSED and disconnects everyone

        // Clean up maps
        this.rooms.delete(roomId);
        this.admin.delete(adminId);
        this.roomObj.delete(roomId);
    }

    public isAdmin(ws: WebSocket, roomId: string): boolean {
        const adminId = this.rooms.get(roomId);
        const adminWs = this.admin.get(adminId!);
        return ws === adminWs;
    }
}