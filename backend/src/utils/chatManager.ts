import { WebSocket } from 'ws';
import { ROOM, ROOM_NOT_FOUND, JOIN_ROOM, PERMISSION, User, ADMIN_NOT_IN_ROOM } from '../types';
import { createNewMember } from '../controller/room.controller';
import { RoomManager } from './roomManager';

export class ChatManager {
    private rooms: Map<string, string>;  // Maps roomId to adminId
    private admin: Map<string, WebSocket>; // Maps adminId to WebSocket connection
    private roomObj: Map<string, RoomManager>; // Maps roomId to Room object connection

    constructor() {
        this.rooms = new Map<string, string>();
        this.admin = new Map<string, WebSocket>();
        this.roomObj = new Map<string, RoomManager>();
    }

    public addRoom(ws: WebSocket, data: ROOM){
        const { roomId, adminId } = data;

        this.rooms.set(roomId, adminId);
        this.admin.set(adminId, ws);
    }

    public async joinRoom(ws: WebSocket, roomId: string, user: any){
        const { userId } = JSON.parse(user.toString())?.id;

        if(this.rooms.has(roomId)){
            await createNewMember(userId, roomId)
                .then((res) => {
                    if(res.success){
                        if(res.isAdmin){
                            // Join him to the room
                            this.admin.set(userId, ws);

                            const roomManager = this.roomObj.get(roomId);
                            if(roomManager) {
                                roomManager.addMember(userId, ws);
                            }else {
                                // Create a new RoomManager if it doesn't exist
                                const newRoomManager = new RoomManager(roomId, userId);
                                newRoomManager.addMember(userId, ws);
                                this.roomObj.set(roomId, newRoomManager);
                            }

                            ws.send(JSON.stringify({
                                type: JOIN_ROOM,
                                data: {
                                    user,
                                    roomId,
                                    message: "You have joined the room as an admin"
                                }
                            }))

                        }else{
                            // Ask the admin to accept the user"
                            const adminId = this.rooms.get(roomId);
                            const adminWs = this.admin.get(adminId!);

                            if(adminWs){
                                adminWs.send(JSON.stringify({
                                    type: PERMISSION,
                                    data: {
                                        user,
                                        roomId,
                                        message: "A new user is trying to join the room, please accept or reject him"
                                    }
                                }))
                            }else{
                                ws.send(JSON.stringify({ type: ADMIN_NOT_IN_ROOM, data: { roomId } }));
                            }
                        }
                    }
                })

        } else {
            ws.send(JSON.stringify({ type: ROOM_NOT_FOUND, data: { roomId } }));
        }
    }

    public async acceptUser(ws:WebSocket, roomId: string, user: any){
        const { userId } = JSON.parse(user.toString()).id;

        await createNewMember(userId, roomId)
                .then((response) => {
                    if(response.success){
                        // Add the user to the room

                        const roomManager = this.roomObj.get(roomId);
                        if(roomManager) {
                            roomManager.addMember(userId, ws);
                        }

                        // Send a message to the user that he has been accepted
                        ws.send(JSON.stringify({
                            type: JOIN_ROOM,
                            data: {
                                user,
                                roomId,
                                message: "You have been accepted to the room"
                            }
                        }))

                        const adminId = this.rooms.get(roomId);
                        const adminWs = this.admin.get(adminId!);

                        if(adminWs){
                            adminWs.send(JSON.stringify({
                                type: JOIN_ROOM,
                                data: {
                                    user,
                                    roomId,
                                    message: "The user has been accepted to the room"
                                }
                            }))
                        }
                    }
                })
                .catch((err) => {
                    console.log('Error accepting user:', err);
                })
    }

    public async sendMessage(ws: WebSocket, userId: string, roomId: string, message: string) {
        const roomManager = this.roomObj.get(roomId);

        if(!roomManager) {
            ws.send(JSON.stringify({ type: ROOM_NOT_FOUND, data: { roomId } }));
            return;
        }

        roomManager.handleMessage(userId, message);
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