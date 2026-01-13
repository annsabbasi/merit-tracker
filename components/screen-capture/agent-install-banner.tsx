// src/components/screen-capture/agent-install-banner.tsx
"use client"

import { useState } from "react"
import { useAgentCheckInstalled, useAgentDownloadInfo } from "@/lib/hooks/use-desktop-agent"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Download,
    Monitor,
    CheckCircle2,
    AlertTriangle,
    Laptop,
    Apple,
    ExternalLink,
    Copy,
    Check,
    Loader2,
    WifiOff,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { AgentDownloadInfo, Platform } from "@/lib/types/screen-capture"

interface AgentInstallBannerProps {
    className?: string
    showWhenInstalled?: boolean
}

export function AgentInstallBanner({ className, showWhenInstalled = false }: AgentInstallBannerProps) {
    const [isDownloadOpen, setIsDownloadOpen] = useState(false)
    const { data: agentStatus, isLoading } = useAgentCheckInstalled()
    const { data: downloadInfo } = useAgentDownloadInfo()

    if (isLoading) {
        return null
    }

    // Agent is installed and online - optionally show success state
    if (agentStatus?.installed && agentStatus?.online) {
        if (!showWhenInstalled) return null

        return (
            <Alert className={cn("border-green-200 bg-green-50", className)}>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Desktop Agent Connected</AlertTitle>
                <AlertDescription className="text-green-700">
                    Your Merit Tracker desktop agent is running and capturing screenshots.
                </AlertDescription>
            </Alert>
        )
    }

    // Agent is installed but offline
    if (agentStatus?.installed && !agentStatus?.online) {
        return (
            <Alert className={cn("border-orange-200 bg-orange-50", className)}>
                <WifiOff className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800">Desktop Agent Offline</AlertTitle>
                <AlertDescription className="text-orange-700 flex items-center justify-between">
                    <span>
                        The Merit Tracker desktop app is installed but not running. Please start the app to enable screen capture.
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100"
                        onClick={() => setIsDownloadOpen(true)}
                    >
                        Need Help?
                    </Button>
                </AlertDescription>
            </Alert>
        )
    }

    // Agent not installed
    return (
        <>
            <Alert className={cn("border-blue-200 bg-blue-50", className)}>
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Desktop Agent Required</AlertTitle>
                <AlertDescription className="text-blue-700 flex items-center justify-between">
                    <span>
                        Install the Merit Tracker desktop app to enable screen capture for time tracking verification.
                    </span>
                    <Button
                        size="sm"
                        className="ml-4"
                        onClick={() => setIsDownloadOpen(true)}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download App
                    </Button>
                </AlertDescription>
            </Alert>

            <DownloadDialog
                open={isDownloadOpen}
                onOpenChange={setIsDownloadOpen}
                downloadInfo={downloadInfo}
            />
        </>
    )
}

interface DownloadDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    downloadInfo?: AgentDownloadInfo
}

export function DownloadDialog({ open, onOpenChange, downloadInfo }: DownloadDialogProps) {
    const [copiedToken, setCopiedToken] = useState(false)
    const [selectedPlatform, setSelectedPlatform] = useState<Platform>("WINDOWS")

    const platforms: { id: Platform; name: string; icon: any; available: boolean }[] = [
        { id: "WINDOWS", name: "Windows", icon: Laptop, available: true },
        { id: "MAC", name: "macOS", icon: Apple, available: true },
        { id: "LINUX", name: "Linux", icon: Monitor, available: true },
    ]

    const getDownloadUrl = (platform: Platform) => {
        if (!downloadInfo) return null
        switch (platform) {
            case "WINDOWS":
                return downloadInfo.windows
            case "MAC":
                return downloadInfo.mac
            case "LINUX":
                return downloadInfo.linux
            default:
                return null
        }
    }

    const handleCopyToken = async () => {
        // In production, this would copy an actual registration token
        try {
            await navigator.clipboard.writeText("merit-tracker-registration-token")
            setCopiedToken(true)
            toast.success("Token copied to clipboard")
            setTimeout(() => setCopiedToken(false), 2000)
        } catch {
            toast.error("Failed to copy token")
        }
    }

    const handleDownload = (platform: Platform) => {
        const url = getDownloadUrl(platform)
        if (url) {
            window.open(url, "_blank")
            toast.success(`Downloading Merit Tracker for ${platform}...`)
        } else {
            toast.error("Download not available for this platform")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Download Merit Tracker Desktop
                    </DialogTitle>
                    <DialogDescription>
                        Install the desktop app to enable screen capture during time tracking.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v as Platform)}>
                    <TabsList className="grid grid-cols-3">
                        {platforms.map((platform) => {
                            const Icon = platform.icon
                            return (
                                <TabsTrigger
                                    key={platform.id}
                                    value={platform.id}
                                    disabled={!platform.available}
                                    className="flex items-center gap-2"
                                >
                                    <Icon className="h-4 w-4" />
                                    {platform.name}
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>

                    {platforms.map((platform) => (
                        <TabsContent key={platform.id} value={platform.id} className="space-y-4">
                            <div className="rounded-lg border p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium">Merit Tracker for {platform.name}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Version {downloadInfo?.version || "1.0.0"}
                                        </p>
                                    </div>
                                    {getDownloadUrl(platform.id) ? (
                                        <Button onClick={() => handleDownload(platform.id)}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    ) : (
                                        <Badge variant="secondary">Coming Soon</Badge>
                                    )}
                                </div>

                                {/* System Requirements */}
                                <div className="text-sm text-muted-foreground">
                                    <p className="font-medium text-foreground mb-1">System Requirements:</p>
                                    {platform.id === "WINDOWS" && (
                                        <ul className="list-disc list-inside space-y-0.5">
                                            <li>Windows 10 or later (64-bit)</li>
                                            <li>4GB RAM minimum</li>
                                            <li>100MB free disk space</li>
                                        </ul>
                                    )}
                                    {platform.id === "MAC" && (
                                        <ul className="list-disc list-inside space-y-0.5">
                                            <li>macOS 10.15 (Catalina) or later</li>
                                            <li>4GB RAM minimum</li>
                                            <li>100MB free disk space</li>
                                            <li>Screen Recording permission required</li>
                                        </ul>
                                    )}
                                    {platform.id === "LINUX" && (
                                        <ul className="list-disc list-inside space-y-0.5">
                                            <li>Ubuntu 20.04+, Fedora 34+, or similar</li>
                                            <li>4GB RAM minimum</li>
                                            <li>100MB free disk space</li>
                                            <li>X11 or Wayland display server</li>
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Installation Steps */}
                            <div className="space-y-3">
                                <h4 className="font-medium">Installation Steps:</h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                    <li>Download the installer for your platform</li>
                                    <li>Run the installer and follow the prompts</li>
                                    <li>Launch Merit Tracker from your applications</li>
                                    <li>Log in with your Merit Tracker account</li>
                                    <li>The app will automatically connect to your workspace</li>
                                </ol>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>

                {/* Help Section */}
                <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Having trouble? Check our documentation or contact support.
                        </p>
                        <Button variant="ghost" size="sm" asChild>
                            <a
                                href="https://docs.merittracker.com/desktop-agent"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Docs
                            </a>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}