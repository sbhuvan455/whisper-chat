import { Server } from "socket.io"
import { CreateRoom } from "../controllers/room.controller.js";

export class SocketService {
    
    constructor(){
        console.log("Init Socket Service")
        this._io = new Server({
            cors: {
                allowedHeaders: ['*'],
                origin: "*"
            }
        });

        this.setupListeners();
    }

    get io(){
        return this._io;
    }

    setupListeners = () => {
        this._io.on('connection', (socket) => {
            console.log("Socket connected: " + socket.id);

            socket.on('createRoom', async (roomInfo) => {
                const { success, data } = await CreateRoom({ ...roomInfo, socketId: socket.id });

                if(success) {
                    socket.emit("roomCreated", data)
                }else {
                    socket.emit("roomError", data);
                }
            })
        })
    }
}