"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { redirect, useParams } from "next/navigation"
import { useUser } from "@clerk/clerk-react"
import { useSocket } from "@/context/socketProvider"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { EMOJI_LIST } from "@/components/emoji"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Trash2,
  UserMinus,
  VolumeX,
  Check,
  X,
  Users,
  Clock,
  Download,
  FileText,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  DELETE_MESSAGE,
  MUTE_USER,
  REMOVE_USER,
  ACCEPT_USER,
  REJECT_USER,
  NEW_MESSAGE,
  PERMISSION,
  MEMBERS_UPDATE,
  REMOVED,
} from "../../../../types"
import { User } from "@clerk/nextjs/server"

interface ChatMessage {
  id: string
  userId: string
  user: User
  message: string
  createdAt: string
  type?: "text" | "image" | "file"
  fileUrl?: string
  fileName?: string
  fileSize?: number
}

interface Member {
  id: string
  fullName: string
  image_url: string
  muted?: boolean
}

export default function RoomPage() {
  const { id: roomId } = useParams()
  const { user } = useUser()
  const { socket } = useSocket()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [members, setMembers] = useState<Member[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isAdmin = true // Replace with logic to check if current user is admin

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!socket || !user || !roomId) return

    const handleMessage = (event: MessageEvent) => {
      const { type, data } = JSON.parse(event.data)

      switch (type) {
        case NEW_MESSAGE:
          console.log("New message received:", data)
          setMessages((prev) => [...prev, data])
          break
        case MEMBERS_UPDATE:
          setMembers((prevMember) => [...prevMember, data.user])
          break
        case PERMISSION:
          setPending((prevPending) => [...prevPending, data])
          console.log("Pending users:", data)
          break
        case DELETE_MESSAGE:
          setMessages((prev) => prev.map((msg) => {
            if (msg.id === data.messageId) {
              return { ...msg, isDeleted: true }
            }else {
              return msg;
            }
          }))
          break
        case REMOVED:
          alert(`${data.user.fullName} has been removed from the room.`)

          if (data.user.id === user?.id) {
            redirect("/join-room")
          }
          setMembers((prev) => prev.filter((member) => member.id !== data.user.id))
      }
    }

    socket.addEventListener("message", handleMessage)

    return () => socket.removeEventListener("message", handleMessage)
  }, [socket, user, roomId])

  const sendMessage = () => {
    if (!input.trim()) return

    const msg = {
      type: NEW_MESSAGE,
      data: {
        message: input,
        user,
        roomId,
      },
    }

    socket?.send(JSON.stringify(msg))
    setInput("")
    setShowEmojiPicker(false)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Create a file message
    const fileMessage = {
      type: NEW_MESSAGE,
      data: {
        messages: `Shared a file: ${file.name}`,
        user,
        roomId,
        messageType: file.type.startsWith("image/") ? "image" : "file",
        fileName: file.name,
        fileSize: file.size,
        // In a real app, you'd upload the file to a server and get a URL
        fileUrl: URL.createObjectURL(file),
      },
    }

    socket?.send(JSON.stringify(fileMessage))

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const addEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  const deleteMessage = (msgId: string) => {
    socket?.send(
      JSON.stringify({
        type: DELETE_MESSAGE,
        data: {
          roomId,
          messageId: msgId,
          userId: user?.id,
        },
      }),
    )
  }

  const muteUser = (userId: string) => {
    socket?.send(
      JSON.stringify({
        type: MUTE_USER,
        data: { roomId, userId },
      }),
    )
  }

  const removeUser = (member: any) => {
    socket?.send(
      JSON.stringify({
        type: REMOVE_USER,
        data: { roomId, user: member, adminId: user?.id },
      }),
    )
  }

  const acceptUser = (pendingUser: any) => {
    socket?.send(
      JSON.stringify({
        type: ACCEPT_USER,
        data: pendingUser,
      }),
    )

    setPending((prevPending) => prevPending.filter((p) => p.user.id !== pendingUser.user.id))
  }

  const rejectUser = (pendingUser: any) => {
    socket?.send(
      JSON.stringify({
        type: REJECT_USER,
        data: { roomId, user: pendingUser },
      }),
    )

    setPending((prevPending) => prevPending.filter((p) => p.user.id !== pendingUser.user.id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const renderMessage = (msg: ChatMessage) => {
    const isOwnMessage = msg.userId === user?.id

    return (
      <div
        key={msg.id}
        className={`flex items-start gap-3 p-4 rounded-lg transition-colors hover:bg-muted/50 ${isOwnMessage ? "bg-primary/5" : ""
          }`}
      >
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={msg.user.imageUrl} />
          <AvatarFallback className="text-xs">{msg.user.username?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{msg.user?.username || 'U'}</span>
            <span className="text-xs text-muted-foreground">{formatTime(msg.createdAt)}</span>
            {isOwnMessage && (
              <Badge variant="secondary" className="text-xs">
                You
              </Badge>
            )}
          </div>

          {msg.type === "image" && msg.fileUrl ? (
            <div className="mt-2">
              <img src={msg.fileUrl || "/placeholder.svg"} alt={msg.fileName} className="max-w-xs rounded-lg border" />
              <p className="text-sm text-muted-foreground mt-1">{msg.fileName}</p>
            </div>
          ) : msg.type === "file" && msg.fileUrl ? (
            <div className="mt-2 p-3 border rounded-lg bg-muted/30 max-w-xs">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{msg.fileName}</p>
                  <p className="text-xs text-muted-foreground">{msg.fileSize && formatFileSize(msg.fileSize)}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed break-words">{msg.message}</p>
          )}
        </div>

        {(isAdmin || isOwnMessage) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => deleteMessage(msg.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Message
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-80 border-r bg-muted/30">
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Room Management
          </h1>
        </div>

        <div className="p-4">
          {isAdmin ? (
            <Tabs defaultValue="members" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="members" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Members ({members.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending ({pending.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="members" className="mt-4">
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="space-y-2">
                    {members.map((member) => (
                      <Card key={member.id} className="transition-colors hover:bg-muted/50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.image_url || "/placeholder.svg"} />
                                <AvatarFallback>{member?.fullName?.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{member?.fullName}</p>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-2 w-2 rounded-full bg-green-500`}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    Online
                                  </span>
                                  {member.muted && (
                                    <Badge variant="secondary" className="text-xs">
                                      Muted
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => muteUser(member.id)}>
                                  <VolumeX className="h-4 w-4 mr-2" />
                                  {member.muted ? "Unmute" : "Mute"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => removeUser(member)} className="text-destructive">
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="pending" className="mt-4">
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="space-y-2">
                    {pending.map((p) => (
                      <Card key={p.user.id} className="transition-colors hover:bg-muted/50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{p.user?.fullName?.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{p.user.fullName}</p>
                                <p className="text-xs text-muted-foreground">Requesting access</p>
                              </div>
                            </div>

                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => acceptUser(p)} className="h-8 px-2">
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectUser(p)}
                                className="h-8 px-2"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {pending.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No pending requests</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          ) : (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({members.length})
              </h2>
              <ScrollArea className="h-[calc(100vh-150px)]">
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.image_url || "/placeholder.svg"} />
                        <AvatarFallback>{member?.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member?.fullName}</p>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full bg-green-500`} />
                          <span className="text-xs text-muted-foreground">
                            Online
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Right Chat Section */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">Chat Room</h1>
              <p className="text-sm text-muted-foreground">
                {members.length} member{members.length !== 1 ? "s" : ""} online
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-1 group">
            {messages.map((msg) => renderMessage(msg))}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="pr-20 min-h-[40px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-2" align="end">
                    <div className="grid grid-cols-10 gap-1">
                      {EMOJI_LIST.map((emoji, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-lg hover:bg-muted"
                          onClick={() => addEmoji(emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={!input.trim()} className="h-10">
              <Send className="h-4 w-4" />
            </Button>
          </form>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </div>
      </div>
    </div>
  )
}
