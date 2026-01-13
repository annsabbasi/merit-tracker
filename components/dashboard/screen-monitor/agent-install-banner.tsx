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
import { Card, CardContent } from "@/components/ui/card"
import {
    Download,
    Monitor,
    CheckCircle2,
    AlertTriangle,
    Laptop,
    Apple,
    Loader2,
    ExternalLink,
    WifiOff,
} from "lucide-react"

interface AgentInstallBannerProps {
    showWhenInstalled?: boolean;
    compact?: boolean;
}

export function AgentInstallBanner({ showWhenInstalled = false, compact = false }: AgentInstallBannerProps) {
    const [isDownloadOpen, setIsDownloadOpen] = useState(false)
    const { data: agentStatus, isLoading } = useAgentCheckInstalled()
    const { data: downloadInfo } = useAgentDownloadInfo()

    if (isLoading) {
        return null
    }

    // Agent is installed and online
    if (agentStatus?.installed && agentStatus?.hasOnlineAgent) {
        if (!showWhenInstalled) return null

        return (
            <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-700 dark:text-green-400">
                    Desktop Agent Connected
                </AlertTitle>
                <AlertDescription className="text-green-600 dark:text-green-300">
                    Your screen capture agent is running and ready.
                    {agentStatus.agents?.[0]?.machineName && (
                        <span className="ml-1">
                            ({agentStatus.agents[0].machineName})
                        </span>
                    )}
                </AlertDescription>
            </Alert>
        )
    }

    // Agent installed but offline
    if (agentStatus?.installed && !agentStatus?.hasOnlineAgent) {
        return (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <WifiOff className="h-4 w-4 text-yellow-500" />
                <AlertTitle className="text-yellow-700 dark:text-yellow-400">
                    Desktop Agent Offline
                </AlertTitle>
                <AlertDescription className="text-yellow-600 dark:text-yellow-300">
                    Your desktop agent is installed but not running. Please start the Merit Tracker Desktop app to enable screen capture.
                </AlertDescription>
            </Alert>
        )
    }

    // Agent not installed
    if (compact) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDownloadOpen(true)}
                className="gap-2"
            >
                <Download className="h-4 w-4" />
                Install Desktop Agent
            </Button>
        )
    }

    return (
        <>
            <Alert className="border-blue-500/50 bg-blue-500/10">
                <Monitor className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-700 dark:text-blue-400">
                    Desktop Agent Required
                </AlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-300">
                    <p className="mb-3">
                        Some projects require screen monitoring during time tracking.
                        Install the Merit Tracker Desktop app to enable this feature.
                    </p>
                    <Button
                        size="sm"
                        onClick={() => setIsDownloadOpen(true)}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download Desktop App
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

// Download Dialog Component
interface DownloadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    downloadInfo?: Array<{
        platform: string;
        version: string;
        downloadUrl: string;
        releaseDate: string;
        fileSize: number;
        checksum: string;
        releaseNotes: string;
    }>;
}

function DownloadDialog({ open, onOpenChange, downloadInfo }: DownloadDialogProps) {
    const [downloading, setDownloading] = useState<string | null>(null)

    const handleDownload = (downloadUrl: string, platform: string) => {
        if (!downloadUrl) {
            console.error('No download URL available')
            return
        }

        console.log('Downloading:', downloadUrl)
        setDownloading(platform)

        // Create a temporary anchor element to trigger download
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = '' // This will use the filename from the URL
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setTimeout(() => {
            setDownloading(null)
        }, 2000)
    }

    // Helper function to format file size
    const formatFileSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024)
        return `~${Math.round(mb)} MB`
    }

    // Find platform info from downloadInfo array
    const getPlatformInfo = (platformName: string) => {
        return downloadInfo?.find(
            info => info.platform.toUpperCase() === platformName.toUpperCase()
        )
    }

    const platforms = [
        {
            id: 'WINDOWS',
            name: 'Windows',
            icon: Laptop,
            description: 'Windows 10 or later',
        },
        {
            id: 'MAC',
            name: 'macOS',
            icon: Apple,
            description: 'macOS 10.15 or later',
        },
        {
            id: 'LINUX',
            name: 'Linux',
            icon: Monitor,
            description: 'Ubuntu 20.04 or later',
        },
    ]

    // Get the current version from the first available download
    const currentVersion = downloadInfo?.[0]?.version || '1.0.0'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        Download Merit Tracker Desktop
                    </DialogTitle>
                    <DialogDescription>
                        Install the desktop agent to enable screen capture during time tracking.
                        The app runs quietly in your system tray.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 md:grid-cols-3">
                    {platforms.map((platform) => {
                        const Icon = platform.icon
                        const isDownloading = downloading === platform.id
                        const platformInfo = getPlatformInfo(platform.id)

                        return (
                            <Card
                                key={platform.id}
                                className="cursor-pointer hover:border-primary transition-colors"
                                onClick={() => {
                                    if (platformInfo?.downloadUrl) {
                                        handleDownload(platformInfo.downloadUrl, platform.id)
                                    }
                                }}
                            >
                                <CardContent className="p-4 text-center">
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="font-semibold">{platform.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {platform.description}
                                    </p>
                                    {platformInfo && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatFileSize(platformInfo.fileSize)}
                                        </p>
                                    )}
                                    <Button
                                        size="sm"
                                        className="mt-3 w-full gap-2"
                                        disabled={isDownloading || !platformInfo?.downloadUrl}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (platformInfo?.downloadUrl) {
                                                handleDownload(platformInfo.downloadUrl, platform.id)
                                            }
                                        }}
                                    >
                                        {isDownloading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Downloading...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="h-4 w-4" />
                                                Download
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                    <span>Version {currentVersion}</span>
                    {downloadInfo?.[0]?.releaseNotes && (
                        <Button variant="link" size="sm" className="gap-1 p-0 h-auto">
                            Release Notes
                            <ExternalLink className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        After Installation
                    </h4>
                    <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                        <li>Run the installer and follow the setup wizard</li>
                        <li>Sign in with your Merit Tracker account</li>
                        <li>The app will run in your system tray</li>
                        <li>Screen capture will automatically start when you track time</li>
                    </ol>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export { DownloadDialog }