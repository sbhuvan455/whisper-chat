"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
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
  UserMinus,
  VolumeX,
  Check,
  X,
  Users,
  Clock,
  FileText,
  LogOut,
  Power,
  Menu,
  BotMessageSquare,
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
  SEND_FILE,
  END_ROOM,
  ROOM_CLOSED,
  LEAVE,
  MEMBER_LEAVE,
  type ChatMessage,
  type Member,
} from "../../../../types"
import { FireBaseStorage } from "../../../../firebaseConfig"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import message from "@/components/message"

export default function RoomPage() {
  const { id: roomId } = useParams()
  const { user } = useUser()
  const { socket, isConnected } = useSocket()
  const { toast } = useToast()
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [members, setMembers] = useState<Member[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [fileUpload, setFileUpload] = useState<{ progress: number; isUploading: boolean }>({
    progress: 0,
    isUploading: false,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [chatSummary, setChatSummary] = useState<string>("")
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const scrollContainer = messagesEndRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchAdmin = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/room/get-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId: roomId }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch admin status")
      }

      const result = await response.json()
      console.log(result)

      setIsAdmin(result.adminId === user?.id)

      setAdminId(result.adminId)
    } catch (error) {
      console.error("Error fetching admin status:", error)
    }
  }, [user, roomId])

  const fetchMember = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/room/get-members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId: roomId }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch admin status")
      }

      const result = await response.json()

      console.log("Fetched members:", result.members)

      if (result.members.length > 0) {
        setMembers(result.members)
      }
    } catch (error) {
      console.error("Error fetching admin status:", error)
    }
  }, [user, roomId])

  useEffect(() => {
    if (!isConnected) {
      console.warn("[RoomPage] Socket lost. Redirecting to reconnecting page")
      router.push(`/join-room/${roomId}/reconnecting`)
    }
  }, [isConnected])

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
          setMembers((prevMembers) => {
            const alreadyExists = prevMembers.some((member) => member.id === data.id);
            if (alreadyExists) return prevMembers;
            return [...prevMembers, data];
          });
          break;

        case PERMISSION:
          setPending((prevPending) => {
            const alreadyExists = prevPending.some((p) => p.user.id === data.user.id)
            if (alreadyExists) return prevPending
            return [...prevPending, data]
          })
          console.log("Pending users:", data)
          break
        case DELETE_MESSAGE:
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === data.messageId) {
                return { ...msg, isDeleted: true }
              } else {
                return msg
              }
            }),
          )
          break
        case REMOVED:
          if (data.user.id === user?.id) {
            toast({
              title: "You have been removed",
              description: "You have been removed from the room.",
            })
            // router to join room page after 3 seconds
            setTimeout(() => {
              router.push("/")
            }, 3000)
          } else {
            toast({
              title: "User Removed",
              description: `${data.user.fullName} has been removed from the room.`,
            })
          }

          setMembers((prev) => prev.filter((member) => member.id !== data.user.id))
          break
        case MEMBER_LEAVE:
          setMembers((prev) => prev.filter((member) => member.id !== data.userId))

          toast({
            title: "Member Left",
            description: `${data.fullName} has left the room.`,
          })

          break
        case ROOM_CLOSED:
          toast({
            title: "Room Closed",
            description: "The room has been closed by the admin.",
          })

          console.log("Room closed by admin, redirecting to home page")

          setTimeout(() => {
            router.push("/")
          }, 3000)
      }
    }

    socket.addEventListener("message", handleMessage)
    if (user) fetchAdmin()
    if (roomId) fetchMember()

    return () => {
      socket.removeEventListener("message", handleMessage)
    }
  }, [socket, user, roomId])

  const sendMessage = () => {
    if (!input.trim()) return

    const msg = {
      type: NEW_MESSAGE,
      data: {
        message: input,
        user: {
          id: user?.id,
          fullName: user?.fullName || "",
          imageUrl: user?.imageUrl || null,
        },
        roomId,
      },
    }

    socket?.send(JSON.stringify(msg))
    setInput("")
    setShowEmojiPicker(false)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setFileUpload({ progress: 0, isUploading: true })

    const storageRef = ref(FireBaseStorage, `${new Date().getTime()}_${selectedFile.name}`)

    const uploadTask = uploadBytesResumable(storageRef, selectedFile)

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        console.log(`Upload progress: ${Math.round(progress)}%`)
        setFileUpload({ progress: Math.round(progress), isUploading: true })
      },
      (error) => {
        console.error("Error uploading file to Firebase Storage:", error)
        setFileUpload({ progress: 0, isUploading: false })
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
          console.log("Uploaded file, download URL:", downloadUrl)
          setFileUpload({ progress: 100, isUploading: false })

          const fileMessage = {
            type: SEND_FILE,
            data: {
              user,
              roomId,
              file: downloadUrl,
              fileName: selectedFile.name,
              fileSize: selectedFile.size,
            },
          }

          console.log("file being sent", fileMessage)
          socket?.send(JSON.stringify(fileMessage))
        } catch (error) {
          console.error("Error getting download URL or sending message:", error)
          setFileUpload({ progress: 0, isUploading: false })
        } finally {
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
        }
      },
    )
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

  const leaveRoom = async () => {
    if (!socket || !user || !roomId) return

    socket.send(
      JSON.stringify({
        type: LEAVE,
        data: { roomId, userId: user.id },
      }),
    )

    // Optionally redirect or show a message
    router.push("/join-room")
  }

  const endRoom = async () => {
    socket?.send(
      JSON.stringify({
        type: END_ROOM,
        data: { roomId, userId: user?.id },
      }),
    )
  }

  const fetchChatSummary = async () => {
    if (!roomId) return

    setIsLoadingSummary(true)
    try {
      const response = await fetch(`http://localhost:8080/api/v1/room/get-chat-summary/${roomId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch chat summary")
      }
      const result = await response.json()
      setChatSummary(result.summary)
      setShowSummary(true)
    } catch (error) {
      console.error("Error fetching chat summary:", error)
      toast({
        title: "Error",
        description: "Failed to fetch chat summary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSummary(false)
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      {/* Left Sidebar */}
      <div
        className={`
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 fixed left-0 top-0 h-screen lg:relative z-50 lg:z-auto
          w-80 lg:w-80 border-r bg-muted/30 transition-transform duration-300 ease-in-out
          flex flex-col
        `}
      >
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Room Management
          </h1>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsMobileSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 flex-1 overflow-y-auto">
            {isAdmin ? (
              <Tabs defaultValue="members" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="members" className="flex items-center gap-2 text-xs sm:text-sm">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Members</span> ({members.length})
                  </TabsTrigger>
                  {isAdmin && (
                    <TabsTrigger value="pending" className="flex items-center gap-2 text-xs sm:text-sm">
                      <Clock className="h-4 w-4" />
                      <span className="hidden sm:inline">Pending</span> ({pending.length})
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="members" className="mt-4">
                  <div className="space-y-2 overflow-y-auto">
                    {members.map((member) => (
                      <Card key={member.id} className="transition-colors hover:bg-muted/50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={member.image_url || "/placeholder.svg"} />
                                <AvatarFallback>{member?.fullName?.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{member?.fullName}</p>
                                <div className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full bg-green-500 flex-shrink-0`} />
                                  <span className="text-xs text-muted-foreground">Online</span>
                                  {member.muted && (
                                    <Badge variant="secondary" className="text-xs">
                                      Muted
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {isAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
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
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="pending" className="mt-4">
                  <div className="space-y-2 overflow-y-auto">
                    {pending.map((p) => (
                      <Card key={p.user.id} className="transition-colors hover:bg-muted/50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarFallback>{p.user?.fullName?.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{p.user.fullName}</p>
                                <p className="text-xs text-muted-foreground">Requesting access</p>
                              </div>
                            </div>

                            <div className="flex gap-1 flex-shrink-0">
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
                </TabsContent>
              </Tabs>
            ) : (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Members ({members.length})
                </h2>
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={member.image_url || "/placeholder.svg"} />
                        <AvatarFallback>{member?.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{member?.fullName}</p>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full bg-green-500 flex-shrink-0`} />
                          <span className="text-xs text-muted-foreground">Online</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fixed Leave/End Room Buttons at bottom */}
          <div className="p-4 border-t bg-muted/30 flex-shrink-0">
            <div className="space-y-2">
              {isAdmin ? (
                <Button onClick={endRoom} variant="destructive" className="w-full flex items-center gap-2">
                  <Power className="h-4 w-4" />
                  End Room
                </Button>
              ) : (
                <Button
                  onClick={leaveRoom}
                  variant="outline"
                  className="w-full flex items-center gap-2 bg-background text-foreground hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                  Leave Room
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Chat Section */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Chat Header */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsMobileSidebarOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Chat Room</h1>
                <p className="text-sm text-muted-foreground">
                  {members.length} member{members.length !== 1 ? "s" : ""} online
                </p>
              </div>
            </div>

            {/* Mobile Leave/End Room Button */}
            <div className="lg:hidden">
              {isAdmin ? (
                <Button onClick={endRoom} variant="destructive" size="sm" className="flex items-center gap-2">
                  <Power className="h-4 w-4" />
                  <span className="hidden sm:inline">End Room</span>
                </Button>
              ) : (
                <Button
                  onClick={leaveRoom}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-background text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Leave</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-2 sm:p-4" ref={messagesEndRef}>
            <div className="space-y-1 group">
              {messages.map((msg) => message({ msg, isOwnMessage: msg.user.id === user?.id, isAdmin, deleteMessage }))}
            </div>

            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-sm sm:text-base">No messages yet. Start the conversation!</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message Input - Fixed at bottom */}
        <div className="flex-shrink-0 p-2 sm:p-4 border-t bg-background">
          {fileUpload.isUploading && (
            <div className="mb-3 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uploading file...</span>
                <span className="text-sm text-muted-foreground">{fileUpload.progress}%</span>
              </div>
              <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${fileUpload.progress}%` }}
                />
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!fileUpload.isUploading) {
                sendMessage()
              }
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <Input
                placeholder={
                  fileUpload.isUploading ? "Please wait for file upload to complete..." : "Type your message..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={fileUpload.isUploading}
                className="pr-16 sm:pr-20 min-h-[40px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !fileUpload.isUploading) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={fileUpload.isUploading}
                    >
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
                  disabled={fileUpload.isUploading}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={!input.trim() || fileUpload.isUploading} className="h-10">
              <Send className="h-4 w-4" />
            </Button>
          </form>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.txt"
            disabled={fileUpload.isUploading}
          />
        </div>
      </div>
      {/* Floating Summary Button */}
      <Button
        onClick={fetchChatSummary}
        disabled={isLoadingSummary}
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-30 bg-blue-600 text-white flex items-center justify-center"
      >
        {isLoadingSummary ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        ) : (
          <BotMessageSquare className="w-7 h-7" />
        )}
      </Button>


      {/* Summary Dialog */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Chat Summary
              </h2>
              <Button variant="ghost" size="sm" className="text-white" onClick={() => setShowSummary(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{chatSummary || "No summary available."}</p>
            </div>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  )
}
