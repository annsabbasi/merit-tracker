// src/lib/hooks/use-chat.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import type { ChatRoom, ChatMessage } from '@/lib/types/index';

export const chatKeys = {
    all: ['chat'] as const,
    rooms: () => [...chatKeys.all, 'rooms'] as const,
    myRooms: () => [...chatKeys.all, 'my-rooms'] as const,
    room: (id: string) => [...chatKeys.all, 'room', id] as const,
    messages: (roomId: string) => [...chatKeys.all, 'messages', roomId] as const,
};

// Get all rooms
export function useChatRooms(filters?: { projectId?: string; search?: string }) {
    return useQuery({
        queryKey: chatKeys.rooms(),
        queryFn: () => api.get<ChatRoom[]>('/chat/rooms', filters),
    });
}

// Get my rooms
export function useMyChatRooms() {
    return useQuery({
        queryKey: chatKeys.myRooms(),
        queryFn: () => api.get<ChatRoom[]>('/chat/rooms/my-rooms'),
    });
}

// Get room by ID
export function useChatRoom(id: string) {
    return useQuery({
        queryKey: chatKeys.room(id),
        queryFn: () => api.get<ChatRoom>(`/chat/rooms/${id}`),
        enabled: !!id,
    });
}

// Get messages
export function useChatMessages(roomId: string, limit = 50) {
    return useQuery({
        queryKey: chatKeys.messages(roomId),
        queryFn: () => api.get<ChatMessage[]>(`/chat/rooms/${roomId}/messages`, { limit }),
        enabled: !!roomId,
        refetchInterval: 5000, // Poll for new messages every 5 seconds
    });
}

// Create room
export function useCreateChatRoom() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { name: string; description?: string; projectId: string; memberIds?: string[] }) =>
            api.post<ChatRoom>('/chat/rooms', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });
            queryClient.invalidateQueries({ queryKey: chatKeys.myRooms() });
        },
    });
}

// Update room
export function useUpdateChatRoom() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ChatRoom> }) =>
            api.put<ChatRoom>(`/chat/rooms/${id}`, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: chatKeys.room(id) });
            queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });
        },
    });
}

// Add members
export function useAddChatMembers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ roomId, userIds }: { roomId: string; userIds: string[] }) =>
            api.patch<ChatRoom>(`/chat/rooms/${roomId}/members/add`, { userIds }),
        onSuccess: (_, { roomId }) => {
            queryClient.invalidateQueries({ queryKey: chatKeys.room(roomId) });
        },
    });
}

// Remove members
export function useRemoveChatMembers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ roomId, userIds }: { roomId: string; userIds: string[] }) =>
            api.patch<ChatRoom>(`/chat/rooms/${roomId}/members/remove`, { userIds }),
        onSuccess: (_, { roomId }) => {
            queryClient.invalidateQueries({ queryKey: chatKeys.room(roomId) });
        },
    });
}

// Send message
export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ roomId, content }: { roomId: string; content: string }) =>
            api.post<ChatMessage>(`/chat/rooms/${roomId}/messages`, { content }),
        onSuccess: (_, { roomId }) => {
            queryClient.invalidateQueries({ queryKey: chatKeys.messages(roomId) });
        },
    });
}

// Update message
export function useUpdateMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ messageId, content, roomId }: { messageId: string; content: string; roomId: string }) =>
            api.put<ChatMessage>(`/chat/messages/${messageId}`, { content }),
        onSuccess: (_, { roomId }) => {
            queryClient.invalidateQueries({ queryKey: chatKeys.messages(roomId) });
        },
    });
}

// Delete message
export function useDeleteMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ messageId, roomId }: { messageId: string; roomId: string }) =>
            api.delete(`/chat/messages/${messageId}`),
        onSuccess: (_, { roomId }) => {
            queryClient.invalidateQueries({ queryKey: chatKeys.messages(roomId) });
        },
    });
}

// Delete room
export function useDeleteChatRoom() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/chat/rooms/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });
            queryClient.invalidateQueries({ queryKey: chatKeys.myRooms() });
        },
    });
}