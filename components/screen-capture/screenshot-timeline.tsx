// src/components/screen-capture/screenshot-timeline.tsx
"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { useScreenshots, useMyScreenshotSummary, useBulkDeleteScreenshots } from "@/lib/hooks/use-screenshots"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import {
    Camera,
    CalendarIcon,
    Clock,
    Image as ImageIcon,
    Trash2,
    Filter,
    ChevronDown,
    ChevronUp,
    Loader2,
    AlertTriangle,
    BarChart3,
    Search,
    X,
} from "lucide-react"
import { toast } from "sonner"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import type { Screenshot, ScreenshotQueryParams, CaptureStatus } from "@/lib/types/screen-capture"

interface ScreenshotTimelineProps {
    userId?: string
    projectId?: string
    subProjectId?: string
    canDelete?: boolean
    className?: string
}

export function ScreenshotTimeline({
    userId,
    projectId,
    subProjectId,
    canDelete = false,
    className,
}: ScreenshotTimelineProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [deleteReason, setDeleteReason] = useState("")
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

    // Filters
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: subDays(new Date(), 7),
        to: new Date(),
    })
    const [statusFilter, setStatusFilter] = useState<CaptureStatus | "ALL">("ALL")

    const filters: ScreenshotQueryParams = {
        userId,
        projectId,
        subProjectId,
        startDate: format(startOfDay(dateRange.from), "yyyy-MM-dd'T'HH:mm:ss"),
        endDate: format(endOfDay(dateRange.to), "yyyy-MM-dd'T'HH:mm:ss"),
        status: statusFilter !== "ALL" ? statusFilter : undefined,
    }

    const { data: screenshotsData, isLoading } = useScreenshots(filters)
    const { data: summary } = useMyScreenshotSummary()
    const bulkDelete = useBulkDeleteScreenshots()

    // Handle both array response and object with screenshots property
    const screenshots = useMemo(() => {
        if (!screenshotsData) return []
        // If it's already an array, use it directly
        if (Array.isArray(screenshotsData)) return screenshotsData
        // If it's an object with screenshots property
        if (screenshotsData && typeof screenshotsData === 'object' && 'screenshots' in screenshotsData) {
            return (screenshotsData as { screenshots: Screenshot[] }).screenshots || []
        }
        // If it's an object with data property
        if (screenshotsData && typeof screenshotsData === 'object' && 'data' in screenshotsData) {
            return (screenshotsData as { data: Screenshot[] }).data || []
        }
        return []
    }, [screenshotsData])

    // Group screenshots by date
    const groupedScreenshots = useMemo(() => {
        if (!screenshots || screenshots.length === 0) return new Map<string, Screenshot[]>()

        const groups = new Map<string, Screenshot[]>()
        screenshots.forEach((screenshot: Screenshot) => {
            const date = format(new Date(screenshot.capturedAt), "yyyy-MM-dd")
            if (!groups.has(date)) {
                groups.set(date, [])
            }
            groups.get(date)!.push(screenshot)
        })

        // Sort by date descending
        return new Map([...groups.entries()].sort((a, b) => b[0].localeCompare(a[0])))
    }, [screenshots])

    const toggleDateExpand = (date: string) => {
        const newExpanded = new Set(expandedDates)
        if (newExpanded.has(date)) {
            newExpanded.delete(date)
        } else {
            newExpanded.add(date)
        }
        setExpandedDates(newExpanded)
    }

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const selectAll = () => {
        if (!screenshots) return
        if (selectedIds.size === screenshots.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(screenshots.map((s) => s.id)))
        }
    }

    const selectDate = (date: string) => {
        const dateScreenshots = groupedScreenshots.get(date) || []
        const allSelected = dateScreenshots.every((s) => selectedIds.has(s.id))

        const newSelected = new Set(selectedIds)
        dateScreenshots.forEach((s) => {
            if (allSelected) {
                newSelected.delete(s.id)
            } else {
                newSelected.add(s.id)
            }
        })
        setSelectedIds(newSelected)
    }

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return

        try {
            await bulkDelete.mutateAsync({
                ids: Array.from(selectedIds),
                reason: deleteReason || undefined,
            })
            toast.success(`${selectedIds.size} screenshots deleted`)
            setSelectedIds(new Set())
            setIsDeleteDialogOpen(false)
            setDeleteReason("")
        } catch (error) {
            toast.error("Failed to delete screenshots")
        }
    }

    const formatDateHeader = (dateStr: string) => {
        const date = new Date(dateStr)
        const today = new Date()
        const yesterday = subDays(today, 1)

        if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
            return "Today"
        }
        if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) {
            return "Yesterday"
        }
        return format(date, "EEEE, MMMM d, yyyy")
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Summary Stats */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <Camera className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{summary.total || 0}</p>
                                    <p className="text-sm text-muted-foreground">Total</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10">
                                    <BarChart3 className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {summary.byStatus?.find((s) => s.status === "SUCCESS")?._count || 0}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Successful</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-500/10">
                                    <Trash2 className="h-5 w-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{summary.deleted?.count || 0}</p>
                                    <p className="text-sm text-muted-foreground">Deleted</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                    <Clock className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{summary.deleted?.totalMinutesDeducted || 0}m</p>
                                    <p className="text-sm text-muted-foreground">Deducted</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Date Range */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="justify-start">
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="range"
                                    selected={{ from: dateRange.from, to: dateRange.to }}
                                    onSelect={(range) => {
                                        if (range?.from && range?.to) {
                                            setDateRange({ from: range.from, to: range.to })
                                        }
                                    }}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Status Filter */}
                        <Select
                            value={statusFilter}
                            onValueChange={(v) => setStatusFilter(v as CaptureStatus | "ALL")}
                        >
                            <SelectTrigger className="w-40">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="SUCCESS">Success</SelectItem>
                                <SelectItem value="FAILED">Failed</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Quick Date Presets */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDateRange({ from: new Date(), to: new Date() })}
                            >
                                Today
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
                            >
                                Last 7 days
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
                            >
                                Last 30 days
                            </Button>
                        </div>

                        {/* Bulk Actions */}
                        {canDelete && selectedIds.size > 0 && (
                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {selectedIds.size} selected
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedIds(new Set())}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Clear
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete Selected
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Timeline */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-4">
                                    {[...Array(4)].map((_, j) => (
                                        <Skeleton key={j} className="aspect-video" />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : groupedScreenshots.size > 0 ? (
                <div className="space-y-4">
                    {Array.from(groupedScreenshots.entries()).map(([date, dateScreenshots]) => {
                        const isExpanded = expandedDates.has(date)
                        const allSelected = dateScreenshots.every((s) => selectedIds.has(s.id))
                        const someSelected = dateScreenshots.some((s) => selectedIds.has(s.id))
                        const displayCount = isExpanded ? dateScreenshots.length : 4

                        return (
                            <Card key={date}>
                                <CardHeader className="cursor-pointer" onClick={() => toggleDateExpand(date)}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {canDelete && (
                                                <Checkbox
                                                    checked={allSelected}
                                                    // indeterminate={someSelected && !allSelected}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        selectDate(date)
                                                    }}
                                                />
                                            )}
                                            <div>
                                                <CardTitle className="text-lg">
                                                    {formatDateHeader(date)}
                                                </CardTitle>
                                                <CardDescription>
                                                    {dateScreenshots.length} screenshots
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            {isExpanded ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                        {dateScreenshots.slice(0, displayCount).map((screenshot) => (
                                            <div
                                                key={screenshot.id}
                                                className={cn(
                                                    "group relative aspect-video rounded-lg overflow-hidden bg-muted border transition-all",
                                                    selectedIds.has(screenshot.id) && "ring-2 ring-primary"
                                                )}
                                            >
                                                {screenshot.fileUrl ? (
                                                    <Image
                                                        src={screenshot.fileUrl}
                                                        alt={`Screenshot`}
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                )}

                                                {/* Selection checkbox */}
                                                {canDelete && (
                                                    <div className="absolute top-2 left-2 z-10">
                                                        <Checkbox
                                                            checked={selectedIds.has(screenshot.id)}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                toggleSelect(screenshot.id)
                                                            }}
                                                            className="bg-white/80"
                                                        />
                                                    </div>
                                                )}

                                                {/* Time badge */}
                                                <Badge
                                                    variant="secondary"
                                                    className="absolute bottom-2 left-2 bg-black/60 text-white text-xs"
                                                >
                                                    {format(new Date(screenshot.capturedAt), "HH:mm")}
                                                </Badge>

                                                {/* Project info */}
                                                {screenshot.timeTracking?.subProject && (
                                                    <div className="absolute bottom-2 right-2">
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-black/60 text-white text-xs border-0 truncate max-w-[100px]"
                                                        >
                                                            {screenshot.timeTracking.subProject.title}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {!isExpanded && dateScreenshots.length > 4 && (
                                        <Button
                                            variant="ghost"
                                            className="w-full mt-3"
                                            onClick={() => toggleDateExpand(date)}
                                        >
                                            Show {dateScreenshots.length - 4} more
                                            <ChevronDown className="h-4 w-4 ml-2" />
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <Card className="p-8 text-center">
                    <Camera className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="mt-4 text-muted-foreground">No screenshots found for the selected period</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Try adjusting your date range or filters
                    </p>
                </Card>
            )}

            {/* Bulk Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Delete {selectedIds.size} Screenshots?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete the selected screenshots and deduct the corresponding
                            time from each time tracking session. This cannot be undone.
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
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleBulkDelete}
                            disabled={bulkDelete.isPending}
                        >
                            {bulkDelete.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete {selectedIds.size} Screenshots
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}