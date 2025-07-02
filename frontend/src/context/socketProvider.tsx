"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { DISCONNECT } from "../../types"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080"

interface SocketContextType {
    socket: WebSocket | null
    isConnected: boolean
    reconnecting: boolean
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    reconnecting: false,
})

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [isConnected, setIsConnected] = useState(false)
    const [reconnecting, setReconnecting] = useState(false)
    const socketRef = useRef<WebSocket | null>(null)
    const reconnectRef = useRef<NodeJS.Timeout | null>(null)

    const connect = () => {
        console.log("[WebSocket] Connecting to:", WS_URL)
        const ws = new WebSocket(WS_URL)

        ws.onopen = () => {
            console.log("[WebSocket] Connected")
            socketRef.current = ws
            setIsConnected(true)
            setReconnecting(false)
        }

        ws.onclose = () => {
            console.warn("[WebSocket] Disconnected")
            setIsConnected(false)
            socketRef.current = null

            if (!reconnectRef.current) {
                setReconnecting(true)
                reconnectRef.current = setTimeout(() => {
                    connect()
                    reconnectRef.current = null
                }, 3000)
            }
        }

        ws.onerror = (err) => {
            console.error("[WebSocket] Error:", err)
            ws.close()
        }
    }

    useEffect(() => {
        connect()

        return () => {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ type: DISCONNECT }))
            }
            socketRef.current?.close()
            if (reconnectRef.current) clearTimeout(reconnectRef.current)
        }
    }, [])

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, isConnected, reconnecting }}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocket = () => useContext(SocketContext)
