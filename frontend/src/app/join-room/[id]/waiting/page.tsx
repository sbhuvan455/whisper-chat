'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/clerk-react'
import { Loader2 } from 'lucide-react'
import { useSocket } from '@/context/socketProvider'
import { JOIN_ROOM, ADMIN_NOT_IN_ROOM } from '../../../../../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const WaitingRoom = () => {
    const { id: roomId } = useParams()
    const { user, isSignedIn } = useUser()
    const { socket } = useSocket()
    const router = useRouter()

    const [adminNotInRoom, setAdminNotInRoom] = useState(false)

    console.log('WaitingRoom component rendered with roomId:', roomId, 'user:', user)

    useEffect(() => {
        console.log('WaitingRoom component mounted')
        if (!socket || !user || !roomId) return
        console.log('WaitingRoom component mounted', user)
        const message = {
            type: JOIN_ROOM,
            data: {
                roomId,
                user: {
                    id: user.id,
                    fullName: user.fullName || '',
                    imageUrl: user.imageUrl || null,
                }
            }
        }

        console.log('Sending JOIN_ROOM message:', message)

        socket.send(JSON.stringify(message))

        const handleMessage = (event: MessageEvent) => {
            try {
                const { type, data } = JSON.parse(event.data)

                if (type === JOIN_ROOM) {
                    router.push(`/join-room/${roomId}`)
                }

                if (type === ADMIN_NOT_IN_ROOM) {
                    setAdminNotInRoom(true)
                }
            } catch (err) {
                console.error('Invalid message format:', err)
            }
        }

        socket.addEventListener('message', handleMessage)

        return () => {
            socket.removeEventListener('message', handleMessage)
        }
    }, [socket, user, roomId, router])

    if (!isSignedIn) {
        return (
            <Card className="max-w-md mx-auto mt-40">
                <CardHeader>
                    <CardTitle>Unauthorized</CardTitle>
                    <CardDescription>Please sign in to join the room.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <div className="flex flex-col justify-center items-center min-h-screen">
            <Loader2 className="animate-spin w-10 h-10 text-muted-foreground mb-4" />
            <h1 className="text-xl font-semibold">Joining Room...</h1>
            <p className="text-sm text-muted-foreground mt-2 text-center max-w-sm">
                Wait for the admin to accept you into the room. If you are the admin, you'll be redirected automatically.
            </p>
            {adminNotInRoom && (
                <p className="text-red-500 mt-4">Admin has not joined the room yet. Please wait or try again shortly.</p>
            )}
        </div>
    )
}

export default WaitingRoom
