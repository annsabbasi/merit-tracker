// components/ui/image-upload.tsx
"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
    value?: string | null
    onChange: (file: File | null) => void
    onRemove?: () => void
    disabled?: boolean
    isUploading?: boolean
    className?: string
    previewClassName?: string
    fallback?: string
    shape?: "circle" | "square"
    size?: "sm" | "md" | "lg"
    accept?: string[]
    maxSizeMB?: number
}

const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    disabled = false,
    isUploading = false,
    className,
    previewClassName,
    fallback = "IMG",
    shape = "circle",
    size = "md",
    accept = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
    maxSizeMB = 5,
}: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const onDrop = useCallback(
        (acceptedFiles: File[], rejectedFiles: any[]) => {
            setError(null)

            if (rejectedFiles.length > 0) {
                const rejection = rejectedFiles[0]
                if (rejection.errors[0]?.code === "file-too-large") {
                    setError(`File is too large. Maximum size is ${maxSizeMB}MB`)
                } else if (rejection.errors[0]?.code === "file-invalid-type") {
                    setError("Invalid file type. Please upload an image.")
                } else {
                    setError("Failed to upload file")
                }
                return
            }

            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0]

                // Create preview
                const reader = new FileReader()
                reader.onload = () => {
                    setPreview(reader.result as string)
                }
                reader.readAsDataURL(file)

                onChange(file)
            }
        },
        [onChange, maxSizeMB]
    )

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
        maxSize: maxSizeMB * 1024 * 1024,
        multiple: false,
        disabled: disabled || isUploading,
    })

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation()
        setPreview(null)
        onChange(null)
        onRemove?.()
    }

    const displayImage = preview || value

    return (
        <div className={cn("space-y-2", className)}>
            <div
                {...getRootProps()}
                className={cn(
                    "relative group cursor-pointer transition-all",
                    disabled && "opacity-50 cursor-not-allowed",
                    isUploading && "pointer-events-none"
                )}
            >
                <input {...getInputProps()} />

                {displayImage ? (
                    <div className="relative">
                        {shape === "circle" ? (
                            <Avatar className={cn(sizeClasses[size], previewClassName)}>
                                <AvatarImage src={displayImage} alt="Preview" className="object-cover" />
                                <AvatarFallback>{fallback}</AvatarFallback>
                            </Avatar>
                        ) : (
                            <div
                                className={cn(
                                    sizeClasses[size],
                                    "rounded-lg overflow-hidden border",
                                    previewClassName
                                )}
                            >
                                <img
                                    src={displayImage}
                                    alt="Preview"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        )}

                        {/* Overlay on hover */}
                        <div
                            className={cn(
                                "absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                                shape === "circle" ? "rounded-full" : "rounded-lg"
                            )}
                        >
                            {isUploading ? (
                                <Loader2 className="h-6 w-6 text-white animate-spin" />
                            ) : (
                                <Upload className="h-6 w-6 text-white" />
                            )}
                        </div>

                        {/* Remove button */}
                        {!disabled && !isUploading && onRemove && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={handleRemove}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                ) : (
                    <div
                        className={cn(
                            sizeClasses[size],
                            "border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 transition-colors",
                            isDragActive
                                ? "border-primary bg-primary/5"
                                : "border-muted-foreground/25 hover:border-primary/50",
                            shape === "circle" && "rounded-full"
                        )}
                    >
                        {isUploading ? (
                            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                        ) : (
                            <>
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Upload</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <p className="text-xs text-destructive">{error}</p>
            )}

            {!displayImage && !error && (
                <p className="text-xs text-muted-foreground">
                    Drag & drop or click to upload. Max {maxSizeMB}MB.
                </p>
            )}
        </div>
    )
}