import { WebSocket } from 'ws';
import { ROOM, ROOM_NOT_FOUND, JOIN_ROOM } from '../types';
import { createNewMember } from '../controller/room.controller';

export class ChatManager {
    private rooms: Map<string, string>;
    private admin: Map<string, WebSocket>;

    constructor() {
        this.rooms = new Map<string, string>();
        this.admin = new Map<string, WebSocket>();
    }

    public addRoom(ws: WebSocket, data: ROOM){
        const { id, adminId } = data;

        this.rooms.set(id, adminId);
        this.admin.set(adminId, ws);
    }

    public async joinRoom(ws: WebSocket, roomId: string, user: any){
        const { userId } = JSON.parse(user.toString());

        if(this.rooms.has(roomId)){
            await createNewMember(userId, roomId)
                .then((res) => {
                    if(res.success){
                        if(res.isAdmin){
                            // Join him to the room
                            this.admin.set(userId, ws);
                        }else{
                            // Ask the admin to accept the user"
                            const adminId = this.rooms.get(roomId);
                            const adminWs = this.admin.get(adminId!);

                            if(adminWs){
                                adminWs.send(JSON.stringify({
                                    type: JOIN_ROOM,
                                    data: {
                                        userId,
                                        roomId,
                                        message: "A new user is trying to join the room, please accept or reject him"
                                    }
                                }))
                            }else{
                                ws.send(JSON.stringify({ type: ROOM_NOT_FOUND, data: { roomId } }));
                            }
                        }
                    }
                })

        } else {
            ws.send(JSON.stringify({ type: ROOM_NOT_FOUND, data: { roomId } }));
        }
    }

    public async acceptUser(ws:WebSocket, roomId: string, user: any){
        const { userId } = JSON.parse(user.toString());

        await createNewMember(userId, roomId)
                .then((response) => {
                    if(response.success){
                        ws.send(JSON.stringify({
                            type: JOIN_ROOM,
                            data: {
                                userId,
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
                                    userId,
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
}