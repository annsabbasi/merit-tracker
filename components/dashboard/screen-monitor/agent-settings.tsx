// src/components/screen-capture/agent-settings.tsx
"use client"

import { useState } from "react"
import {
    useMyAgents,
    useUpdateAgent,
    useDeactivateAgent,
    useDeleteAgent,
    useAgentDownloadInfo,
} from "@/lib/hooks/use-desktop-agent"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Monitor,
    Laptop,
    Apple,
    CheckCircle2,
    XCircle,
    MoreVertical,
    Trash2,
    Power,
    Settings,
    Download,
    Loader2,
    Clock,
    HardDrive,
    Wifi,
    WifiOff,
} from "lucide-react"
import { toast } from "sonner"
import type { DesktopAgent, Platform } from "@/lib/types/screen-capture"
import { DownloadDialog } from "./agent-install-banner"

export function AgentSettings() {
    const [selectedAgent, setSelectedAgent] = useState<DesktopAgent | null>(null)
    const [isDeactivateOpen, setIsDeactivateOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isDownloadOpen, setIsDownloadOpen] = useState(false)

    const { data: agents, isLoading } = useMyAgents()
    const { data: downloadInfo } = useAgentDownloadInfo()
    const updateAgent = useUpdateAgent()
    const deactivateAgent = useDeactivateAgent()
    const deleteAgent = useDeleteAgent()

    const handleUpdateQuality = async (agentId: string, quality: number) => {
        try {
            await updateAgent.mutateAsync({
                id: agentId,
                data: { captureQuality: quality },
            })
            toast.success("Capture quality updated")
        } catch (error) {
            toast.error("Failed to update settings")
        }
    }

    const handleToggleMultiMonitor = async (agentId: string, enabled: boolean) => {
        try {
            await updateAgent.mutateAsync({
                id: agentId,
                data: { captureAllMonitors: enabled },
            })
            toast.success(enabled ? "Multi-monitor capture enabled" : "Multi-monitor capture disabled")
        } catch (error) {
            toast.error("Failed to update settings")
        }
    }

    const handleDeactivate = async () => {
        if (!selectedAgent) return

        try {
            await deactivateAgent.mutateAsync(selectedAgent.id)
            toast.success("Agent deactivated")
            setIsDeactivateOpen(false)
            setSelectedAgent(null)
        } catch (error) {
            toast.error("Failed to deactivate agent")
        }
    }

    const handleDelete = async () => {
        if (!selectedAgent) return

        try {
            await deleteAgent.mutateAsync(selectedAgent.id)
            toast.success("Agent removed")
            setIsDeleteOpen(false)
            setSelectedAgent(null)
        } catch (error) {
            toast.error("Failed to remove agent")
        }
    }

    const platformIcons: Record<Platform, any> = {
        WINDOWS: Laptop,
        MAC: Apple,
        LINUX: Monitor,
    }

    const formatLastSeen = (dateString?: string) => {
        if (!dateString) return "Never"

        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)

        if (minutes < 1) return "Just now"
        if (minutes < 60) return `${minutes}m ago`
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
        return date.toLocaleDateString()
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        Desktop Agents
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Monitor className="h-5 w-5" />
                                Desktop Agents
                            </CardTitle>
                            <CardDescription>
                                Manage your installed screen capture agents
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsDownloadOpen(true)}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Add Device
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {agents && agents.length > 0 ? (
                        <div className="space-y-4">
                            {agents.map((agent) => {
                                const PlatformIcon = platformIcons[agent.platform] || Monitor

                                return (
                                    <div
                                        key={agent.id}
                                        className={`p-4 rounded-lg border ${agent.isOnline
                                            ? "border-green-500/30 bg-green-500/5"
                                            : "border-muted bg-muted/20"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-lg ${agent.isOnline
                                                    ? "bg-green-500/10"
                                                    : "bg-muted"
                                                    }`}>
                                                    <PlatformIcon className={`h-6 w-6 ${agent.isOnline
                                                        ? "text-green-500"
                                                        : "text-muted-foreground"
                                                        }`} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold">
                                                            {agent.machineName || "Unknown Device"}
                                                        </h3>
                                                        {agent.isOnline ? (
                                                            <Badge className="bg-green-500 text-white">
                                                                <Wifi className="h-3 w-3 mr-1" />
                                                                Online
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary">
                                                                <WifiOff className="h-3 w-3 mr-1" />
                                                                Offline
                                                            </Badge>
                                                        )}
                                                        {!agent.isActive && (
                                                            <Badge variant="destructive">
                                                                Deactivated
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {agent.platform} • v{agent.agentVersion}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Last seen: {formatLastSeen(agent.lastHeartbeat)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <HardDrive className="h-3 w-3" />
                                                            ID: {agent.machineId.slice(0, 8)}...
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {agent.isActive ? (
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedAgent(agent)
                                                                setIsDeactivateOpen(true)
                                                            }}
                                                        >
                                                            <Power className="h-4 w-4 mr-2" />
                                                            Deactivate
                                                        </DropdownMenuItem>
                                                    ) : null}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => {
                                                            setSelectedAgent(agent)
                                                            setIsDeleteOpen(true)
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Remove
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Settings */}
                                        {agent.isActive && (
                                            <div className="mt-4 pt-4 border-t space-y-4">
                                                {/* Capture Quality */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-sm">
                                                            Capture Quality
                                                        </Label>
                                                        <span className="text-sm text-muted-foreground">
                                                            {agent.captureQuality}%
                                                        </span>
                                                    </div>
                                                    <Slider
                                                        value={[agent.captureQuality]}
                                                        min={30}
                                                        max={100}
                                                        step={10}
                                                        onValueCommit={(value) =>
                                                            handleUpdateQuality(agent.id, value[0])
                                                        }
                                                        disabled={updateAgent.isPending}
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Lower quality = smaller file sizes
                                                    </p>
                                                </div>

                                                {/* Multi-Monitor */}
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="text-sm">
                                                            Capture All Monitors
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Screenshot all connected displays
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={agent.captureAllMonitors}
                                                        onCheckedChange={(checked) =>
                                                            handleToggleMultiMonitor(agent.id, checked)
                                                        }
                                                        disabled={updateAgent.isPending}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Monitor className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                            <h3 className="mt-4 font-medium">No agents installed</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Install the desktop app to enable screen capture
                            </p>
                            <Button
                                className="mt-4"
                                onClick={() => setIsDownloadOpen(true)}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download Desktop App
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Deactivate Dialog */}
            <AlertDialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate Agent?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will stop screen capture on {selectedAgent?.machineName || "this device"}.
                            You can reactivate it by signing in again on that device.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeactivate}
                            disabled={deactivateAgent.isPending}
                        >
                            {deactivateAgent.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Deactivate"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">
                            Remove Agent?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove {selectedAgent?.machineName || "this device"}
                            from your account. You'll need to reinstall and sign in again to use it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                            disabled={deleteAgent.isPending}
                        >
                            {deleteAgent.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Remove"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Download Dialog */}
            <DownloadDialog
                open={isDownloadOpen}
                onOpenChange={setIsDownloadOpen}
                downloadInfo={downloadInfo}
            />
        </>
    )
}