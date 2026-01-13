// app/dashboard/screen-monitoring/page.tsx
"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useUsers } from "@/lib/hooks/use-users"
import { useProjects } from "@/lib/hooks/use-projects"
import { useScreenshots, useUserScreenshotSummary } from "@/lib/hooks/use-screenshots"
import { useCompanyAgents } from "@/lib/hooks/use-desktop-agent"
import { ScreenshotTimeline } from "@/components/screen-capture/screenshot-timeline"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    Camera,
    Monitor,
    Users,
    Search,
    CheckCircle2,
    WifiOff,
    Clock,
    Image as ImageIcon,
    BarChart3,
    ShieldAlert,
    FolderKanban,
    Eye,
    Activity,
} from "lucide-react"
import { format, subDays } from "date-fns"
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

export default function ScreenMonitoringPage() {
    const { user } = useAuthStore()
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>()
    const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>()
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState("overview")

    const isAdmin = user?.role === "COMPANY" || user?.role === "QC_ADMIN"

    const { data: users, isLoading: usersLoading } = useUsers()
    const { data: projects, isLoading: projectsLoading } = useProjects()
    const { data: companyAgents, isLoading: agentsLoading } = useCompanyAgents()
    const { data: userSummary } = useUserScreenshotSummary(selectedUserId || "")

    // Get recent screenshots across company
    const { data: recentScreenshotsData, isLoading: screenshotsLoading } = useScreenshots({
        userId: selectedUserId,
        projectId: selectedProjectId,
        startDate: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss"),
        endDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    })

    // Normalize screenshots data
    const recentScreenshots = useMemo(() => normalizeScreenshots(recentScreenshotsData), [recentScreenshotsData])

    // Filter users based on search
    const filteredUsers = users?.filter((u) =>
        searchQuery
            ? `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
            : true
    )

    // Count online agents
    const onlineAgents = companyAgents?.filter((a) => a.isOnline).length || 0
    const totalAgents = companyAgents?.length || 0

    // Get users with their agent status
    const usersWithAgentStatus = filteredUsers?.map((u) => {
        const userAgents = companyAgents?.filter((a) => a.userId === u.id) || []
        const hasOnlineAgent = userAgents.some((a) => a.isOnline)
        return {
            ...u,
            agents: userAgents,
            hasOnlineAgent,
            agentCount: userAgents.length,
        }
    })

    if (!isAdmin) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        Screen monitoring is only available to administrators and QC admins.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Screen Monitoring</h1>
                    <p className="text-muted-foreground">
                        Monitor team activity and view captured screenshots
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={onlineAgents > 0 ? "border-green-500 text-green-600" : ""}>
                        <Activity className="h-3 w-3 mr-1" />
                        {onlineAgents} / {totalAgents} agents online
                    </Badge>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Users className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                {usersLoading ? (
                                    <Skeleton className="h-7 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold">{users?.length || 0}</p>
                                )}
                                <p className="text-sm text-muted-foreground">Team Members</p>
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
                                    <Skeleton className="h-7 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold">{onlineAgents}</p>
                                )}
                                <p className="text-sm text-muted-foreground">Online Now</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <Camera className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                {screenshotsLoading ? (
                                    <Skeleton className="h-7 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold">{recentScreenshots?.length || 0}</p>
                                )}
                                <p className="text-sm text-muted-foreground">Screenshots (24h)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                                <FolderKanban className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                {projectsLoading ? (
                                    <Skeleton className="h-7 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold">
                                        {projects?.filter((p) => p.screenCaptureEnabled).length || 0}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">Projects w/ Capture</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="team">Team Activity</TabsTrigger>
                    <TabsTrigger value="screenshots">All Screenshots</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Filters */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="relative flex-1 max-w-xs">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <Select
                                    value={selectedProjectId || "all"}
                                    onValueChange={(v) => setSelectedProjectId(v === "all" ? undefined : v)}
                                >
                                    <SelectTrigger className="w-48">
                                        <FolderKanban className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="All Projects" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Projects</SelectItem>
                                        {projects
                                            ?.filter((p) => p.screenCaptureEnabled)
                                            .map((project) => (
                                                <SelectItem key={project.id} value={project.id}>
                                                    {project.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Team Members Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {usersLoading ? (
                            [...Array(6)].map((_, i) => (
                                <Card key={i}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                            <div className="flex-1">
                                                <Skeleton className="h-5 w-32" />
                                                <Skeleton className="h-4 w-24 mt-1" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : usersWithAgentStatus && usersWithAgentStatus.length > 0 ? (
                            usersWithAgentStatus.map((u) => (
                                <Card
                                    key={u.id}
                                    className={`cursor-pointer transition-all hover:border-primary ${selectedUserId === u.id ? "ring-2 ring-primary" : ""
                                        }`}
                                    onClick={() => setSelectedUserId(selectedUserId === u.id ? undefined : u.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage src={u.avatar || ""} />
                                                        <AvatarFallback>
                                                            {u.firstName?.[0]}
                                                            {u.lastName?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {u.hasOnlineAgent && (
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {u.firstName} {u.lastName}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">{u.email}</p>
                                                </div>
                                            </div>
                                            {u.hasOnlineAgent ? (
                                                <Badge className="bg-green-500">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Online
                                                </Badge>
                                            ) : u.agentCount > 0 ? (
                                                <Badge variant="secondary">
                                                    <WifiOff className="h-3 w-3 mr-1" />
                                                    Offline
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">No Agent</Badge>
                                            )}
                                        </div>

                                        <div className="mt-4 flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Monitor className="h-4 w-4" />
                                                <span>{u.agentCount} agent(s)</span>
                                            </div>
                                            <Badge variant="outline">{u.role?.replace("_", " ")}</Badge>
                                        </div>

                                        {/* Show recent screenshot thumbnail if available */}
                                        {selectedUserId === u.id && recentScreenshots && recentScreenshots.length > 0 && (
                                            <div className="mt-4 pt-4 border-t">
                                                <p className="text-sm text-muted-foreground mb-2">Latest Screenshot</p>
                                                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                                    {recentScreenshots[0].fileUrl ? (
                                                        <Image
                                                            src={recentScreenshots[0].fileUrl}
                                                            alt="Latest screenshot"
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <Badge className="absolute bottom-2 left-2 bg-black/60">
                                                        {format(new Date(recentScreenshots[0].capturedAt), "HH:mm")}
                                                    </Badge>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                                <p className="mt-4 text-muted-foreground">No team members found</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Team Activity Tab */}
                <TabsContent value="team" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Live Activity
                            </CardTitle>
                            <CardDescription>
                                See who is currently tracking time with screen capture
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {agentsLoading ? (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <Skeleton key={i} className="h-20" />
                                    ))}
                                </div>
                            ) : companyAgents && companyAgents.filter((a) => a.isOnline).length > 0 ? (
                                <div className="space-y-4">
                                    {companyAgents
                                        .filter((a) => a.isOnline)
                                        .map((agent) => (
                                            <div
                                                key={agent.id}
                                                className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={agent.user?.avatar || ""} />
                                                            <AvatarFallback>
                                                                {agent.user?.firstName?.[0]}
                                                                {agent.user?.lastName?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {agent.user?.firstName} {agent.user?.lastName}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {agent.machineName || agent.machineId} • {agent.platform}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-sm text-muted-foreground">Last heartbeat</p>
                                                        <p className="text-sm font-medium">
                                                            {agent.lastHeartbeat
                                                                ? format(new Date(agent.lastHeartbeat), "HH:mm:ss")
                                                                : "N/A"}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedUserId(agent.userId)
                                                            setActiveTab("screenshots")
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <WifiOff className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                                    <p className="mt-4 text-muted-foreground">No agents currently online</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Team members need to have the desktop app running
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Offline Agents */}
                    {companyAgents && companyAgents.filter((a) => !a.isOnline).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                                    <WifiOff className="h-5 w-5" />
                                    Offline Agents
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {companyAgents
                                        .filter((a) => !a.isOnline)
                                        .map((agent) => (
                                            <div
                                                key={agent.id}
                                                className="flex items-center gap-3 p-3 rounded-lg border"
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={agent.user?.avatar || ""} />
                                                    <AvatarFallback>
                                                        {agent.user?.firstName?.[0]}
                                                        {agent.user?.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {agent.user?.firstName} {agent.user?.lastName}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Last seen:{" "}
                                                        {agent.lastHeartbeat
                                                            ? format(new Date(agent.lastHeartbeat), "MMM d, HH:mm")
                                                            : "Never"}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* All Screenshots Tab */}
                <TabsContent value="screenshots">
                    {/* User Filter */}
                    <Card className="mb-4">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <Select
                                    value={selectedUserId || "all"}
                                    onValueChange={(v) => setSelectedUserId(v === "all" ? undefined : v)}
                                >
                                    <SelectTrigger className="w-64">
                                        <Users className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="All Users" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Users</SelectItem>
                                        {users?.map((u) => (
                                            <SelectItem key={u.id} value={u.id}>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarFallback className="text-xs">
                                                            {u.firstName?.[0]}
                                                            {u.lastName?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {u.firstName} {u.lastName}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={selectedProjectId || "all"}
                                    onValueChange={(v) => setSelectedProjectId(v === "all" ? undefined : v)}
                                >
                                    <SelectTrigger className="w-48">
                                        <FolderKanban className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="All Projects" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Projects</SelectItem>
                                        {projects
                                            ?.filter((p) => p.screenCaptureEnabled)
                                            .map((project) => (
                                                <SelectItem key={project.id} value={project.id}>
                                                    {project.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>

                                {selectedUserId && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedUserId(undefined)
                                            setSelectedProjectId(undefined)
                                        }}
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Screenshot Timeline */}
                    <ScreenshotTimeline
                        userId={selectedUserId}
                        projectId={selectedProjectId}
                        canDelete={user?.role === "COMPANY"}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}