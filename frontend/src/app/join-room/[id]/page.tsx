"use client"

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useSocket } from '@/context/socketProvider'
import axios from "axios"
import { useToast } from "@/hooks/use-toast"

function WaitingRoom() {
    const { isSignedIn, user } = useUser()
    const router = useRouter()
    const { toast } = useToast()
    const { id } = useParams()
    const socket = useSocket()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!socket?.connected) {
            return;
        }

        const fetchRoomDetails = async () => {
            try {
                setIsLoading(true)
                const response = await axios.post(`http://localhost:8000/api/v1/room/${id}`, {
                    socketId: socket.id
                })
                console.log(response)

            } catch (error: any) {
                console.error(error.response?.data)
                toast({
                    title: "Error",
                    description: error.response?.data?.message || "Failed to fetch room details",
                    variant: "destructive"
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchRoomDetails()
    }, [socket?.connected, id, router, user])

    if (!isSignedIn) {
        return (
            <div className='flex flex-col items-center justify-center my-40 space-y-4'>
                <div>You need to sign in to continue!</div>
                <Button onClick={() => router.push('/login')}>Sign in</Button>
            </div>
        )
    }

    if (!socket) {
        return (
            <div className='flex items-center justify-center my-40'>
                Connecting to the server...
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className='flex items-center justify-center my-40'>
                Loading room details...
            </div>
        )
    }

    return (
        <div className='flex flex-col items-center justify-center my-40 space-y-4'>
            <div>Waiting Room</div>
            <div>Welcome, {user?.fullName}!</div>
        </div>
    )
}

export default WaitingRoom