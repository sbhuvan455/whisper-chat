import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, MoreVertical, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { ChatMessage } from '../../types'

function message({ msg, isOwnMessage, isAdmin, deleteMessage }: { msg: ChatMessage, isOwnMessage: boolean, isAdmin: boolean, deleteMessage: (messageId: string) => void }) {
    // const isOwnMessage = msg.user.id === user?.id
    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    const downloadFile = (fileUrl: string, fileName: string) => {
        const link = document.createElement("a")
        link.href = fileUrl
        link.download = fileName
        link.target = "_blank"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    console.log("Rendering message:", msg, isOwnMessage)

    return (
        <div
            key={msg.id}
            className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-4 rounded-lg transition-colors hover:bg-muted/50 group ${isOwnMessage ? "flex-row-reverse ml-4 sm:ml-12" : "mr-4 sm:mr-12"
                }`}
        >
            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                <AvatarImage src={msg.user.image_url || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">{msg.user.fullName?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className={`flex-1 min-w-0 ${isOwnMessage ? "text-right" : "text-left"}`}>
                <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                    <span className="font-semibold text-xs sm:text-sm truncate">{msg.user?.fullName || "U"}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(msg.createdAt)}</span>
                    {isOwnMessage && (
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                            You
                        </Badge>
                    )}
                </div>

                <div
                    className={`inline-block max-w-[85%] sm:max-w-[80%] ${isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
                        } rounded-lg p-2 sm:p-3 mt-1`}
                >
                    {!msg.isDeleted ? (
                        msg.type === "image" && msg.fileUrl ? (
                            <div>
                                <img
                                    src={msg.fileUrl || "/placeholder.svg"}
                                    alt={msg.fileName}
                                    className="max-w-[200px] sm:max-w-xs rounded-lg border"
                                />
                                <p
                                    className={`text-xs sm:text-sm mt-1 ${isOwnMessage ? "text-primary-foreground/80" : "text-muted-foreground"
                                        }`}
                                >
                                    {msg.fileName}
                                </p>
                            </div>
                        ) : msg.type === "file" && msg.fileUrl ? (
                            <div
                                className={`p-2 sm:p-3 border rounded-lg max-w-[200px] sm:max-w-xs ${isOwnMessage ? "bg-primary-foreground/10" : "bg-muted/30"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium truncate">{msg.fileName}</p>
                                        <p className={`text-xs ${isOwnMessage ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                            {msg.fileSize && formatFileSize(msg.fileSize)}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => downloadFile(msg.fileUrl!, msg.fileName!)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                                    >
                                        <Download className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs sm:text-sm leading-relaxed break-words">{msg.message}</p>
                        )
                    ) : (
                        <p
                            className={`text-xs sm:text-sm leading-relaxed break-words italic ${isOwnMessage ? "text-primary-foreground/60" : "text-muted-foreground"
                                }`}
                        >
                            This Message is Deleted
                        </p>
                    )}
                </div>
            </div>

            {(isAdmin || isOwnMessage) && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                        >
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

export default message
