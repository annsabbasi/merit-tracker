// src/components/screen-capture/screenshot-gallery.tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import { useScreenshotsByTimeTracking, useScreenshotStats, useDeleteScreenshot } from "@/lib/hooks/use-screenshots"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Camera,
    Clock,
    Image as ImageIcon,
    Trash2,
    ZoomIn,
    ChevronLeft,
    ChevronRight,
    X,
    AlertTriangle,
    Monitor,
    Download,
    ExternalLink,
    Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Screenshot } from "@/lib/types/screen-capture"

interface ScreenshotGalleryProps {
    timeTrackingId: string
    showStats?: boolean
    canDelete?: boolean
    className?: string
}

export function ScreenshotGallery({
    timeTrackingId,
    showStats = true,
    canDelete = false,
    className,
}: ScreenshotGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Screenshot | null>(null)
    const [deleteReason, setDeleteReason] = useState("")

    const { data: screenshots, isLoading: screenshotsLoading } = useScreenshotsByTimeTracking(timeTrackingId)
    const { data: stats, isLoading: statsLoading } = useScreenshotStats(timeTrackingId)
    const deleteScreenshot = useDeleteScreenshot()

    const handleDelete = async () => {
        if (!deleteTarget) return

        try {
            await deleteScreenshot.mutateAsync({
                id: deleteTarget.id,
                reason: deleteReason || undefined,
            })
            toast.success("Screenshot deleted. Time has been deducted from the session.")
            setDeleteTarget(null)
            setDeleteReason("")
        } catch (error) {
            toast.error("Failed to delete screenshot")
        }
    }

    const navigateImage = (direction: "prev" | "next") => {
        if (selectedIndex === null || !screenshots) return

        if (direction === "prev" && selectedIndex > 0) {
            setSelectedIndex(selectedIndex - 1)
        } else if (direction === "next" && selectedIndex < screenshots.length - 1) {
            setSelectedIndex(selectedIndex + 1)
        }
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    if (screenshotsLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="aspect-video rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card className={className}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="h-5 w-5" />
                                Screenshots
                            </CardTitle>
                            <CardDescription>
                                {screenshots?.length || 0} screenshots captured during this session
                            </CardDescription>
                        </div>
                        {showStats && stats && (
                            <div className="flex items-center gap-4 text-sm">
                                <div className="text-center">
                                    <p className="font-semibold">{stats.totalScreenshots}</p>
                                    <p className="text-muted-foreground">Total</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold">{stats.successCount}</p>
                                    <p className="text-muted-foreground text-green-600">Success</p>
                                </div>
                                {stats.failedCount > 0 && (
                                    <div className="text-center">
                                        <p className="font-semibold text-red-600">{stats.failedCount}</p>
                                        <p className="text-muted-foreground">Failed</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {screenshots && screenshots.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {screenshots.map((screenshot, index) => (
                                <div
                                    key={screenshot.id}
                                    className="group relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer border hover:border-primary transition-all"
                                    onClick={() => setSelectedIndex(index)}
                                >
                                    {screenshot.fileUrl ? (
                                        <Image
                                            src={screenshot.fileUrl}
                                            alt={`Screenshot at ${formatTime(screenshot.capturedAt)}`}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    )}

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                        <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    {/* Time badge */}
                                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                        <Badge variant="secondary" className="bg-black/60 text-white text-xs">
                                            {formatTime(screenshot.capturedAt)}
                                        </Badge>
                                        {screenshot.intervalMinutes && (
                                            <Badge variant="outline" className="bg-black/60 text-white text-xs border-0">
                                                {screenshot.intervalMinutes}m
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Status indicator */}
                                    {screenshot.captureStatus !== "SUCCESS" && (
                                        <div className="absolute top-2 right-2">
                                            <Badge variant="destructive" className="text-xs">
                                                {screenshot.captureStatus}
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Delete button (on hover) */}
                                    {canDelete && (
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 left-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setDeleteTarget(screenshot)
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Camera className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                            <p className="mt-4 text-muted-foreground">No screenshots captured yet</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Lightbox Dialog */}
            <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
                <DialogContent className="max-w-5xl p-0 bg-black/95">
                    <div className="relative">
                        {/* Close button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                            onClick={() => setSelectedIndex(null)}
                        >
                            <X className="h-5 w-5" />
                        </Button>

                        {/* Navigation buttons */}
                        {selectedIndex !== null && selectedIndex > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
                                onClick={() => navigateImage("prev")}
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </Button>
                        )}

                        {selectedIndex !== null && screenshots && selectedIndex < screenshots.length - 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
                                onClick={() => navigateImage("next")}
                            >
                                <ChevronRight className="h-8 w-8" />
                            </Button>
                        )}

                        {/* Image */}
                        {selectedIndex !== null && screenshots?.[selectedIndex] && (
                            <div className="relative aspect-video w-full">
                                {screenshots[selectedIndex].fileUrl ? (
                                    <Image
                                        src={screenshots[selectedIndex].fileUrl}
                                        alt="Screenshot"
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <ImageIcon className="h-16 w-16 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Info bar */}
                        {selectedIndex !== null && screenshots?.[selectedIndex] && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4 flex items-center justify-between text-white">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span>{formatTime(screenshots[selectedIndex].capturedAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Monitor className="h-4 w-4" />
                                        <span>
                                            {screenshots[selectedIndex].screenWidth}x{screenshots[selectedIndex].screenHeight}
                                        </span>
                                    </div>
                                    <span className="text-white/60">
                                        {selectedIndex + 1} of {screenshots.length}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {screenshots[selectedIndex].fileUrl && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-white hover:bg-white/20"
                                                onClick={() => window.open(screenshots[selectedIndex].fileUrl, "_blank")}
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Open
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-white hover:bg-white/20"
                                                asChild
                                            >
                                                <a href={screenshots[selectedIndex].fileUrl} download>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download
                                                </a>
                                            </Button>
                                        </>
                                    )}
                                    {canDelete && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-400 hover:bg-red-500/20 hover:text-red-300"
                                            onClick={() => {
                                                setDeleteTarget(screenshots[selectedIndex])
                                                setSelectedIndex(null)
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Delete Screenshot?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete this screenshot and deduct{" "}
                            <strong>{deleteTarget?.intervalMinutes || 0} minutes</strong> from the time tracking session.
                            This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Reason for deletion (optional)</Label>
                            <Input
                                placeholder="e.g., Contains sensitive information"
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                            />
                        </div>
                        {deleteTarget?.fileUrl && (
                            <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                                <Image
                                    src={deleteTarget.fileUrl}
                                    alt="Screenshot to delete"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                            disabled={deleteScreenshot.isPending}
                        >
                            {deleteScreenshot.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Screenshot
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}