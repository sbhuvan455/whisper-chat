export interface ROOM {
    roomId: string;
    adminId: string;
    title: string;
    description: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
}

export const CREATE_ROOM = 'create-room';
export const JOIN_ROOM = 'join-room';
export const ROOM_NOT_FOUND = 'room-not-found';
export const ADMIN_NOT_IN_ROOM = 'admin-not-in-room';
export const PERMISSION = 'permission';
export const ACCEPT_USER = 'accept-user';
export const NEW_MESSAGE = 'new-message';
export const MEMBERS_UPDATE = 'members-update';
export const REMOVE_USER = 'remove-user';
export const REMOVED = 'removed';
export const DELETE_MESSAGE = 'delete-message';
export const LEAVE = 'leave';
export const SEND_FILE = 'send-file';
export const END_ROOM = 'end-room';
export const ROOM_CLOSED = 'room-closed';
export const MEMBER_LEAVE = 'member-leave';