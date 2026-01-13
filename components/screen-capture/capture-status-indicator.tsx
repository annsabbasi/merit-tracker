// src/components/screen-capture/capture-status-indicator.tsx
"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Camera, CameraOff, Shield, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CaptureStatusIndicatorProps {
    isCapturing: boolean
    isOnline?: boolean
    nextCaptureIn?: number // seconds until next capture
    className?: string
}

export function CaptureStatusIndicator({
    isCapturing,
    isOnline = true,
    nextCaptureIn,
    className,
}: CaptureStatusIndicatorProps) {
    const [countdown, setCountdown] = useState(nextCaptureIn)
    const [pulseColor, setPulseColor] = useState("bg-green-500")

    useEffect(() => {
        if (nextCaptureIn !== undefined) {
            setCountdown(nextCaptureIn)
        }
    }, [nextCaptureIn])

    useEffect(() => {
        if (countdown === undefined || countdown <= 0) return

        const timer = setInterval(() => {
            setCountdown((prev) => (prev !== undefined && prev > 0 ? prev - 1 : prev))
        }, 1000)

        return () => clearInterval(timer)
    }, [countdown])

    // Pulse animation when capturing
    useEffect(() => {
        if (!isCapturing) return

        const interval = setInterval(() => {
            setPulseColor((prev) =>
                prev === "bg-green-500" ? "bg-green-400" : "bg-green-500"
            )
        }, 1000)

        return () => clearInterval(interval)
    }, [isCapturing])

    if (!isOnline) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            variant="outline"
                            className={cn(
                                "flex items-center gap-1.5 text-orange-600 border-orange-300 bg-orange-50",
                                className
                            )}
                        >
                            <AlertTriangle className="h-3 w-3" />
                            <span>Agent Offline</span>
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Desktop agent is offline. Screenshots are not being captured.</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Please ensure the Merit Tracker app is running.
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    if (!isCapturing) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            variant="outline"
                            className={cn(
                                "flex items-center gap-1.5 text-muted-foreground",
                                className
                            )}
                        >
                            <CameraOff className="h-3 w-3" />
                            <span>Capture Paused</span>
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Screen capture is paused. Start tracking time to begin capturing.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant="outline"
                        className={cn(
                            "flex items-center gap-1.5 text-green-600 border-green-300 bg-green-50",
                            className
                        )}
                    >
                        <div className="relative">
                            <Camera className="h-3 w-3" />
                            <span className={cn(
                                "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full transition-colors duration-500",
                                pulseColor
                            )} />
                        </div>
                        <span>Capturing</span>
                        {countdown !== undefined && countdown > 0 && (
                            <span className="text-xs opacity-75">
                                ({Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')})
                            </span>
                        )}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="space-y-1">
                        <p className="flex items-center gap-2">
                            <Shield className="h-3 w-3 text-green-500" />
                            Screen capture is active
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Screenshots are captured at random intervals (2-5 min)
                        </p>
                        {countdown !== undefined && countdown > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Next capture in ~{Math.floor(countdown / 60)}m {countdown % 60}s
                            </p>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

// Larger status card variant for dashboards
interface CaptureStatusCardProps {
    isCapturing: boolean
    isOnline?: boolean
    screenshotCount?: number
    lastCaptureTime?: string
    className?: string
}

export function CaptureStatusCard({
    isCapturing,
    isOnline = true,
    screenshotCount = 0,
    lastCaptureTime,
    className,
}: CaptureStatusCardProps) {
    const formatLastCapture = (time?: string) => {
        if (!time) return "Never"
        const date = new Date(time)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return "Just now"
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
        return date.toLocaleDateString()
    }

    return (
        <div className={cn(
            "p-4 rounded-lg border",
            isCapturing && isOnline
                ? "border-green-200 bg-green-50"
                : !isOnline
                    ? "border-orange-200 bg-orange-50"
                    : "border-gray-200 bg-gray-50",
            className
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-full",
                        isCapturing && isOnline
                            ? "bg-green-500"
                            : !isOnline
                                ? "bg-orange-500"
                                : "bg-gray-400"
                    )}>
                        {isCapturing && isOnline ? (
                            <Camera className="h-5 w-5 text-white" />
                        ) : !isOnline ? (
                            <AlertTriangle className="h-5 w-5 text-white" />
                        ) : (
                            <CameraOff className="h-5 w-5 text-white" />
                        )}
                    </div>
                    <div>
                        <p className={cn(
                            "font-medium",
                            isCapturing && isOnline
                                ? "text-green-700"
                                : !isOnline
                                    ? "text-orange-700"
                                    : "text-gray-600"
                        )}>
                            {isCapturing && isOnline
                                ? "Screen Capture Active"
                                : !isOnline
                                    ? "Agent Offline"
                                    : "Capture Paused"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {isOnline
                                ? `Last capture: ${formatLastCapture(lastCaptureTime)}`
                                : "Desktop app not connected"}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{screenshotCount}</p>
                    <p className="text-xs text-muted-foreground">screenshots today</p>
                </div>
            </div>
        </div>
    )
}