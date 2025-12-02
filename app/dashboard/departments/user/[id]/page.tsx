"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { mockUsers, mockProjects, mockDepartments, mockSubProjects, mockTimeEntries } from "@/lib/mock-data"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Mail, Phone, Calendar, Crown, Building2, Clock, Target, Trophy, TrendingUp } from "lucide-react"

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const user = mockUsers.find((u) => u.id === id)

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">User not found</p>
      </div>
    )
  }

  const department = mockDepartments.find((d) => d.name === user.department)
  const userProjects = mockProjects.filter((p) => p.teamIds.includes(user.id) || p.leadId === user.id)
  const userSubProjects = mockSubProjects.filter((sp) => sp.assigneeId === user.id)
  const userTimeEntries = mockTimeEntries.filter((te) => te.userId === user.id)

  const roleColors = {
    company: "bg-chart-1 text-white",
    qc_admin: "bg-chart-3 text-white",
    user: "bg-chart-2 text-white",
  }

  const totalHours = userTimeEntries.reduce((acc, te) => acc + te.duration, 0) / 3600
  const completedTasks = userSubProjects.filter((sp) => sp.status === "done").length
  const totalTasks = userSubProjects.length

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Department
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="text-center">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="text-2xl">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="mt-4">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                  {user.isLead && <Crown className="h-5 w-5 text-chart-3" />}
                </div>
                <p className="text-muted-foreground">{user.position}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge className={roleColors[user.role]}>{user.role.replace("_", " ")}</Badge>
                  {department && (
                    <Badge variant="outline" style={{ borderColor: department.color, color: department.color }}>
                      {department.name}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">Joined {new Date(user.joinDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{department?.name || "No Department"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto text-chart-3" />
                <p className="text-2xl font-bold mt-2">{user.points?.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto text-chart-1" />
                <p className="text-2xl font-bold mt-2">
                  {completedTasks}/{totalTasks}
                </p>
                <p className="text-sm text-muted-foreground">Tasks Done</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto text-chart-2" />
                <p className="text-2xl font-bold mt-2">{totalHours.toFixed(1)}h</p>
                <p className="text-sm text-muted-foreground">Hours Logged</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-chart-4" />
                <p className="text-2xl font-bold mt-2">{userProjects.length}</p>
                <p className="text-sm text-muted-foreground">Projects</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="projects" className="w-full">
            <TabsList>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-4">
              {userProjects.map((project) => (
                <Card key={project.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.description.slice(0, 100)}...</p>
                      </div>
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
                    <Progress value={project.progress} className="mt-3 h-1.5" />
                    <p className="text-sm text-muted-foreground mt-2">{project.progress}% complete</p>
                  </CardContent>
                </Card>
              ))}
              {userProjects.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No projects assigned</p>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              {userSubProjects.map((task) => {
                const project = mockProjects.find((p) => p.id === task.projectId)
                return (
                  <Card key={task.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{task.name}</p>
                          <p className="text-sm text-muted-foreground">{project?.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              task.priority === "urgent"
                                ? "text-destructive border-destructive"
                                : task.priority === "high"
                                  ? "text-chart-3 border-chart-3"
                                  : "text-muted-foreground border-muted"
                            }
                          >
                            {task.priority}
                          </Badge>
                          <Badge
                            className={
                              task.status === "done"
                                ? "bg-chart-2"
                                : task.status === "in_progress"
                                  ? "bg-chart-1"
                                  : "bg-muted text-muted-foreground"
                            }
                          >
                            {task.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{task.points} pts</span>
                        <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {userSubProjects.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No tasks assigned</p>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              {userTimeEntries.map((entry) => {
                const project = mockProjects.find((p) => p.id === entry.projectId)
                return (
                  <Card key={entry.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{project?.name}</p>
                          <p className="text-sm text-muted-foreground">{entry.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">{(entry.duration / 3600).toFixed(1)}h</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(entry.startTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {entry.screenshots.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {entry.screenshots.map((ss, i) => (
                            <img
                              key={i}
                              src={ss || "/placeholder.svg"}
                              alt={`Screenshot ${i + 1}`}
                              className="w-16 h-12 rounded object-cover border"
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
              {userTimeEntries.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No activity recorded</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
