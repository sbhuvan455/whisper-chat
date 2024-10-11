import dotenv from "dotenv";
import express from 'express';
import http from 'http';
import { Connect } from "./db/connectDB.js";
import { SocketService } from "./socket/socket.js";

dotenv.config();
const app = express();
const httpServer = http.createServer(app);

const socketService = new SocketService()

socketService.io.attach(httpServer);

const port = process.env.PORT || 8000;


Connect()
.then((response) => {
    console.log("Connection with the database successfully established")

    httpServer.listen(port, () => {
        console.log(`server listening at port http://localhost:${port}`);
    })
})
.catch((error) => {
    console.error("An error occurred while connecting to database", error);
    process.exit(1);
})