'use client'

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSocket } from "@/context/socketProvider"
import { useUser } from "@clerk/clerk-react"
import { JOIN_ROOM } from "../../../../../types"
import { Loader2 } from "lucide-react"

export default function ReconnectingPage() {
    const { id: roomId } = useParams()
    const { user } = useUser()
    const { socket, isConnected } = useSocket()
    const router = useRouter()

    useEffect(() => {
        console.log("[ReconnectingPage] Mounted with roomId:", roomId, "user:", user, "isConnected:", isConnected)
        if (!roomId || !user || !isConnected || !socket) return

        const interval = setInterval(() => {
            console.log("[ReconnectingPage] Attempting to rejoin room")

            const message = {
                type: JOIN_ROOM,
                data: {
                    roomId,
                    user: {
                        id: user.id,
                        fullName: user.fullName || '',
                        imageUrl: user.imageUrl || null,
                    },
                },
            }

            socket.send(JSON.stringify(message))
        }, 5000 + Math.random() * 2000) // 5 to 7 seconds

        const handleMessage = (event: MessageEvent) => {
            try {
                const { type, data } = JSON.parse(event.data)

                if (type === JOIN_ROOM) {
                    router.push(`/join-room/${roomId}`)
                }

            } catch (err) {
                console.error('Invalid message format:', err)
            }
        }

        socket.addEventListener("message", handleMessage)

        return () => {
            clearInterval(interval)
            socket.removeEventListener("message", handleMessage)
        }
    }, [roomId, user, isConnected, socket])

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Reconnecting to room...</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                Trying to restore your connection. Please hold on...
            </p>
        </div>
    )
}
