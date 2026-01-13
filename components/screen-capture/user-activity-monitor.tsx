// src/components/screen-capture/user-activity-monitor.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { useScreenshots } from "@/lib/hooks/use-screenshots"
import { useCompanyAgents } from "@/lib/hooks/use-desktop-agent"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Camera,
    Clock,
    Monitor,
    Activity,
    Eye,
    ChevronRight,
    RefreshCw,
    Loader2,
    Image as ImageIcon,
    CheckCircle2,
    WifiOff,
} from "lucide-react"
import { format, formatDistanceToNow, subMinutes } from "date-fns"
import { cn } from "@/lib/utils"
import type { Screenshot } from "@/lib/types/screen-capture"

// Helper to normalize screenshots response
function normalizeScreenshots(data: unknown): Screenshot[] {
    if (!data) return []
    if (Array.isArray(data)) return data
    if (typeof data === 'object' && data !== null) {
        if ('screenshots' in data) return (data as { screenshots: Screenshot[] }).screenshots || []
        if ('data' in data) return (data as { data: Screenshot[] }).data || []
    }
    return []
}

interface UserActivityMonitorProps {
    className?: string
    refreshInterval?: number // in seconds
    onUserSelect?: (userId: string) => void
}

export function UserActivityMonitor({
    className,
    refreshInterval = 30,
    onUserSelect,
}: UserActivityMonitorProps) {
    const [isRefreshing, setIsRefreshing] = useState(false)

    const { data: companyAgents, isLoading: agentsLoading, refetch: refetchAgents } = useCompanyAgents()

    // Get recent screenshots (last 15 minutes)
    const { data: recentScreenshotsData, isLoading: screenshotsLoading, refetch: refetchScreenshots } = useScreenshots({
        startDate: subMinutes(new Date(), 15).toISOString(),
        endDate: new Date().toISOString(),
    })

    // Normalize screenshots data
    const recentScreenshots = useMemo(() => normalizeScreenshots(recentScreenshotsData), [recentScreenshotsData])

    // Auto-refresh
    useEffect(() => {
        const interval = setInterval(() => {
            refetchAgents()
            refetchScreenshots()
        }, refreshInterval * 1000)

        return () => clearInterval(interval)
    }, [refreshInterval, refetchAgents, refetchScreenshots])

    const handleManualRefresh = async () => {
        setIsRefreshing(true)
        await Promise.all([refetchAgents(), refetchScreenshots()])
        setIsRefreshing(false)
    }

    // Group online agents with their latest screenshots
    const onlineUsersWithActivity = companyAgents
        ?.filter((agent) => agent.isOnline)
        .map((agent) => {
            const userScreenshots = recentScreenshots.filter(
                (s: Screenshot) => s.userId === agent.userId
            ) || []
            const latestScreenshot = userScreenshots[0]

            return {
                ...agent,
                screenshots: userScreenshots,
                latestScreenshot,
            }
        }) || []

    // Sort by most recent activity
    onlineUsersWithActivity.sort((a, b) => {
        const aTime = a.latestScreenshot?.capturedAt || a.lastHeartbeat || ""
        const bTime = b.latestScreenshot?.capturedAt || b.lastHeartbeat || ""
        return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

    const isLoading = agentsLoading || screenshotsLoading

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-green-500" />
                            Live Activity
                        </CardTitle>
                        <CardDescription>
                            Real-time view of team members currently tracking time
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-green-600 border-green-300">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                            {onlineUsersWithActivity.length} active
                        </Badge>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleManualRefresh}
                                        disabled={isRefreshing}
                                    >
                                        {isRefreshing ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Refresh activity</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-32 mb-2" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-16 w-28 rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : onlineUsersWithActivity.length > 0 ? (
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                            {onlineUsersWithActivity.map((userActivity) => (
                                <div
                                    key={userActivity.id}
                                    className="flex items-center gap-4 p-3 rounded-lg border hover:border-primary hover:bg-muted/50 transition-all cursor-pointer group"
                                    onClick={() => onUserSelect?.(userActivity.userId)}
                                >
                                    {/* User Avatar */}
                                    <div className="relative">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={userActivity.user?.avatar || ""} />
                                            <AvatarFallback>
                                                {userActivity.user?.firstName?.[0]}
                                                {userActivity.user?.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {userActivity.user?.firstName} {userActivity.user?.lastName}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Monitor className="h-3 w-3" />
                                            <span>{userActivity.machineName || "Unknown"}</span>
                                            <span>•</span>
                                            <span>{userActivity.platform}</span>
                                        </div>
                                        {userActivity.latestScreenshot?.timeTracking?.subProject && (
                                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                                Working on: {userActivity.latestScreenshot.timeTracking.subProject.title}
                                            </p>
                                        )}
                                    </div>

                                    {/* Latest Screenshot Preview */}
                                    <div className="flex items-center gap-3">
                                        {userActivity.latestScreenshot?.fileUrl ? (
                                            <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-muted border">
                                                <Image
                                                    src={userActivity.latestScreenshot.fileUrl}
                                                    alt="Latest screenshot"
                                                    fill
                                                    className="object-cover"
                                                    sizes="112px"
                                                />
                                                <div className="absolute bottom-1 left-1">
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px] bg-black/60 text-white"
                                                    >
                                                        {format(
                                                            new Date(userActivity.latestScreenshot.capturedAt),
                                                            "HH:mm"
                                                        )}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-28 h-16 rounded-lg bg-muted flex items-center justify-center border">
                                                <Camera className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}

                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">
                                                Last activity
                                            </p>
                                            <p className="text-sm font-medium">
                                                {userActivity.lastHeartbeat
                                                    ? formatDistanceToNow(
                                                        new Date(userActivity.lastHeartbeat),
                                                        { addSuffix: true }
                                                    )
                                                    : "N/A"}
                                            </p>
                                        </div>

                                        <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="text-center py-12">
                        <WifiOff className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                        <p className="mt-4 text-muted-foreground">No team members currently online</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Activity will appear here when team members start tracking time
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// ============================================
// LIVE SCREENSHOT FEED COMPONENT
// ============================================
interface LiveScreenshotFeedProps {
    className?: string
    limit?: number
}

export function LiveScreenshotFeed({ className, limit = 12 }: LiveScreenshotFeedProps) {
    const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null)

    const { data: screenshotsData, isLoading } = useScreenshots({
        startDate: subMinutes(new Date(), 60).toISOString(),
        endDate: new Date().toISOString(),
        limit,
    })

    // Normalize screenshots data
    const screenshots = useMemo(() => normalizeScreenshots(screenshotsData), [screenshotsData])

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="aspect-video" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Recent Captures
                </CardTitle>
                <CardDescription>
                    Latest screenshots from all active team members
                </CardDescription>
            </CardHeader>
            <CardContent>
                {screenshots && screenshots.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {screenshots.slice(0, limit).map((screenshot) => (
                            <div
                                key={screenshot.id}
                                className="group relative aspect-video rounded-lg overflow-hidden bg-muted border cursor-pointer hover:border-primary transition-all"
                                onClick={() => setSelectedScreenshot(screenshot)}
                            >
                                {screenshot.fileUrl ? (
                                    <Image
                                        src={screenshot.fileUrl}
                                        alt="Screenshot"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                )}

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {/* User badge */}
                                <div className="absolute top-1 left-1">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Avatar className="h-6 w-6 border-2 border-white">
                                                    <AvatarImage src={screenshot.user?.avatar || ""} />
                                                    <AvatarFallback className="text-[10px]">
                                                        {screenshot.user?.firstName?.[0]}
                                                        {screenshot.user?.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>
                                                    {screenshot.user?.firstName} {screenshot.user?.lastName}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>

                                {/* Time badge */}
                                <Badge
                                    variant="secondary"
                                    className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white"
                                >
                                    {format(new Date(screenshot.capturedAt), "HH:mm")}
                                </Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Camera className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                        <p className="mt-4 text-muted-foreground">No recent screenshots</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}