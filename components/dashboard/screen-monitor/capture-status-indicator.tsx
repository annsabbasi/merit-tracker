// src/components/screen-capture/capture-status-indicator.tsx
"use client"

import { useEffect, useState } from "react"
import { useAgentCheckInstalled } from "@/lib/hooks/use-desktop-agent"
import { Badge } from "@/components/ui/badge"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Camera,
    CameraOff,
    Loader2,
    CheckCircle2,
    AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CaptureStatusIndicatorProps {
    isCapturing?: boolean;
    showLabel?: boolean;
    className?: string;
}

export function CaptureStatusIndicator({
    isCapturing = false,
    showLabel = true,
    className,
}: CaptureStatusIndicatorProps) {
    const { data: agentStatus, isLoading } = useAgentCheckInstalled()
    const [pulse, setPulse] = useState(false)

    // Pulse effect when capturing
    useEffect(() => {
        if (!isCapturing) {
            setPulse(false)
            return
        }

        const interval = setInterval(() => {
            setPulse(p => !p)
        }, 2000)

        return () => clearInterval(interval)
    }, [isCapturing])

    if (isLoading) {
        return (
            <Badge variant="secondary" className={cn("gap-1", className)}>
                <Loader2 className="h-3 w-3 animate-spin" />
                {showLabel && "Checking..."}
            </Badge>
        )
    }

    // Agent not installed
    if (!agentStatus?.installed) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            variant="secondary"
                            className={cn("gap-1 cursor-help", className)}
                        >
                            <CameraOff className="h-3 w-3" />
                            {showLabel && "No Agent"}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Desktop agent not installed</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    // Agent offline
    if (!agentStatus.online) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            variant="outline"
                            className={cn("gap-1 text-yellow-500 border-yellow-500 cursor-help", className)}
                        >
                            <AlertTriangle className="h-3 w-3" />
                            {showLabel && "Agent Offline"}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Please start the Merit Tracker Desktop app</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    // Actively capturing
    if (isCapturing) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            className={cn(
                                "gap-1 bg-green-500 text-white cursor-help transition-all",
                                pulse && "bg-green-600",
                                className
                            )}
                        >
                            <Camera className={cn("h-3 w-3", pulse && "animate-pulse")} />
                            {showLabel && "Capturing"}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Screenshots are being captured automatically</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    // Agent ready but not capturing
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant="outline"
                        className={cn("gap-1 text-green-500 border-green-500 cursor-help", className)}
                    >
                        <CheckCircle2 className="h-3 w-3" />
                        {showLabel && "Ready"}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Agent connected and ready for screen capture</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

// Mini version for compact spaces
export function CaptureStatusDot({
    isCapturing = false,
    className,
}: {
    isCapturing?: boolean;
    className?: string;
}) {
    const { data: agentStatus } = useAgentCheckInstalled()
    const [pulse, setPulse] = useState(false)

    useEffect(() => {
        if (!isCapturing) {
            setPulse(false)
            return
        }

        const interval = setInterval(() => {
            setPulse(p => !p)
        }, 1500)

        return () => clearInterval(interval)
    }, [isCapturing])

    const getStatusColor = () => {
        if (!agentStatus?.installed) return "bg-gray-400"
        if (!agentStatus.online) return "bg-yellow-400"
        if (isCapturing) return "bg-green-500"
        return "bg-green-400"
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "w-2 h-2 rounded-full transition-all cursor-help",
                            getStatusColor(),
                            isCapturing && pulse && "scale-125",
                            className
                        )}
                    />
                </TooltipTrigger>
                <TooltipContent>
                    {!agentStatus?.installed && <p>Agent not installed</p>}
                    {agentStatus?.installed && !agentStatus.online && <p>Agent offline</p>}
                    {agentStatus?.installed && agentStatus.online && !isCapturing && <p>Ready for capture</p>}
                    {agentStatus?.installed && agentStatus.online && isCapturing && <p>Capturing screenshots</p>}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}