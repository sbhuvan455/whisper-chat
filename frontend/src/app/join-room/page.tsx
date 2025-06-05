// 'use client'

// import React, { useEffect, useState } from 'react'
// import { useUser } from '@clerk/clerk-react'
// import { useRouter } from 'next/navigation'
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Label } from "@/components/ui/label"
// import { Separator } from "@/components/ui/separator"
// import { useToast } from "@/hooks/use-toast"
// import { Toaster } from '@/components/ui/toaster'
// import { ClipboardCopy, ArrowRight, LogIn, Plus } from 'lucide-react'
// import { useSocket } from '@/context/socketProvider'

// function JoinRoom() {
//   const { isSignedIn, user } = useUser()
//   const router = useRouter()
//   const [roomId, setRoomId] = useState<string>('')
//   const [generatedRoomId, setGeneratedRoomId] = useState<string>('')
//   const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false)

//   const { toast } = useToast()

//   const socket = useSocket();

//   useEffect(() => {
//     if (!socket) return;

//     const handleRoomCreated = (response: { roomId: string }) => {
//       setIsCreatingRoom(false);
//       setGeneratedRoomId(response.roomId)

//       toast({
//         title: "Room Created",
//         description: "Your room has been created successfully!",
//         variant: "default"
//       });
//     };

//     const handleRoomError = (error: string) => {
//       setIsCreatingRoom(false);
//       setGeneratedRoomId('');

//       toast({
//         title: "Error Creating Room",
//         description: error,
//         variant: "destructive"
//       });
//     };

//     if (socket) {
//       socket.on("roomCreated", handleRoomCreated);
//       socket.on("roomError", handleRoomError);
//     }

//     return () => {
//       if (socket) {
//         socket.off("roomCreated", handleRoomCreated);
//         socket.off("roomError", handleRoomError);
//       }
//     };

//   }, [socket]);

//   if (!isSignedIn || !socket) {
//     return (
//       <Card className="md:w-full w-4/5 max-w-md mx-auto my-28 md:my-40">
//         <CardHeader>
//           <CardTitle>Access Denied</CardTitle>
//           <CardDescription>Please sign in to join or create a room.</CardDescription>
//         </CardHeader>
//       </Card>
//     )
//   }

//   const generateRoomId = () => {
    
//     if (generatedRoomId || isCreatingRoom) {
//       return;
//     }

//     setIsCreatingRoom(true);

//     const randomId = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8)

//     socket.emit('createRoom', { roomId: randomId, userId: user.id });
//   }

//   const copyToClipboard = () => {
//     navigator.clipboard.writeText(`http://localhost:3000/join-room/${generatedRoomId}`)

//     toast({
//       description: "Copied",
//     })
//   }

//   const joinRoomById = (roomId: string) => {
//     router.push(`/join-room/${roomId}`)
//   }

//   const joinRoom = (id: string) => {
//     router.push(`/room/${id}`)
//   }

//   return (
//       <div className="container mx-auto my-28 md:my-40 px-4">
//       <Card className="w-full max-w-md mx-auto">
//           <CardHeader>
//           <CardTitle>Welcome, {user.firstName}!</CardTitle>
//           <CardDescription>Join an existing room or create a new one.</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-6">
//           <div className="space-y-2">
//               <Label htmlFor="roomId">Join Existing Room</Label>
//               <div className="flex space-x-2">
//               <Input
//                   id="roomId"
//                   placeholder="Enter room ID"
//                   value={roomId}
//                   onChange={(e) => setRoomId(e.target.value)}
//               />
//               <Button onClick={() => joinRoomById(roomId)}>
//                   Join <LogIn className="ml-2 h-4 w-4" />
//               </Button>
//               </div>
//           </div>

//           <div className="flex items-center">
//               <Separator className="flex-grow w-1/3" />
//               <span className="mx-2 text-sm text-muted-foreground">or</span>
//               <Separator className="flex-grow w-1/3" />
//           </div>

//           <div className="space-y-2">
//               <Label>Create New Room</Label>
//               <Button 
//                 onClick={generateRoomId} 
//                 className="w-full"
//                 disabled={isCreatingRoom}
//               >
//               {isCreatingRoom ? (
//                 "Creating Room..."
//               ) : (
//                 <>
//                   <Plus className="mr-2 h-4 w-4" /> Create New Room
//                 </>
//               )}
//             </Button>
//               {generatedRoomId && (
//               <div className="mt-4 space-y-2">
//                   <Input
//                   value={`http://localhost:3000/join-room/${generatedRoomId}`}
//                   readOnly
//                   />
//                   <div className="flex space-x-2">
//                   <Button onClick={copyToClipboard} variant="outline" className="flex-1">
//                       <ClipboardCopy className="mr-2 h-4 w-4" /> Copy Link
//                   </Button>
//                   <Button onClick={() => joinRoom(generatedRoomId)} className="flex-1">
//                       Join Room <ArrowRight className="ml-2 h-4 w-4" />
//                   </Button>
//                   </div>
//               </div>
//               )}
//           </div>
//           </CardContent>
//       </Card>
//       <Toaster />
//       </div>
//   )
// }

// export default JoinRoom

"use client";
import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';

function CreateRoomPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { isSignedIn, user } = useUser();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if(!isSignedIn) {
        setError('You must be signed in to create a room.');
        return;
      }

      const res = await fetch('/api/v1/room/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({...formData, user }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create room');
      }

      setSuccess(true);
      setFormData({ title: '', description: '' }); // Reset form
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Create a Room</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          placeholder="Room Title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        />
        <textarea
          name="description"
          placeholder="Room Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        ></textarea>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Room'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-600 mt-2">Room created successfully!</p>}
    </div>
  );
}

export default CreateRoomPage;

