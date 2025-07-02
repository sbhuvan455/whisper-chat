'use client'

import React, { useEffect, useState } from 'react'
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
import { useSocket } from '@/context/socketProvider'
import { CREATE_ROOM, JOIN_ROOM } from '../../../types'

function JoinRoom() {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const [roomId, setRoomId] = useState<string>('')
  const [generatedRoomId, setGeneratedRoomId] = useState<string>('')
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false)
  const [roomTitle, setRoomTitle] = useState<string>('')
  const [roomDesc, setRoomDesc] = useState<string>('')

  const { toast } = useToast()
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const res = JSON.parse(event.data);

        if (res.type === 'roomCreated') {
          setGeneratedRoomId(res.data.roomId);
          setIsCreatingRoom(false);

          toast({
            title: "Room Created",
            description: "Your room has been created successfully!",
          });
        }

        if (res.type === 'roomError') {
          setIsCreatingRoom(false);
          toast({
            title: "Error",
            description: res.data.message || 'Something went wrong',
            variant: "destructive",
          });
        }

      } catch (err) {
        console.error("Invalid JSON from WebSocket:", event.data);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, toast]);

  const generateRoomId = async () => {
    if (generatedRoomId || isCreatingRoom || !user) return;

    setIsCreatingRoom(true);

    const title = `${roomTitle}`;
    const description = `${roomDesc}`;

    try {
      const res = await fetch("/api/v1/room/create-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          description,
          user: {
            id: user.id,
            name: user.fullName
          }
        })
      });

      const json = await res.json();

      if (!res.ok || !json.data) {
        throw new Error(json.error || "Room creation failed");
      }

      const createdRoom = json.data;
      const message = {
        type: CREATE_ROOM,
        data: {
          roomId: createdRoom.id,
          adminId: user.id
        }
      };

      socket?.send(JSON.stringify(message));
      setGeneratedRoomId(createdRoom.id);

      toast({
        title: "Room Created",
        description: "Room successfully created and WebSocket notified."
      });

    } catch (error: any) {
      toast({
        title: "Error Creating Room",
        description: error.message || "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };


  const copyToClipboard = () => {
    navigator.clipboard.writeText(`http://localhost:3000/join-room/${generatedRoomId}/waiting`);
    toast({ description: "Copied" });
  };

  const joinRoomById = (roomId: string) => {
    if (!roomId || !user) return;
    router.push(`/join-room/${roomId}/waiting`);
  };

  const joinRoom = (id: string) => {
    router.push(`/join-room/${id}/waiting`);
  };

  if (!isSignedIn || !socket) {
    return (
      <Card className="md:w-full w-4/5 max-w-md mx-auto my-28 md:my-40">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>Please sign in to join or create a room.</CardDescription>
        </CardHeader>
      </Card>
    );
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
              <Button onClick={() => joinRoomById(roomId)}>
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
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  id="roomId"
                  placeholder="Enter room Name"
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Input
                  id="roomId"
                  placeholder="Enter room description"
                  value={roomDesc}
                  onChange={(e) => setRoomDesc(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={generateRoomId}
              className="w-full"
              disabled={isCreatingRoom}
            >
              {isCreatingRoom ? (
                "Creating Room..."
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Create New Room
                </>
              )}
            </Button>

            {generatedRoomId && (
              <div className="mt-4 space-y-2">
                <Input
                  value={`http://localhost:3000/join-room/${generatedRoomId}/waiting`}
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
  );
}

export default JoinRoom;
