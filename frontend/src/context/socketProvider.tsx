"use client"

import { io, Socket } from "socket.io-client"
import React, { createContext, useContext, useEffect, useState } from "react"


interface SocketProviderProps{
    children?: React.ReactNode
}

const socketContext = createContext<Socket | null>(null);

export const useSocket = () => {
    const state = useContext(socketContext)
    if(!state) throw new Error("state is undefined!");

    return state;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {

    const [socket, setSocket] = useState<Socket | null>(null)


    useEffect(() => {
        const _socket: Socket = io('http://localhost:8000')

        _socket.on('connect', () => {
            console.log("connected to the database server");
        })

        _socket.on('connect_error', (err) => {
            console.error('Connection error:', err);
        });

        setSocket(_socket);

        return () => {
            _socket.disconnect();
            setSocket(null);
        }

    }, [])

    return (
        <socketContext.Provider value={socket}>
            {children}
        </socketContext.Provider>
    )
}