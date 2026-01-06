// app/dashboard/settings/screen-capture/page.tsx
"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
    useMyAgents,
    useCompanyAgents,
    useAgentDownloadInfo,
    useSimulateAgent
} from "@/lib/hooks/use-desktop-agent"
import { useMyScreenshotSummary } from "@/lib/hooks/use-screenshots"
import { AgentSettings } from "@/components/screen-capture/agent-settings"
import { AgentInstallBanner, DownloadDialog } from "@/components/screen-capture/agent-install-banner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Monitor,
    Camera,
    Download,
    Clock,
    Image as ImageIcon,
    Laptop,
    Apple,
    CheckCircle2,
    WifiOff,
    AlertTriangle,
    Users,
    BarChart3,
    Bug,
    Loader2,
    Terminal,
} from "lucide-react"
import { toast } from "sonner"
import type { Platform } from "@/lib/types/screen-capture"

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development'

export default function ScreenCaptureSettingsPage() {
    const { user } = useAuthStore()
    const [isDownloadOpen, setIsDownloadOpen] = useState(false)
    const [isSimulateOpen, setIsSimulateOpen] = useState(false)
    const [selectedPlatform, setSelectedPlatform] = useState<Platform>('WINDOWS')

    const { data: myAgents, isLoading: agentsLoading } = useMyAgents()
    const { data: companyAgents, isLoading: companyAgentsLoading } = useCompanyAgents()
    const { data: mySummary, isLoading: summaryLoading } = useMyScreenshotSummary()
    const { data: downloadInfo } = useAgentDownloadInfo()
    const { simulateAgent, isPending: isSimulating } = useSimulateAgent()

    const isAdmin = user?.role === "COMPANY" || user?.role === "QC_ADMIN"

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

    const handleSimulateAgent = async () => {
        try {
            const result = await simulateAgent(selectedPlatform)
            toast.success(`Agent simulated successfully! Token starts with: ${result.token?.substring(0, 15)}...`)
            setIsSimulateOpen(false)
        } catch (error: any) {
            toast.error(error?.message || 'Failed to simulate agent')
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Screen Capture Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your desktop agents and view capture statistics
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Development Only: Simulate Agent Button */}
                    {isDevelopment && (
                        <Dialog open={isSimulateOpen} onOpenChange={setIsSimulateOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-yellow-500 text-yellow-600 hover:bg-yellow-50">
                                    <Bug className="h-4 w-4 mr-2" />
                                    Simulate Agent
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Terminal className="h-5 w-5" />
                                        Simulate Desktop Agent
                                    </DialogTitle>
                                    <DialogDescription>
                                        This is a development tool to test the screen capture flow without installing the actual desktop application.
                                    </DialogDescription>
                                </DialogHeader>

                                <Alert className="bg-yellow-50 border-yellow-200">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    <AlertTitle className="text-yellow-800">Development Only</AlertTitle>
                                    <AlertDescription className="text-yellow-700">
                                        This feature is only available in development mode and will not appear in production.
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Select Platform</label>
                                        <Select
                                            value={selectedPlatform}
                                            onValueChange={(v) => setSelectedPlatform(v as Platform)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="WINDOWS">
                                                    <div className="flex items-center gap-2">
                                                        <Laptop className="h-4 w-4" />
                                                        Windows
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="MAC">
                                                    <div className="flex items-center gap-2">
                                                        <Apple className="h-4 w-4" />
                                                        macOS
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="LINUX">
                                                    <div className="flex items-center gap-2">
                                                        <Monitor className="h-4 w-4" />
                                                        Linux
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                                        <p className="font-medium">What this does:</p>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                            <li>Registers a simulated agent for your user</li>
                                            <li>Agent will appear as "Online" initially</li>
                                            <li>Will go "Offline" after 5 minutes (no heartbeat)</li>
                                            <li>You can test time tracking with screen capture enabled</li>
                                        </ul>
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={handleSimulateAgent}
                                        disabled={isSimulating}
                                    >
                                        {isSimulating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Simulating...
                                            </>
                                        ) : (
                                            <>
                                                <Bug className="h-4 w-4 mr-2" />
                                                Create Simulated Agent
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}

                    <Button onClick={() => setIsDownloadOpen(true)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download App
                    </Button>
                </div>
            </div>

            {/* Development Mode Banner */}
            {isDevelopment && (
                <Alert className="bg-yellow-50 border-yellow-200">
                    <Bug className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">Development Mode</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                        You're running in development mode. Use the "Simulate Agent" button to test the screen capture flow without installing the desktop app.
                    </AlertDescription>
                </Alert>
            )}

            {/* Installation Banner */}
            <AgentInstallBanner showWhenInstalled />

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Monitor className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                {agentsLoading ? (
                                    <Skeleton className="h-7 w-8" />
                                ) : (
                                    <p className="text-2xl font-bold">
                                        {myAgents?.length || 0}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">My Agents</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                {agentsLoading ? (
                                    <Skeleton className="h-7 w-8" />
                                ) : (
                                    <p className="text-2xl font-bold">
                                        {myAgents?.filter(a => a.isOnline).length || 0}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">Online</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <ImageIcon className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                {summaryLoading ? (
                                    <Skeleton className="h-7 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold">
                                        {mySummary?.total || 0}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">Screenshots</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-500/10">
                                <Clock className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                                {summaryLoading ? (
                                    <Skeleton className="h-7 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold">
                                        {Math.round((mySummary?.deleted?.totalMinutesDeducted || 0) / 60)}h
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">Captured</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="my-agents" className="w-full">
                <TabsList>
                    <TabsTrigger value="my-agents">My Agents</TabsTrigger>
                    {isAdmin && <TabsTrigger value="company-agents">Company Agents</TabsTrigger>}
                    <TabsTrigger value="statistics">Statistics</TabsTrigger>
                </TabsList>

                {/* My Agents Tab */}
                <TabsContent value="my-agents">
                    <AgentSettings />
                </TabsContent>

                {/* Company Agents Tab (Admin Only) */}
                {isAdmin && (
                    <TabsContent value="company-agents">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Company Agents
                                </CardTitle>
                                <CardDescription>
                                    All desktop agents installed across your company
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {companyAgentsLoading ? (
                                    <div className="space-y-4">
                                        {[...Array(3)].map((_, i) => (
                                            <Skeleton key={i} className="h-20" />
                                        ))}
                                    </div>
                                ) : companyAgents && companyAgents.length > 0 ? (
                                    <div className="space-y-4">
                                        {companyAgents.map((agent) => {
                                            const PlatformIcon = platformIcons[agent.platform] || Monitor
                                            return (
                                                <div
                                                    key={agent.id}
                                                    className="flex items-center justify-between p-4 rounded-lg border"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 rounded-lg bg-muted">
                                                            <PlatformIcon className="h-5 w-5" />
                                                        </div>
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={agent.user?.avatar || ""} />
                                                            <AvatarFallback>
                                                                {agent.user?.firstName?.[0]}
                                                                {agent.user?.lastName?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">
                                                                {agent.user?.firstName} {agent.user?.lastName}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {agent.machineName || "Unknown Device"} • {agent.platform}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right text-sm">
                                                            <p className="text-muted-foreground">
                                                                Last seen
                                                            </p>
                                                            <p className="font-medium">
                                                                {formatLastSeen(agent.lastHeartbeat)}
                                                            </p>
                                                        </div>
                                                        {agent.isOnline ? (
                                                            <Badge className="bg-green-500">
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
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Monitor className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                                        <p className="mt-4 text-muted-foreground">
                                            No agents installed in your company yet
                                        </p>
                                        {isDevelopment && (
                                            <Button
                                                variant="outline"
                                                className="mt-4"
                                                onClick={() => setIsSimulateOpen(true)}
                                            >
                                                <Bug className="h-4 w-4 mr-2" />
                                                Simulate First Agent
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* Statistics Tab */}
                <TabsContent value="statistics">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Capture Statistics
                            </CardTitle>
                            <CardDescription>
                                Your screen capture activity summary
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {summaryLoading ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    {[...Array(4)].map((_, i) => (
                                        <Skeleton key={i} className="h-24" />
                                    ))}
                                </div>
                            ) : mySummary ? (
                                <div className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                                            <p className="text-3xl font-bold">
                                                {mySummary.total || 0}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Total Screenshots
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                                            <p className="text-3xl font-bold">
                                                {mySummary.byStatus?.length || 0}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Status Types
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                                            <p className="text-3xl font-bold">
                                                {mySummary.deleted?.count || 0}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Deleted
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                                            <p className="text-3xl font-bold">
                                                {mySummary.deleted?.totalMinutesDeducted || 0}m
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Time Deducted
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 rounded-lg p-4">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                            About Screen Capture
                                        </h4>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            <li>• Screenshots are captured at random intervals (2-5 minutes)</li>
                                            <li>• Screenshots are stored for 60 days, then automatically deleted</li>
                                            <li>• Deleting screenshots will deduct the corresponding time from your session</li>
                                            <li>• Only projects with screen capture enabled will require the desktop agent</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Camera className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                                    <p className="mt-4 text-muted-foreground">
                                        No capture statistics available yet
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Start tracking time on projects with screen capture enabled to see statistics.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Download Dialog */}
            <DownloadDialog
                open={isDownloadOpen}
                onOpenChange={setIsDownloadOpen}
                downloadInfo={downloadInfo}
            />
        </div>
    )
}