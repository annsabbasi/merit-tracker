"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockProjects, mockUsers, mockDepartments, mockSOPs, mockNotifications } from "@/lib/mock-data"
import { Users, FolderKanban, FileVideo, Bell, TrendingUp, Clock, CheckCircle2, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { user, company } = useAuth()

  const stats = [
    {
      title: "Total Users",
      value: mockUsers.length,
      icon: Users,
      change: "+12%",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Active Projects",
      value: mockProjects.filter((p) => p.status === "in_progress").length,
      icon: FolderKanban,
      change: "+3",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Pending SOPs",
      value: mockSOPs.filter((s) => s.status === "pending").length,
      icon: FileVideo,
      change: "2 new",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Notifications",
      value: mockNotifications.filter((n) => !n.read).length,
      icon: Bell,
      change: "unread",
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ]

  const recentProjects = mockProjects.slice(0, 3)
  const topPerformers = [...mockUsers].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="text-muted-foreground">Here's what's happening with your team today.</p>
        </div>
        {company?.plan === "trial" && (
          <Badge variant="outline" className="text-chart-3 border-chart-3 py-1.5 px-3">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Trial ends in {Math.ceil((new Date(company.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}{" "}
            days
          </Badge>
        )}
      </div>

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
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
            {recentProjects.map((project) => {
              const lead = mockUsers.find((u) => u.id === project.leadId)
              return (
                <div key={project.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{project.name}</p>
                      <Badge
                        variant="outline"
                        className={
                          project.status === "in_progress"
                            ? "text-chart-1 border-chart-1"
                            : project.status === "completed"
                              ? "text-chart-2 border-chart-2"
                              : "text-chart-3 border-chart-3"
                        }
                      >
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(project.endDate).toLocaleDateString()}
                      </div>
                      {lead && (
                        <div className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={lead.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-[10px]">{lead.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">{lead.name}</span>
                        </div>
                      )}
                    </div>
                    <Progress value={project.progress} className="mt-2 h-1.5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{project.progress}%</span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Leaderboard based on points earned</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/departments">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPerformers.map((performer, index) => (
              <div key={performer.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0
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
                  <AvatarFallback>{performer.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{performer.name}</p>
                  <p className="text-xs text-muted-foreground">{performer.department}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{performer.points?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Departments</CardTitle>
            <CardDescription>Overview of team structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockDepartments.slice(0, 4).map((dept) => (
              <div key={dept.id} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                <span className="text-sm text-foreground flex-1">{dept.name}</span>
                <span className="text-sm text-muted-foreground">{dept.memberCount} members</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent SOPs</CardTitle>
            <CardDescription>Latest documentation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockSOPs.slice(0, 4).map((sop) => (
              <div key={sop.id} className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded ${
                    sop.status === "approved"
                      ? "bg-chart-2/10"
                      : sop.status === "pending"
                        ? "bg-chart-3/10"
                        : "bg-destructive/10"
                  }`}
                >
                  {sop.status === "approved" ? (
                    <CheckCircle2 className="h-4 w-4 text-chart-2" />
                  ) : (
                    <Clock className="h-4 w-4 text-chart-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{sop.title}</p>
                  <p className="text-xs text-muted-foreground">{sop.category}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <Link href="/dashboard/projects">
                <FolderKanban className="h-4 w-4 mr-2" />
                Create New Project
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <Link href="/dashboard/sops">
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
