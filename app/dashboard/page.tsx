// src/app/dashboard/page.tsx
"use client"

import { useAuthStore } from "@/lib/stores"
import { useProjects, useLeaderboard, useDepartments, useApprovedSops, useUnreadNotificationsCount, useCompanyStats } from "@/lib/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FolderKanban, FileVideo, Bell, TrendingUp, Clock, CheckCircle2, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const { user, company, subscription } = useAuthStore()

  // Fetch data using hooks
  const { data: projects, isLoading: projectsLoading } = useProjects()
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard()
  const { data: departments, isLoading: departmentsLoading } = useDepartments()
  const { data: sops, isLoading: sopsLoading } = useApprovedSops()
  const { data: notificationsCount } = useUnreadNotificationsCount()
  const { data: companyStats, isLoading: statsLoading } = useCompanyStats()

  // Calculate stats
  const activeProjects = projects?.filter((p) => p.status === "IN_PROGRESS") || []
  const pendingSopsCount = 0 // Would need usePendingSops for admin
  const unreadCount = notificationsCount?.unreadCount || 0

  const stats = [
    {
      title: "Total Users",
      value: companyStats?.totalUsers || 0,
      icon: Users,
      change: `${companyStats?.activeUsers || 0} active`,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      loading: statsLoading,
    },
    {
      title: "Active Projects",
      value: activeProjects.length,
      icon: FolderKanban,
      change: `${projects?.length || 0} total`,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      loading: projectsLoading,
    },
    {
      title: "Total SOPs",
      value: companyStats?.totalSops || sops?.length || 0,
      icon: FileVideo,
      change: "approved",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      loading: sopsLoading || statsLoading,
    },
    {
      title: "Notifications",
      value: unreadCount,
      icon: Bell,
      change: "unread",
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      loading: false,
    },
  ]

  const recentProjects = projects?.slice(0, 3) || []
  const topPerformers = leaderboard?.slice(0, 5) || []

  // Calculate days remaining for trial
  const daysRemaining = subscription?.daysRemaining || 0
  const isTrial = subscription?.status === "TRIAL"

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.firstName || "User"}
          </h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your team today.</p>
        </div>
        {isTrial && daysRemaining > 0 && (
          <Badge variant="outline" className="text-chart-3 border-chart-3 py-1.5 px-3">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Trial ends in {daysRemaining} days
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                {stat.loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                )}
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Projects and Leaderboard */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>Track progress on ongoing projects</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/projects">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectsLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <div key={project.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{project.name}</p>
                      <Badge
                        variant="outline"
                        className={
                          project.status === "IN_PROGRESS"
                            ? "text-chart-1 border-chart-1"
                            : project.status === "COMPLETED"
                              ? "text-chart-2 border-chart-2"
                              : "text-chart-3 border-chart-3"
                        }
                      >
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {project.endDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(project.endDate).toLocaleDateString()}
                        </div>
                      )}
                      {project.projectLead && (
                        <div className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={project.projectLead.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-[10px]">
                              {project.projectLead.firstName?.slice(0, 1)}
                              {project.projectLead.lastName?.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {project.projectLead.firstName} {project.projectLead.lastName}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={50} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">
                        {project._count?.subProjects || 0} tasks
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No projects yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Leaderboard based on points earned</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/leaderboard">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaderboardLoading ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : topPerformers.length > 0 ? (
              topPerformers.map((performer, index) => (
                <div key={performer.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0
                      ? "bg-chart-3 text-white"
                      : index === 1
                        ? "bg-muted-foreground/30 text-foreground"
                        : index === 2
                          ? "bg-chart-3/50 text-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {index + 1}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={performer.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {performer.firstName?.slice(0, 1)}
                      {performer.lastName?.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {performer.firstName} {performer.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {performer.department?.name || "No department"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{performer.points?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Departments */}
        <Card>
          <CardHeader>
            <CardTitle>Departments</CardTitle>
            <CardDescription>Overview of team structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {departmentsLoading ? (
              <>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </>
            ) : departments && departments.length > 0 ? (
              departments.slice(0, 4).map((dept, index) => (
                <div key={dept.id} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'][index % 4],
                    }}
                  />
                  <span className="text-sm text-foreground flex-1">{dept.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {dept._count?.users || dept.users?.length || 0} members
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No departments yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent SOPs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent SOPs</CardTitle>
            <CardDescription>Latest documentation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sopsLoading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : sops && sops.length > 0 ? (
              sops.slice(0, 4).map((sop) => (
                <div key={sop.id} className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded ${sop.status === "APPROVED"
                      ? "bg-chart-2/10"
                      : sop.status === "PENDING_APPROVAL"
                        ? "bg-chart-3/10"
                        : "bg-destructive/10"
                      }`}
                  >
                    {sop.status === "APPROVED" ? (
                      <CheckCircle2 className="h-4 w-4 text-chart-2" />
                    ) : (
                      <Clock className="h-4 w-4 text-chart-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{sop.title}</p>
                    <p className="text-xs text-muted-foreground">{sop.type}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No SOPs yet</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <Link href="/dashboard/projects/new">
                <FolderKanban className="h-4 w-4 mr-2" />
                Create New Project
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <Link href="/dashboard/sops/new">
                <FileVideo className="h-4 w-4 mr-2" />
                Upload SOP
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <Link href="/dashboard/departments">
                <Users className="h-4 w-4 mr-2" />
                Manage Team
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}