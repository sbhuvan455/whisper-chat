import { Server } from "socket.io"

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
            console.log("Socket connected: " + socket.id)
        })
    }
}