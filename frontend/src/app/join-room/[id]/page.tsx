'use client'

import { useEffect, useState } from 'react'
import { redirect, useParams } from 'next/navigation'
import { useUser } from '@clerk/clerk-react'
import { useSocket } from '@/context/socketProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DELETE_MESSAGE, JOIN_ROOM, MUTE_USER, REMOVE_USER, ACCEPT_USER, REJECT_USER, NEW_MESSAGE, PERMISSION, MEMBERS_UPDATE, REMOVED } from '../../../../types'

interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: string;
}

interface Member {
    id: string;
    name: string;
    avatar: string;
    muted?: boolean;
}

export default function RoomPage() {
    const { id: roomId } = useParams()
    const { user } = useUser()
    const { socket } = useSocket()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [members, setMembers] = useState<Member[]>([])
    const [pending, setPending] = useState<any[]>([])

    const isAdmin = true // Replace with logic to check if current user is admin

    useEffect(() => {
        if (!socket || !user || !roomId) return

        const handleMessage = (event: MessageEvent) => {
            const { type, data } = JSON.parse(event.data)

            switch (type) {
                case NEW_MESSAGE:
                    setMessages(prev => [...prev, data])
                    break
                case MEMBERS_UPDATE:
                    setMembers(data)
                    break
                case PERMISSION:
                    setPending(data)
                    break
                case DELETE_MESSAGE:
                    setMessages(prev => prev.filter(msg => msg.id !== data.messageId))
                    break
                case REMOVED:
                    alert(`${data.user.name} has been removed from the room.`)

                    if(data.user.id === user?.id) {
                        redirect('/join-room')
                    }
                    setMembers(prev => prev.filter(member => member.id !== data.user.id))
            }
        }

        socket.addEventListener('message', handleMessage)

        return () => socket.removeEventListener('message', handleMessage)
    }, [socket, user, roomId])

    const sendMessage = () => {
        if (!input.trim()) return

        const msg = {
            type: NEW_MESSAGE,
            data: {
                messages: input,
                user,
                roomId
            },

        }

        socket?.send(JSON.stringify(msg))
        setInput('')
    }

    const deleteMessage = (msgId: string) => {
        socket?.send(JSON.stringify({
            type: DELETE_MESSAGE,
            data: {
                roomId,
                messageId: msgId,
                userId: user?.id
            }
        }))
    }

    const muteUser = (userId: string) => {
        socket?.send(JSON.stringify({
            type: MUTE_USER,
            data: { roomId, userId }
        }))
    }

    const removeUser = (user: any) => {
        socket?.send(JSON.stringify({
            type: REMOVE_USER,
            data: { roomId, user, adminId: user?.id }
        }))
    }

    const acceptUser = (user: string) => {
        socket?.send(JSON.stringify({
            type: ACCEPT_USER,
            data: { roomId, user }
        }))
    }

    const rejectUser = (user: string) => {
        socket?.send(JSON.stringify({
            type: REJECT_USER,
            data: { roomId, user }
        }))
    }

    return (
        <div className="flex h-screen">
            {/* Left Sidebar */}
            <div className="w-1/4 border-r p-4 space-y-4">
                {isAdmin ? (
                    <Tabs defaultValue="members" className="w-full">
                        <TabsList className="grid grid-cols-2">
                            <TabsTrigger value="members">Members</TabsTrigger>
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                        </TabsList>
                        <TabsContent value="members">
                            <ScrollArea className="h-[calc(100vh-120px)]">
                                {members.map((m) => (
                                    <Card key={m.id} className="mb-2">
                                        <CardHeader className="flex justify-between items-center">
                                            <CardTitle>{m.name}</CardTitle>
                                            <div className="space-x-1">
                                                <Button size="sm" onClick={() => muteUser(m.id)}>Mute</Button>
                                                <Button size="sm" variant="destructive" onClick={() => removeUser(m)}>Remove</Button>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="pending">
                            <ScrollArea className="h-[calc(100vh-120px)]">
                                {pending.map((p) => (
                                    <Card key={p.user.id} className="mb-2">
                                        <CardHeader className="flex justify-between items-center">
                                            <CardTitle>{p.user.name}</CardTitle>
                                            <div className="space-x-1">
                                                <Button size="sm" onClick={() => acceptUser(p)}>Accept</Button>
                                                <Button size="sm" variant="destructive" onClick={() => rejectUser(p)}>Reject</Button>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <>
                        <h2 className="text-lg font-semibold mb-2">Members</h2>
                        <ScrollArea className="h-[calc(100vh-100px)]">
                            {members.map((m) => (
                                <div key={m.id} className="py-2 border-b">{m.name}</div>
                            ))}
                        </ScrollArea>
                    </>
                )}
            </div>

            {/* Right Chat Section */}
            <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-4 space-y-2">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className="flex items-start justify-between bg-muted p-2 rounded-lg"
                        >
                            <div>
                                <strong>{msg.userName}</strong>
                                <p className="text-sm">{msg.content}</p>
                            </div>
                            {(isAdmin || msg.userId === user?.id) && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteMessage(msg.id)}
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                    ))}
                </ScrollArea>
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        sendMessage()
                    }}
                    className="p-4 border-t flex items-center gap-2"
                >
                    <Input
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <Button type="submit">Send</Button>
                </form>
            </div>
        </div>
    )
}
