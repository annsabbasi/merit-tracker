// src/lib/hooks/use-storage.ts
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth-store';
import { BASE_URL } from '@/lib/api/request';

// Response types
export interface UploadResult {
    url: string;
    path: string;
    bucket: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
}

export interface SopUploadResult {
    file: UploadResult;
    thumbnail?: UploadResult;
    detectedType: 'VIDEO' | 'IMAGE' | 'PDF' | 'DOCUMENT';
}

// Input types
export interface UploadFileData {
    file: File;
    folder?: string;
}

export interface UploadMultipleFilesData {
    files: File[];
    folder?: string;
}

export interface UploadSopFileData {
    file: File;
    thumbnail?: File;
}

export interface ValidateFileOptions {
    maxSizeMB?: number;
    allowedTypes?: string[];
}

// Helper to get auth header
const getAuthHeader = (): Record<string, string> => {
    const token = useAuthStore.getState().token;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Upload single file
export function useUploadFile() {
    return useMutation({
        mutationFn: async ({ file, folder }: UploadFileData): Promise<UploadResult> => {
            const formData = new FormData();
            formData.append('file', file);
            if (folder) {
                formData.append('folder', folder);
            }

            const response = await fetch(`${BASE_URL}/storage/upload`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Upload failed');
            }

            return response.json();
        },
    });
}

// Upload multiple files
export function useUploadMultipleFiles() {
    return useMutation({
        mutationFn: async ({ files, folder }: UploadMultipleFilesData): Promise<UploadResult[]> => {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('files', file);
            });
            if (folder) {
                formData.append('folder', folder);
            }

            const response = await fetch(`${BASE_URL}/storage/upload/multiple`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Upload failed');
            }

            return response.json();
        },
    });
}

// Upload SOP with optional thumbnail
export function useUploadSopFile() {
    return useMutation({
        mutationFn: async ({ file, thumbnail }: UploadSopFileData): Promise<SopUploadResult> => {
            const formData = new FormData();
            formData.append('files', file);
            if (thumbnail) {
                formData.append('files', thumbnail);
            }

            const response = await fetch(`${BASE_URL}/storage/upload/sop`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Upload failed');
            }

            return response.json();
        },
    });
}

// Delete file
export function useDeleteFile() {
    return useMutation({
        mutationFn: async (filePath: string): Promise<{ message: string }> => {
            const response = await fetch(`${BASE_URL}/storage/delete`, {
                method: 'DELETE',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filePath }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Delete failed');
            }

            return response.json();
        },
    });
}

// Utility functions
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getFileTypeIcon(mimeType: string): 'video' | 'image' | 'pdf' | 'document' {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    return 'document';
}

export function validateFile(
    file: File,
    options?: ValidateFileOptions
): { valid: boolean; error?: string } {
    const maxSizeMB = options?.maxSizeMB || 100;
    const allowedTypes = options?.allowedTypes || [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (file.size > maxSizeMB * 1024 * 1024) {
        return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
    }

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: `File type ${file.type} is not allowed` };
    }

    return { valid: true };
}