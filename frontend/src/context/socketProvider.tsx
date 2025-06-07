"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DISCONNECT } from "../../types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

interface SocketContextType {
    socket: WebSocket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        console.log("Initializing WebSocket connection to:", WS_URL);
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            setSocket(ws);
            setIsConnected(true);
        };

        ws.onclose = () => {
            setSocket(null);
            setIsConnected(false);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: DISCONNECT }));
            }
            ws.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
