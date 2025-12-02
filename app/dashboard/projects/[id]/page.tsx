"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { mockProjects, mockUsers, mockSubProjects, mockChatRooms, mockTimeEntries } from "@/lib/mock-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Play,
  Pause,
  Plus,
  Calendar,
  DollarSign,
  Trophy,
  MessageSquare,
  Send,
  AlertTriangle,
  Camera,
  Crown,
  UserMinus,
  UserPlus,
} from "lucide-react"

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user: currentUser, hasPermission } = useAuth()
  const [isTracking, setIsTracking] = useState(false)
  const [trackingTime, setTrackingTime] = useState(0)
  const [chatMessage, setChatMessage] = useState("")
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)

  const project = mockProjects.find((p) => p.id === id)

  if (!project) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    )
  }

  const lead = mockUsers.find((u) => u.id === project.leadId)
  const teamMembers = mockUsers.filter((u) => project.teamIds.includes(u.id) || u.id === project.leadId)
  const projectSubProjects = mockSubProjects.filter((sp) => sp.projectId === project.id)
  const chatRoom = mockChatRooms.find((r) => r.projectId === project.id)
  const projectTimeEntries = mockTimeEntries.filter((te) => te.projectId === project.id)

  const leaderboard = teamMembers
    .map((member) => {
      const memberTasks = projectSubProjects.filter((sp) => sp.assigneeId === member.id && sp.status === "done")
      const points = memberTasks.reduce((acc, task) => acc + task.points, 0)
      return { ...member, projectPoints: points }
    })
    .sort((a, b) => b.projectPoints - a.projectPoints)

  const statusColors = {
    planning: "text-chart-3 border-chart-3",
    in_progress: "text-chart-1 border-chart-1",
    review: "text-chart-4 border-chart-4",
    completed: "text-chart-2 border-chart-2",
  }

  const taskStatusColors = {
    todo: "bg-muted text-muted-foreground",
    in_progress: "bg-chart-1",
    review: "bg-chart-4",
    done: "bg-chart-2",
  }

  const priorityColors = {
    low: "text-muted-foreground border-muted",
    medium: "text-chart-1 border-chart-1",
    high: "text-chart-3 border-chart-3",
    urgent: "text-destructive border-destructive",
  }

  const startTracking = () => {
    setIsTracking(true)
    const interval = setInterval(() => {
      setTrackingTime((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }

  const stopTracking = () => {
    setIsTracking(false)
    setTrackingTime(0)
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>

      <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <Badge variant="outline" className={statusColors[project.status]}>
              {project.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 max-w-2xl">{project.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Due {new Date(project.endDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>${project.budget.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{project.progress}%</p>
            <p className="text-sm text-muted-foreground">Progress</p>
            <Progress value={project.progress} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{projectSubProjects.length}</p>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{teamMembers.length}</p>
            <p className="text-sm text-muted-foreground">Team Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {(projectTimeEntries.reduce((acc, te) => acc + te.duration, 0) / 3600).toFixed(1)}h
            </p>
            <p className="text-sm text-muted-foreground">Hours Logged</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="tracker">Time Tracker</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="chat">Chat Room</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Sub-Projects / Tasks</h3>
            {hasPermission(["company", "qc_admin"]) && (
              <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>Add a sub-project or task to this project</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Task Name</Label>
                      <Input placeholder="e.g., Design Homepage" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea placeholder="Task description..." rows={2} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Assignee</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamMembers.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Points</Label>
                        <Input type="number" placeholder="100" />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input type="date" />
                      </div>
                    </div>
                    <Button className="w-full">Create Task</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {projectSubProjects.map((task) => {
              const assignee = mockUsers.find((u) => u.id === task.assigneeId)
              return (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">{task.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      </div>
                      <Badge className={taskStatusColors[task.status]}>{task.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        {assignee && (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={assignee.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">{assignee.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{assignee.name}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Badge variant="outline" className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                        <span className="text-muted-foreground">{task.points} pts</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="tracker" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Screen Monitoring Active</AlertTitle>
            <AlertDescription>
              While tracking time, your screen is being monitored and random screenshots may be captured for quality
              assurance purposes.
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-6xl font-mono font-bold text-foreground mb-4">{formatTime(trackingTime)}</div>
              <div className="flex items-center justify-center gap-4">
                {!isTracking ? (
                  <Button size="lg" onClick={startTracking} className="gap-2">
                    <Play className="h-5 w-5" />
                    Start Tracking
                  </Button>
                ) : (
                  <Button size="lg" variant="destructive" onClick={stopTracking} className="gap-2">
                    <Pause className="h-5 w-5" />
                    Stop Tracking
                  </Button>
                )}
              </div>
              {isTracking && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Camera className="h-4 w-4" />
                  <span>Screenshots are being captured periodically</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Time Entries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectTimeEntries.map((entry) => {
                const entryUser = mockUsers.find((u) => u.id === entry.userId)
                return (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entryUser?.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{entryUser?.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{entryUser?.name}</p>
                        <p className="text-sm text-muted-foreground">{entry.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{(entry.duration / 3600).toFixed(1)}h</p>
                      <p className="text-sm text-muted-foreground">{new Date(entry.startTime).toLocaleDateString()}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-chart-3" />
                Project Leaderboard
              </CardTitle>
              <CardDescription>Points earned from completed tasks in this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard.map((member, index) => (
                <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
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
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">{member.projectPoints}</p>
                    <p className="text-sm text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Project Team</h3>
            {hasPermission(["company", "qc_admin"]) && (
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>Add an existing company member to this project</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Select Member</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a member" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockUsers
                            .filter((u) => !teamMembers.some((tm) => tm.id === u.id))
                            .map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} - {user.position}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Only company members can be added to projects</p>
                    </div>
                    <Button className="w-full">Add to Project</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => {
              const isLead = member.id === project.leadId
              const isQcAdmin = member.role === "qc_admin"
              return (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{member.name}</p>
                            {isLead && <Crown className="h-4 w-4 text-chart-3" />}
                          </div>
                          <p className="text-sm text-muted-foreground">{member.position}</p>
                        </div>
                      </div>
                      {hasPermission(["company"]) && !isLead && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge
                        className={
                          member.role === "company"
                            ? "bg-chart-1"
                            : member.role === "qc_admin"
                              ? "bg-chart-3"
                              : "bg-chart-2"
                        }
                      >
                        {member.role.replace("_", " ")}
                      </Badge>
                      {isLead && <Badge variant="outline">Project Lead</Badge>}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          {chatRoom ? (
            <Card className="h-[500px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <CardTitle>{chatRoom.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-chart-2 border-chart-2">
                    {chatRoom.hasQcAdmin ? "QC Admin Present" : "No QC Admin"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={mockUsers[1].avatar || "/placeholder.svg"} />
                    <AvatarFallback>SM</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm font-medium text-foreground">{mockUsers[1].name}</p>
                    <p className="text-sm text-foreground mt-1">
                      Hey team! Just pushed the latest updates to the frontend. Please review when you get a chance.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">10:30 AM</p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm font-medium">You</p>
                    <p className="text-sm mt-1">Looks great! I'll check it out now.</p>
                    <p className="text-xs opacity-70 mt-1">10:32 AM</p>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={mockUsers[2].avatar || "/placeholder.svg"} />
                    <AvatarFallback>MC</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm font-medium text-foreground">{mockUsers[2].name}</p>
                    <p className="text-sm text-foreground mt-1">
                      The API integration is almost done. Should be ready for testing by EOD.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">10:45 AM</p>
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && setChatMessage("")}
                  />
                  <Button size="icon" onClick={() => setChatMessage("")}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: At least one QC Admin must be present in every chat room
                </p>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No chat room created for this project yet</p>
              {hasPermission(["company", "qc_admin"]) && <Button className="mt-4">Create Chat Room</Button>}
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
