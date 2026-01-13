// src/components/screen-capture/agent-settings.tsx
"use client"

import { useState } from "react"
import {
    useMyAgents,
    useUpdateAgent,
    useDeactivateAgent,
    useDeleteAgent,
} from "@/lib/hooks/use-desktop-agent"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
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
    Settings,
    Trash2,
    Power,
    PowerOff,
    MoreVertical,
    CheckCircle2,
    WifiOff,
    Loader2,
    Image as ImageIcon,
    MonitorSmartphone,
} from "lucide-react"
import { toast } from "sonner"
import { format, formatDistanceToNow } from "date-fns"
import type { DesktopAgent, Platform } from "@/lib/types/screen-capture"

interface AgentSettingsProps {
    className?: string
}

export function AgentSettings({ className }: AgentSettingsProps) {
    const [selectedAgent, setSelectedAgent] = useState<DesktopAgent | null>(null)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    const { data: agents, isLoading } = useMyAgents()
    const updateAgent = useUpdateAgent()
    const deactivateAgent = useDeactivateAgent()
    const deleteAgent = useDeleteAgent()

    const platformIcons: Record<Platform, any> = {
        WINDOWS: Laptop,
        MAC: Apple,
        LINUX: Monitor,
    }

    const handleUpdateSettings = async (quality: number, captureAllMonitors: boolean) => {
        if (!selectedAgent) return

        try {
            await updateAgent.mutateAsync({
                id: selectedAgent.id,
                data: {
                    captureQuality: quality,
                    captureAllMonitors,
                },
            })
            toast.success("Agent settings updated")
            setIsSettingsOpen(false)
        } catch (error) {
            toast.error("Failed to update settings")
        }
    }

    const handleDeactivate = async (agent: DesktopAgent) => {
        try {
            await deactivateAgent.mutateAsync(agent.id)
            toast.success("Agent deactivated")
        } catch (error) {
            toast.error("Failed to deactivate agent")
        }
    }

    const handleDelete = async () => {
        if (!selectedAgent) return

        try {
            await deleteAgent.mutateAsync(selectedAgent.id)
            toast.success("Agent deleted")
            setIsDeleteOpen(false)
            setSelectedAgent(null)
        } catch (error) {
            toast.error("Failed to delete agent")
        }
    }

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MonitorSmartphone className="h-5 w-5" />
                        My Desktop Agents
                    </CardTitle>
                    <CardDescription>
                        Manage your registered desktop agents for screen capture
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {agents && agents.length > 0 ? (
                        <div className="space-y-4">
                            {agents.map((agent) => {
                                const PlatformIcon = platformIcons[agent.platform] || Monitor
                                const isOnline = agent.isOnline

                                return (
                                    <div
                                        key={agent.id}
                                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${isOnline
                                                ? "border-green-200 bg-green-50/50"
                                                : "border-gray-200"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`p-3 rounded-lg ${isOnline ? "bg-green-100" : "bg-muted"
                                                    }`}
                                            >
                                                <PlatformIcon
                                                    className={`h-6 w-6 ${isOnline ? "text-green-600" : "text-muted-foreground"
                                                        }`}
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">
                                                        {agent.machineName || "Unknown Device"}
                                                    </p>
                                                    {isOnline ? (
                                                        <Badge className="bg-green-500 text-white">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Online
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            <WifiOff className="h-3 w-3 mr-1" />
                                                            Offline
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                                    <span>{agent.platform}</span>
                                                    <span>•</span>
                                                    <span>v{agent.agentVersion}</span>
                                                    <span>•</span>
                                                    <span>
                                                        {agent.lastHeartbeat
                                                            ? `Last seen ${formatDistanceToNow(
                                                                new Date(agent.lastHeartbeat),
                                                                { addSuffix: true }
                                                            )}`
                                                            : "Never connected"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedAgent(agent)
                                                    setIsSettingsOpen(true)
                                                }}
                                            >
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedAgent(agent)
                                                            setIsSettingsOpen(true)
                                                        }}
                                                    >
                                                        <Settings className="h-4 w-4 mr-2" />
                                                        Settings
                                                    </DropdownMenuItem>
                                                    {agent.isActive && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeactivate(agent)}
                                                        >
                                                            <PowerOff className="h-4 w-4 mr-2" />
                                                            Deactivate
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => {
                                                            setSelectedAgent(agent)
                                                            setIsDeleteOpen(true)
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Monitor className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                            <p className="mt-4 text-muted-foreground">
                                No desktop agents registered yet
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Download and install the Merit Tracker desktop app to get started
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Settings Dialog */}
            <AgentSettingsDialog
                agent={selectedAgent}
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                onSave={handleUpdateSettings}
                isPending={updateAgent.isPending}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Desktop Agent?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the agent "{selectedAgent?.machineName}" from your account.
                            You'll need to re-register if you want to use it again.
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
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Agent
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

interface AgentSettingsDialogProps {
    agent: DesktopAgent | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (quality: number, captureAllMonitors: boolean) => void
    isPending: boolean
}

function AgentSettingsDialog({
    agent,
    open,
    onOpenChange,
    onSave,
    isPending,
}: AgentSettingsDialogProps) {
    const [quality, setQuality] = useState(agent?.captureQuality || 80)
    const [captureAllMonitors, setCaptureAllMonitors] = useState(
        agent?.captureAllMonitors ?? false
    )

    // Update state when agent changes
    useState(() => {
        if (agent) {
            setQuality(agent.captureQuality || 80)
            setCaptureAllMonitors(agent.captureAllMonitors ?? false)
        }
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Agent Settings
                    </DialogTitle>
                    <DialogDescription>
                        Configure capture settings for {agent?.machineName || "this agent"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Screenshot Quality */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Screenshot Quality</Label>
                                <p className="text-sm text-muted-foreground">
                                    Higher quality = larger file sizes
                                </p>
                            </div>
                            <span className="text-lg font-semibold">{quality}%</span>
                        </div>
                        <Slider
                            value={[quality]}
                            onValueChange={([v]) => setQuality(v)}
                            min={30}
                            max={100}
                            step={5}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Low (30%)</span>
                            <span>Medium (60%)</span>
                            <span>High (100%)</span>
                        </div>
                    </div>

                    {/* Multi-Monitor Capture */}
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <Label>Capture All Monitors</Label>
                                <p className="text-sm text-muted-foreground">
                                    Capture screenshots from all connected displays
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={captureAllMonitors}
                            onCheckedChange={setCaptureAllMonitors}
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-2">About Screen Capture</p>
                        <ul className="space-y-1">
                            <li>• Screenshots are captured at random intervals (2-5 min)</li>
                            <li>• Captures only occur during active time tracking</li>
                            <li>• Screenshots are stored securely for 60 days</li>
                            <li>• Changes take effect on the next capture</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onSave(quality, captureAllMonitors)}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}