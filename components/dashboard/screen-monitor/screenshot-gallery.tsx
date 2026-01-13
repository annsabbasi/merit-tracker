// src/components/screen-capture/screenshot-gallery.tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import {
    useScreenshotsByTimeTracking,
    useScreenshotStats,
    useDeleteScreenshot,
    useBulkDeleteScreenshots,
} from "@/lib/hooks/use-screenshots"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Camera,
    Trash2,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ZoomIn,
    Download,
    Loader2,
    ImageOff,
    MonitorSmartphone,
    Calendar,
} from "lucide-react"
import { toast } from "sonner"
import type { Screenshot, CaptureStatus } from "@/lib/types/screen-capture"

interface ScreenshotGalleryProps {
    timeTrackingId: string;
    showStats?: boolean;
    canDelete?: boolean;
}

export function ScreenshotGallery({
    timeTrackingId,
    showStats = true,
    canDelete = true,
}: ScreenshotGalleryProps) {
    const { user } = useAuthStore()
    const [selectedScreenshots, setSelectedScreenshots] = useState<string[]>([])
    const [viewingScreenshot, setViewingScreenshot] = useState<Screenshot | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
    const [deleteReason, setDeleteReason] = useState("")

    const { data: screenshots, isLoading } = useScreenshotsByTimeTracking(timeTrackingId)
    const { data: stats } = useScreenshotStats(timeTrackingId)
    const deleteScreenshot = useDeleteScreenshot()
    const bulkDelete = useBulkDeleteScreenshots()

    const isAdmin = user?.role === "COMPANY" || user?.role === "QC_ADMIN"

    const handleSelectAll = () => {
        if (selectedScreenshots.length === screenshots?.length) {
            setSelectedScreenshots([])
        } else {
            setSelectedScreenshots(screenshots?.map(s => s.id) || [])
        }
    }

    const handleToggleSelect = (id: string) => {
        setSelectedScreenshots(prev =>
            prev.includes(id)
                ? prev.filter(s => s !== id)
                : [...prev, id]
        )
    }

    const handleDelete = async () => {
        if (!viewingScreenshot) return

        try {
            const result = await deleteScreenshot.mutateAsync({
                id: viewingScreenshot.id,
                reason: deleteReason || undefined,
            })

            toast.success(
                `Screenshot deleted. ${result.minutesDeducted} minutes deducted from session.`
            )
            setDeleteDialogOpen(false)
            setViewingScreenshot(null)
            setDeleteReason("")
        } catch (error) {
            toast.error("Failed to delete screenshot")
        }
    }

    const handleBulkDelete = async () => {
        if (selectedScreenshots.length === 0) return

        try {
            const result = await bulkDelete.mutateAsync({
                ids: selectedScreenshots,
                reason: deleteReason || undefined,
            })

            toast.success(
                `${result.deletedCount} screenshots deleted. ${result.totalMinutesDeducted} minutes deducted.`
            )
            setBulkDeleteDialogOpen(false)
            setSelectedScreenshots([])
            setDeleteReason("")
        } catch (error) {
            toast.error("Failed to delete screenshots")
        }
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const statusConfig: Record<CaptureStatus, { icon: any; color: string; label: string }> = {
        SUCCESS: { icon: CheckCircle2, color: "text-green-500", label: "Captured" },
        FAILED: { icon: XCircle, color: "text-red-500", label: "Failed" },
        PERMISSION_DENIED: { icon: AlertTriangle, color: "text-yellow-500", label: "Permission Denied" },
        IDLE_DETECTED: { icon: Clock, color: "text-orange-500", label: "Idle" },
        SCREEN_LOCKED: { icon: MonitorSmartphone, color: "text-blue-500", label: "Screen Locked" },
        OFFLINE: { icon: XCircle, color: "text-gray-500", label: "Offline" },
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Screenshots
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="aspect-video rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Camera className="h-5 w-5" />
                            Screenshots
                            {screenshots && screenshots.length > 0 && (
                                <Badge variant="secondary">{screenshots.length}</Badge>
                            )}
                        </CardTitle>
                        {showStats && stats && (
                            <CardDescription className="mt-1">
                                {stats.captureRate.toFixed(0)}% capture rate •
                                {stats.totalIntervalMinutes} minutes covered
                            </CardDescription>
                        )}
                    </div>
                    {canDelete && isAdmin && screenshots && screenshots.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAll}
                            >
                                {selectedScreenshots.length === screenshots.length
                                    ? "Deselect All"
                                    : "Select All"}
                            </Button>
                            {selectedScreenshots.length > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setBulkDeleteDialogOpen(true)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete ({selectedScreenshots.length})
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Stats Bar */}
                {showStats && stats && (
                    <div className="mt-4 grid grid-cols-4 gap-4">
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-lg font-bold">{stats.totalScreenshots}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-green-500/10">
                            <p className="text-lg font-bold text-green-600">{stats.successfulCaptures}</p>
                            <p className="text-xs text-muted-foreground">Successful</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-red-500/10">
                            <p className="text-lg font-bold text-red-600">{stats.failedCaptures}</p>
                            <p className="text-xs text-muted-foreground">Failed</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-blue-500/10">
                            <p className="text-lg font-bold text-blue-600">{stats.captureRate.toFixed(0)}%</p>
                            <p className="text-xs text-muted-foreground">Rate</p>
                        </div>
                    </div>
                )}
            </CardHeader>

            <CardContent>
                {screenshots && screenshots.length > 0 ? (
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                        {screenshots.map((screenshot) => {
                            const StatusIcon = statusConfig[screenshot.captureStatus]?.icon || Camera
                            const isSelected = selectedScreenshots.includes(screenshot.id)

                            return (
                                <div
                                    key={screenshot.id}
                                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${isSelected
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-transparent hover:border-primary/50"
                                        }`}
                                    onClick={() => setViewingScreenshot(screenshot)}
                                >
                                    {/* Selection Checkbox */}
                                    {canDelete && isAdmin && (
                                        <div
                                            className="absolute top-2 left-2 z-10"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleToggleSelect(screenshot.id)
                                            }}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                className="bg-background/80"
                                            />
                                        </div>
                                    )}

                                    {/* Thumbnail */}
                                    <div className="aspect-video bg-muted relative">
                                        {screenshot.fileUrl ? (
                                            <img
                                                src={screenshot.fileUrl}
                                                alt={`Screenshot at ${formatTime(screenshot.capturedAt)}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageOff className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        )}

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ZoomIn className="h-6 w-6 text-white" />
                                        </div>

                                        {/* Status Badge */}
                                        <div className="absolute bottom-2 right-2">
                                            <Badge
                                                variant="secondary"
                                                className={`text-xs ${statusConfig[screenshot.captureStatus]?.color}`}
                                            >
                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                {screenshot.intervalMinutes}m
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Time Label */}
                                    <div className="p-2 bg-muted/50">
                                        <p className="text-xs text-center font-medium">
                                            {formatTime(screenshot.capturedAt)}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Camera className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                        <p className="mt-4 text-muted-foreground">No screenshots captured yet</p>
                    </div>
                )}
            </CardContent>

            {/* View Screenshot Dialog */}
            <Dialog
                open={!!viewingScreenshot}
                onOpenChange={(open) => !open && setViewingScreenshot(null)}
            >
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Camera className="h-5 w-5" />
                            Screenshot Details
                        </DialogTitle>
                        <DialogDescription>
                            Captured at {viewingScreenshot && formatTime(viewingScreenshot.capturedAt)} on{" "}
                            {viewingScreenshot && formatDate(viewingScreenshot.capturedAt)}
                        </DialogDescription>
                    </DialogHeader>

                    {viewingScreenshot && (
                        <>
                            {/* Full Image */}
                            <div className="rounded-lg overflow-hidden bg-muted">
                                {viewingScreenshot.fileUrl ? (
                                    <img
                                        src={viewingScreenshot.fileUrl}
                                        alt="Screenshot"
                                        className="w-full h-auto"
                                    />
                                ) : (
                                    <div className="aspect-video flex items-center justify-center">
                                        <ImageOff className="h-16 w-16 text-muted-foreground" />
                                    </div>
                                )}
                            </div>

                            {/* Metadata */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Interval</p>
                                    <p className="font-medium">{viewingScreenshot.intervalMinutes} minutes</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <Badge variant="outline" className={statusConfig[viewingScreenshot.captureStatus]?.color}>
                                        {statusConfig[viewingScreenshot.captureStatus]?.label}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Resolution</p>
                                    <p className="font-medium">
                                        {viewingScreenshot.screenWidth && viewingScreenshot.screenHeight
                                            ? `${viewingScreenshot.screenWidth}x${viewingScreenshot.screenHeight}`
                                            : "Unknown"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Monitor</p>
                                    <p className="font-medium">#{viewingScreenshot.monitorIndex + 1}</p>
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                {viewingScreenshot.fileUrl && (
                                    <Button
                                        variant="outline"
                                        onClick={() => window.open(viewingScreenshot.fileUrl, '_blank')}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                )}
                                {canDelete && isAdmin && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => setDeleteDialogOpen(true)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Screenshot?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Deleting this screenshot will deduct{" "}
                            <strong>{viewingScreenshot?.intervalMinutes} minutes</strong> from the
                            time tracking session. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-4">
                        <Label>Reason for deletion (optional)</Label>
                        <Textarea
                            placeholder="e.g., Contains sensitive information..."
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                            disabled={deleteScreenshot.isPending}
                        >
                            {deleteScreenshot.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Delete Screenshot"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Confirmation Dialog */}
            <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete {selectedScreenshots.length} Screenshots?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Deleting these screenshots will deduct time from the tracking session.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-4">
                        <Label>Reason for deletion (optional)</Label>
                        <Textarea
                            placeholder="e.g., Contains sensitive information..."
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleBulkDelete}
                            disabled={bulkDelete.isPending}
                        >
                            {bulkDelete.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                `Delete ${selectedScreenshots.length} Screenshots`
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}