export const DISCONNECT = 'disconnect';
export const CREATE_ROOM = 'create-room';
export const JOIN_ROOM = 'join-room';
export const ROOM_NOT_FOUND = 'room-not-found';
export const ADMIN_NOT_IN_ROOM = 'admin-not-in-room';
export const DELETE_MESSAGE = 'delete-message';
export const MUTE_USER = 'mute-user';
export const REMOVED = 'removed';
export const REMOVE_USER = 'remove-user';
export const ACCEPT_USER = 'accept-user';
export const REJECT_USER = 'reject-user';
export const NEW_MESSAGE = 'new-message';
export const PERMISSION = 'permission';
export const MEMBERS_UPDATE = 'members-update';
export const LEAVE = 'leave';
export const SEND_FILE = 'send-file';
export const END_ROOM = 'end-room';
export const ROOM_CLOSED = 'room-closed';
export const MEMBER_LEAVE = 'member-leave';

export interface Member {
    id: string
    fullName: string
    image_url: string
    muted?: boolean
}

export interface ChatMessage {
    id: string
    userId: string
    user: Member
    message?: string
    isDeleted: boolean
    createdAt: string
    type?: "text" | "image" | "file"
    fileUrl?: string
    fileName?: string
    fileSize?: number
}