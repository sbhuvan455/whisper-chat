'use client'

import React, { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from '@/components/ui/toaster'
import { ClipboardCopy, ArrowRight, LogIn, Plus } from 'lucide-react'

function JoinRoom() {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const [roomId, setRoomId] = useState<string>('')
  const [generatedRoomId, setGeneratedRoomId] = useState<string>('')

  const { toast } = useToast()

  if (!isSignedIn) {
    return (
      <Card className="md:w-full w-4/5 max-w-md mx-auto my-28 md:my-40">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>Please sign in to join or create a room.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const generateRoomId = () => {
    
    if(generatedRoomId){
      return;
    }

    const randomId = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8)
    setGeneratedRoomId(randomId)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`http://localhost:3000/join-room/${generatedRoomId}`)

    toast({
      description: "Copied",
    })
  }

  const joinRoom = (id: string) => {
    router.push(`/join-room/${id}`)
  }

  return (
      <div className="container mx-auto my-28 md:my-40 px-4">
      <Card className="w-full max-w-md mx-auto">
          <CardHeader>
          <CardTitle>Welcome, {user.firstName}!</CardTitle>
          <CardDescription>Join an existing room or create a new one.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
          <div className="space-y-2">
              <Label htmlFor="roomId">Join Existing Room</Label>
              <div className="flex space-x-2">
              <Input
                  id="roomId"
                  placeholder="Enter room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
              />
              <Button onClick={() => joinRoom(roomId)}>
                  Join <LogIn className="ml-2 h-4 w-4" />
              </Button>
              </div>
          </div>

          <div className="flex items-center">
              <Separator className="flex-grow w-1/3" />
              <span className="mx-2 text-sm text-muted-foreground">or</span>
              <Separator className="flex-grow w-1/3" />
          </div>

          <div className="space-y-2">
              <Label>Create New Room</Label>
              <Button onClick={generateRoomId} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Create New Room
              </Button>
              {generatedRoomId && (
              <div className="mt-4 space-y-2">
                  <Input
                  value={`http://localhost:3000/join-room/${generatedRoomId}`}
                  readOnly
                  />
                  <div className="flex space-x-2">
                  <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                      <ClipboardCopy className="mr-2 h-4 w-4" /> Copy Link
                  </Button>
                  <Button onClick={() => joinRoom(generatedRoomId)} className="flex-1">
                      Join Room <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  </div>
              </div>
              )}
          </div>
          </CardContent>
      </Card>
      <Toaster />
      </div>
  )
}

export default JoinRoom