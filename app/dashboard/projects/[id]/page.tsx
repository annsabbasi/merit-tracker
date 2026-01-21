// app/dashboard/projects/[id]/page.tsx
"use client"

import { use, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
  useProject,
  useProjectStats,
  useProjectLeaderboard,
  useUpdateProject,
  useDeleteProject,
  useAddProjectMembers,
  useRemoveProjectMembers,
  useUpdateMemberRole,
} from "@/lib/hooks/use-projects"
import {
  useSubProjectsByProject,
  useSubProject,
  useSubProjectStats,
  useCreateSubProject,
  useUpdateSubProject,
  useDeleteSubProject,
  useAddSubProjectMembers,
  useRemoveSubProjectMembers,
  useAssignQcHead,
  getSubProjectStatusColor,
  getSubProjectPriorityColor,
  getMemberRoleLabel,
} from "@/lib/hooks/use-sub-projects"
import {
  useTasksBySubProject,
  useCreateGranularTask,
  useUpdateGranularTask,
  useDeleteGranularTask,
  useAssignUsersToTask,
  useSubmitTaskForReview,
  getTaskStatusColor,
  getTaskStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  canEditTask,
  canSubmitForReview,
} from "@/lib/hooks/use-granular-tasks"
import {
  useActiveTimer,
  useTimeTrackingHistory,
  useProjectTimeSummary,
  useStartTimeTracking,
  useStopTimeTracking,
} from "@/lib/hooks/use-time-tracking"
import { useUsers } from "@/lib/hooks/use-users"
import {
  useChatRooms,
  useCreateChatRoom,
  useChatMessages,
  useSendMessage,
} from "@/lib/hooks/use-chat"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Play,
  Square,
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
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  Circle,
  Timer,
  Loader2,
  RefreshCw,
  Settings,
  Users,
  Target,
  Star,
  FolderKanban,
  ListTodo,
  ChevronRight,
  Eye,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import type { SubProjectStatus, ProjectMemberRole, ProjectStatus, Priority, TaskStatus, SubProjectMemberRole } from "@/lib/types/index"

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()

  // Local state
  const [chatMessage, setChatMessage] = useState("")
  const [isAddSubProjectOpen, setIsAddSubProjectOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreateChatOpen, setIsCreateChatOpen] = useState(false)
  const [selectedSubProject, setSelectedSubProject] = useState<string | null>(null)
  const [trackingElapsed, setTrackingElapsed] = useState(0)
  const [activeTab, setActiveTab] = useState("subprojects")

  // Task dialog states
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [selectedTaskSubProjectId, setSelectedTaskSubProjectId] = useState<string | null>(null)
  const [isSubmitTaskDialogOpen, setIsSubmitTaskDialogOpen] = useState(false)
  const [selectedTaskForSubmit, setSelectedTaskForSubmit] = useState<any>(null)
  const [submitNotes, setSubmitNotes] = useState("")

  // SubProject form state
  const [subProjectForm, setSubProjectForm] = useState({
    title: "",
    description: "",
    qcHeadId: "",
    memberIds: [] as string[],
    status: "TODO" as SubProjectStatus,
    priority: "MEDIUM" as Priority,
    pointsValue: "",
    estimatedHours: "",
    dueDate: "",
  })

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assigneeIds: [] as string[],
    priority: "MEDIUM" as Priority,
    pointsValue: "10",
    estimatedMinutes: "",
    dueDate: "",
  })

  // Edit project form state
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    budget: "",
    status: "" as ProjectStatus,
    startDate: "",
    endDate: "",
  })

  // Chat room form state
  const [chatRoomForm, setChatRoomForm] = useState({
    name: "",
    description: "",
    memberIds: [] as string[],
  })

  // Fetch project data
  const { data: project, isLoading: projectLoading, error: projectError } = useProject(id)
  const { data: stats, isLoading: statsLoading } = useProjectStats(id)
  const { data: leaderboard, isLoading: leaderboardLoading } = useProjectLeaderboard(id)
  const { data: subProjects, isLoading: subProjectsLoading, refetch: refetchSubProjects } = useSubProjectsByProject(id)
  const { data: activeTimer, isLoading: activeTimerLoading } = useActiveTimer()
  const { data: timeSummary } = useProjectTimeSummary(id)
  const { data: users } = useUsers()
  const { data: chatRooms } = useChatRooms({ projectId: id })

  // Get tasks for selected subproject
  const { data: subProjectTasks, isLoading: tasksLoading, refetch: refetchTasks } = useTasksBySubProject(
    selectedSubProject || "",
    {}
  )

  // Get chat room for this project
  const projectChatRoom = chatRooms?.find(room => room.projectId === id)
  const { data: chatMessages, refetch: refetchMessages } = useChatMessages(projectChatRoom?.id || "")

  // Mutations
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()
  const addMembers = useAddProjectMembers()
  const removeMembers = useRemoveProjectMembers()
  const updateMemberRole = useUpdateMemberRole()
  const createSubProject = useCreateSubProject()
  const updateSubProject = useUpdateSubProject()
  const deleteSubProject = useDeleteSubProject()
  const addSubProjectMembers = useAddSubProjectMembers()
  const assignQcHead = useAssignQcHead()
  const createTask = useCreateGranularTask()
  const updateTask = useUpdateGranularTask()
  const deleteTask = useDeleteGranularTask()
  const assignUsersToTask = useAssignUsersToTask()
  const submitTaskForReview = useSubmitTaskForReview()
  const startTracking = useStartTimeTracking()
  const stopTracking = useStopTimeTracking()
  const createChatRoom = useCreateChatRoom()
  const sendMessage = useSendMessage()

  // Check permissions
  const isAdmin = user?.role === "COMPANY" || user?.role === "QC_ADMIN"
  const isProjectLead = project?.projectLeadId === user?.id
  const canManageProject = isAdmin || isProjectLead

  // Check if current timer is for this project's subprojects
  const isTrackingThisProject = activeTimer?.active &&
    subProjects?.some(sp => sp.id === activeTimer.timer?.subProjectId)

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (activeTimer?.active && activeTimer.timer?.startTime) {
      const updateElapsed = () => {
        const start = new Date(activeTimer.timer!.startTime).getTime()
        const now = Date.now()
        setTrackingElapsed(Math.floor((now - start) / 1000))
      }

      updateElapsed()
      interval = setInterval(updateElapsed, 1000)
    } else {
      setTrackingElapsed(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeTimer])

  // Initialize edit form when project loads
  useEffect(() => {
    if (project) {
      setEditForm({
        name: project.name,
        description: project.description || "",
        budget: project.budget?.toString() || "",
        status: project.status,
        startDate: project.startDate?.split("T")[0] || "",
        endDate: project.endDate?.split("T")[0] || "",
      })
    }
  }, [project])

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  const statusColors: Record<string, string> = {
    PLANNING: "text-yellow-500 border-yellow-500 bg-yellow-500/10",
    IN_PROGRESS: "text-blue-500 border-blue-500 bg-blue-500/10",
    ON_HOLD: "text-orange-500 border-orange-500 bg-orange-500/10",
    COMPLETED: "text-green-500 border-green-500 bg-green-500/10",
    CANCELLED: "text-red-500 border-red-500 bg-red-500/10",
  }

  const subProjectStatusColors: Record<string, string> = {
    TODO: "bg-gray-500 text-white",
    IN_PROGRESS: "bg-blue-500 text-white",
    IN_REVIEW: "bg-orange-500 text-white",
    COMPLETED: "bg-green-500 text-white",
  }

  const subProjectStatusIcons: Record<string, any> = {
    TODO: Circle,
    IN_PROGRESS: Timer,
    IN_REVIEW: RefreshCw,
    COMPLETED: CheckCircle2,
  }

  const taskStatusIcons: Record<string, any> = {
    TODO: Circle,
    IN_PROGRESS: Timer,
    IN_REVIEW: RefreshCw,
    NEEDS_REVISION: AlertCircle,
    COMPLETED: CheckCircle2,
    BLOCKED: AlertTriangle,
    CANCELLED: XCircle,
  }

  const priorityColors: Record<string, string> = {
    LOW: "bg-gray-500/10 text-gray-500",
    MEDIUM: "bg-blue-500/10 text-blue-500",
    HIGH: "bg-orange-500/10 text-orange-500",
    URGENT: "bg-red-500/10 text-red-500",
    CRITICAL: "bg-red-600/20 text-red-600",
  }

  // Get QC Admins for assigning as QC Head
  const qcAdmins = users?.filter(u => u.role === "QC_ADMIN") || []

  // Get non-member users for adding to project
  const nonMembers = users?.filter(u =>
    !project?.members?.some((m: any) => m.userId === u.id)
  ) || []

  // Get selected subproject details
  const selectedSubProjectData = subProjects?.find(sp => sp.id === selectedSubProject)

  // Get members for task assignment (from selected subproject)
  const subProjectMembers = selectedSubProjectData?.members || []

  // ============================================
  // HANDLERS
  // ============================================

  // Create SubProject
  const handleCreateSubProject = async () => {
    if (!subProjectForm.title.trim()) {
      toast.error("SubProject title is required")
      return
    }

    try {
      await createSubProject.mutateAsync({
        title: subProjectForm.title,
        description: subProjectForm.description || undefined,
        projectId: id,
        qcHeadId: subProjectForm.qcHeadId || undefined,
        memberIds: subProjectForm.memberIds.length > 0 ? subProjectForm.memberIds : undefined,
        status: subProjectForm.status,
        priority: subProjectForm.priority,
        pointsValue: subProjectForm.pointsValue ? parseInt(subProjectForm.pointsValue) : undefined,
        estimatedHours: subProjectForm.estimatedHours ? parseInt(subProjectForm.estimatedHours) : undefined,
        dueDate: subProjectForm.dueDate || undefined,
      })

      toast.success("SubProject created successfully!")
      setIsAddSubProjectOpen(false)
      resetSubProjectForm()
      refetchSubProjects()
    } catch (error: any) {
      toast.error(error?.message || "Failed to create subproject")
    }
  }

  const resetSubProjectForm = () => {
    setSubProjectForm({
      title: "",
      description: "",
      qcHeadId: "",
      memberIds: [],
      status: "TODO",
      priority: "MEDIUM",
      pointsValue: "",
      estimatedHours: "",
      dueDate: "",
    })
  }

  // Update SubProject status
  const handleUpdateSubProjectStatus = async (subProjectId: string, newStatus: SubProjectStatus) => {
    try {
      await updateSubProject.mutateAsync({
        id: subProjectId,
        data: { status: newStatus }
      })
      toast.success("SubProject status updated!")
      refetchSubProjects()
    } catch (error) {
      toast.error("Failed to update subproject")
    }
  }

  // Delete SubProject
  const handleDeleteSubProject = async (subProjectId: string) => {
    try {
      await deleteSubProject.mutateAsync(subProjectId)
      toast.success("SubProject deleted!")
      if (selectedSubProject === subProjectId) {
        setSelectedSubProject(null)
      }
      refetchSubProjects()
    } catch (error) {
      toast.error("Failed to delete subproject")
    }
  }

  // Create Task
  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error("Task title is required")
      return
    }

    if (!selectedTaskSubProjectId) {
      toast.error("Please select a subproject")
      return
    }

    try {
      await createTask.mutateAsync({
        title: taskForm.title,
        description: taskForm.description || undefined,
        subProjectId: selectedTaskSubProjectId,
        assigneeIds: taskForm.assigneeIds.length > 0 ? taskForm.assigneeIds : undefined,
        priority: taskForm.priority,
        pointsValue: taskForm.pointsValue ? parseInt(taskForm.pointsValue) : 10,
        estimatedMinutes: taskForm.estimatedMinutes ? parseInt(taskForm.estimatedMinutes) : undefined,
        dueDate: taskForm.dueDate || undefined,
      })

      toast.success("Task created successfully!")
      setIsAddTaskOpen(false)
      resetTaskForm()
      refetchTasks()
    } catch (error: any) {
      toast.error(error?.message || "Failed to create task")
    }
  }

  const resetTaskForm = () => {
    setTaskForm({
      title: "",
      description: "",
      assigneeIds: [],
      priority: "MEDIUM",
      pointsValue: "10",
      estimatedMinutes: "",
      dueDate: "",
    })
  }

  // Update Task status
  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        data: { status: newStatus }
      })
      toast.success(`Task status updated to ${getTaskStatusLabel(newStatus)}`)
      refetchTasks()
    } catch (error: any) {
      toast.error(error?.message || "Failed to update task")
    }
  }

  // Submit task for review
  const handleSubmitForReview = async () => {
    if (!selectedTaskForSubmit) return

    try {
      await submitTaskForReview.mutateAsync({
        id: selectedTaskForSubmit.id,
        data: submitNotes ? { notes: submitNotes } : undefined,
      })
      toast.success("Task submitted for review!")
      setIsSubmitTaskDialogOpen(false)
      setSelectedTaskForSubmit(null)
      setSubmitNotes("")
      refetchTasks()
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit task")
    }
  }

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId)
      toast.success("Task deleted!")
      refetchTasks()
    } catch (error) {
      toast.error("Failed to delete task")
    }
  }

  // Toggle member selection for subproject creation
  const handleSubProjectMemberToggle = (userId: string) => {
    setSubProjectForm(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId]
    }))
  }

  // Toggle assignee selection for task creation
  const handleTaskAssigneeToggle = (userId: string) => {
    setTaskForm(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(userId)
        ? prev.assigneeIds.filter(id => id !== userId)
        : [...prev.assigneeIds, userId]
    }))
  }

  // Start time tracking
  const handleStartTracking = async (subProjectId: string) => {
    if (activeTimer?.active) {
      toast.error("You already have an active timer. Stop it first.")
      return
    }

    try {
      await startTracking.mutateAsync({ subProjectId })
      toast.success("Time tracking started!")
    } catch (error: any) {
      toast.error(error?.message || "Failed to start tracking")
    }
  }

  // Stop time tracking
  const handleStopTracking = async () => {
    if (!activeTimer?.active || !activeTimer.timer?.id) return

    try {
      const result = await stopTracking.mutateAsync({
        id: activeTimer.timer.id,
        notes: undefined,
      })
      toast.success(`Time tracked! You earned ${result.pointsEarned || 0} points.`)
    } catch (error) {
      toast.error("Failed to stop tracking")
    }
  }

  // Update project
  const handleUpdateProject = async () => {
    try {
      await updateProject.mutateAsync({
        id,
        data: {
          name: editForm.name,
          description: editForm.description || undefined,
          budget: editForm.budget ? parseFloat(editForm.budget) : undefined,
          status: editForm.status,
          startDate: editForm.startDate || undefined,
          endDate: editForm.endDate || undefined,
        },
      })
      toast.success("Project updated!")
      setIsEditProjectOpen(false)
    } catch (error) {
      toast.error("Failed to update project")
    }
  }

  // Delete project
  const handleDeleteProject = async () => {
    try {
      await deleteProject.mutateAsync(id)
      toast.success("Project deleted!")
      router.push("/dashboard/projects")
    } catch (error) {
      toast.error("Failed to delete project")
    }
  }

  // Add member to project
  const handleAddMember = async (userId: string) => {
    try {
      await addMembers.mutateAsync({ id, userIds: [userId] })
      toast.success("Member added!")
      setIsAddMemberOpen(false)
    } catch (error) {
      toast.error("Failed to add member")
    }
  }

  // Remove member from project
  const handleRemoveMember = async (userId: string) => {
    if (userId === project?.projectLeadId) {
      toast.error("Cannot remove project lead")
      return
    }

    try {
      await removeMembers.mutateAsync({ id, userIds: [userId] })
      toast.success("Member removed!")
    } catch (error) {
      toast.error("Failed to remove member")
    }
  }

  // Update member role
  const handleUpdateMemberRole = async (userId: string, role: ProjectMemberRole) => {
    try {
      await updateMemberRole.mutateAsync({ projectId: id, userId, role })
      toast.success("Member role updated!")
    } catch (error) {
      toast.error("Failed to update role")
    }
  }

  // Create chat room
  const handleCreateChatRoom = async () => {
    if (!chatRoomForm.name.trim()) {
      toast.error("Chat room name is required")
      return
    }

    try {
      await createChatRoom.mutateAsync({
        name: chatRoomForm.name,
        description: chatRoomForm.description || undefined,
        projectId: id,
        memberIds: chatRoomForm.memberIds.length > 0 ? chatRoomForm.memberIds : undefined,
      })
      toast.success("Chat room created!")
      setIsCreateChatOpen(false)
      setChatRoomForm({ name: "", description: "", memberIds: [] })
    } catch (error) {
      toast.error("Failed to create chat room")
    }
  }

  // Send chat message
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !projectChatRoom?.id) return

    try {
      await sendMessage.mutateAsync({
        roomId: projectChatRoom.id,
        content: chatMessage,
      })
      setChatMessage("")
      refetchMessages()
    } catch (error) {
      toast.error("Failed to send message")
    }
  }

  // Check if user can track time on a subproject
  const canTrackTime = (subProject: any) => {
    const isMember = subProject.members?.some((m: any) => m.userId === user?.id)
    const isQcHead = subProject.qcHeadId === user?.id
    const isCreator = subProject.createdById === user?.id
    return isMember || isQcHead || isCreator || isAdmin || isProjectLead
  }

  // Loading state
  if (projectLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  // Error state
  if (projectError || !project) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <Card className="p-8 text-center">
          <p className="text-destructive">Project not found or you don't have access.</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard/projects")}>
            Go to Projects
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <Badge variant="outline" className={statusColors[project.status]}>
              {project.status.replace("_", " ")}
            </Badge>
            {project.screenCaptureEnabled && (
              <Badge variant="outline" className="text-blue-500 border-blue-500">
                <Camera className="h-3 w-3 mr-1" />
                Screen Capture
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            {project.description || "No description"}
          </p>
          {project.departments && project.departments.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Department:</span>
              <Badge variant="outline">
                {project.departments[0].department.name}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {project.endDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Due {new Date(project.endDate).toLocaleDateString()}</span>
            </div>
          )}
          {project.budget && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>${Number(project.budget).toLocaleString()}</span>
            </div>
          )}
          {canManageProject && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditProjectOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </DropdownMenuItem>
                {user?.role === "COMPANY" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mx-auto" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {stats?.completionPercentage || 0}%
              </p>
            )}
            <p className="text-sm text-muted-foreground">Progress</p>
            <Progress value={stats?.completionPercentage || 0} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mx-auto" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {stats?.totalSubProjects || subProjects?.length || 0}
              </p>
            )}
            <p className="text-sm text-muted-foreground">SubProjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mx-auto" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {stats?.totalMembers || project.members?.length || 0}
              </p>
            )}
            <p className="text-sm text-muted-foreground">Team Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mx-auto" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {stats?.totalTimeTrackedHours || (timeSummary as any)?.summary?.totalHours || 0}h
              </p>
            )}
            <p className="text-sm text-muted-foreground">Hours Logged</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap">
          <TabsTrigger value="subprojects" className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            SubProjects
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="tracker" className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Time Tracker
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* SUBPROJECTS TAB */}
        {/* ============================================ */}
        <TabsContent value="subprojects" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">SubProjects</h3>
            <Dialog open={isAddSubProjectOpen} onOpenChange={setIsAddSubProjectOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add SubProject
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New SubProject</DialogTitle>
                  <DialogDescription>
                    Add a subproject to this project. Anyone in the company can create subprojects.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      placeholder="e.g., Design Homepage"
                      value={subProjectForm.title}
                      onChange={(e) => setSubProjectForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="SubProject description..."
                      rows={2}
                      value={subProjectForm.description}
                      onChange={(e) => setSubProjectForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>QC Head (Optional)</Label>
                      <Select
                        value={subProjectForm.qcHeadId || "none"}
                        onValueChange={(value) => setSubProjectForm(prev => ({
                          ...prev,
                          qcHeadId: value === "none" ? "" : value
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select QC Head" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No QC Head</SelectItem>
                          {qcAdmins.map((admin) => (
                            <SelectItem key={admin.id} value={admin.id}>
                              {admin.firstName} {admin.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Must be a QC Admin</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select
                        value={subProjectForm.priority}
                        onValueChange={(value) => setSubProjectForm(prev => ({ ...prev, priority: value as Priority }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Points Value</Label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={subProjectForm.pointsValue}
                        onChange={(e) => setSubProjectForm(prev => ({ ...prev, pointsValue: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Hours</Label>
                      <Input
                        type="number"
                        placeholder="8"
                        value={subProjectForm.estimatedHours}
                        onChange={(e) => setSubProjectForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={subProjectForm.dueDate}
                      onChange={(e) => setSubProjectForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>

                  {/* Member Selection */}
                  <div className="space-y-2">
                    <Label>Team Members (Optional)</Label>
                    <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                      {project.members?.map((member: any) => {
                        const isSelected = subProjectForm.memberIds.includes(member.user.id)
                        return (
                          <div
                            key={member.user.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-primary/10 border border-primary" : "hover:bg-muted"
                              }`}
                            onClick={() => handleSubProjectMemberToggle(member.user.id)}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member.user.avatar || ""} />
                              <AvatarFallback className="text-xs">
                                {member.user.firstName?.[0]}{member.user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {member.user.firstName} {member.user.lastName}
                            </span>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
                          </div>
                        )
                      })}
                    </div>
                    {subProjectForm.memberIds.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {subProjectForm.memberIds.length} member(s) selected
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleCreateSubProject}
                    disabled={createSubProject.isPending}
                  >
                    {createSubProject.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create SubProject"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {subProjectsLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : subProjects && subProjects.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {subProjects.map((subProject) => {
                const StatusIcon = subProjectStatusIcons[subProject.status] || Circle
                const userCanTrack = canTrackTime(subProject)
                const isActivelyTracking = activeTimer?.active && activeTimer.timer?.subProjectId === subProject.id

                return (
                  <Card
                    key={subProject.id}
                    className={`relative cursor-pointer transition-colors ${selectedSubProject === subProject.id ? "border-primary" : "hover:border-primary/50"
                      }`}
                    onClick={() => {
                      setSelectedSubProject(subProject.id)
                      setActiveTab("tasks")
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium text-foreground truncate">
                              {subProject.title}
                            </p>
                          </div>
                          {subProject.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {subProject.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Badge className={subProjectStatusColors[subProject.status]}>
                            {subProject.status.replace("_", " ")}
                          </Badge>
                          <Badge className={priorityColors[subProject.priority] || priorityColors.MEDIUM}>
                            {subProject.priority}
                          </Badge>
                          {canManageProject && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedSubProject(subProject.id)
                                    setActiveTab("tasks")
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Tasks
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleUpdateSubProjectStatus(
                                    subProject.id,
                                    subProject.status === "TODO" ? "IN_PROGRESS" :
                                      subProject.status === "IN_PROGRESS" ? "IN_REVIEW" :
                                        subProject.status === "IN_REVIEW" ? "COMPLETED" : "TODO"
                                  )}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Change Status
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteSubProject(subProject.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>

                      {/* SubProject Members */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          {subProject.members && subProject.members.length > 0 ? (
                            <div className="flex -space-x-2">
                              {subProject.members.slice(0, 3).map((member: any) => (
                                <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                                  <AvatarImage src={member.user?.avatar || ""} />
                                  <AvatarFallback className="text-xs">
                                    {member.user?.firstName?.[0]}
                                    {member.user?.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {subProject.members.length > 3 && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  +{subProject.members.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No members</span>
                          )}
                          {subProject.qcHead && (
                            <Badge variant="outline" className="text-xs">
                              QC: {subProject.qcHead.firstName}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          {subProject._count?.tasks !== undefined && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <ListTodo className="h-3 w-3" />
                              {subProject._count.tasks} tasks
                            </span>
                          )}
                          <span className="text-muted-foreground font-medium">
                            {subProject.pointsValue || 0} pts
                          </span>
                        </div>
                      </div>

                      {/* Quick actions */}
                      {userCanTrack && subProject.status !== "COMPLETED" && (
                        <div className="mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                          {isActivelyTracking ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-full"
                              onClick={handleStopTracking}
                              disabled={stopTracking.isPending}
                            >
                              <Square className="h-3 w-3 mr-2" />
                              Stop ({formatTime(trackingElapsed)})
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleStartTracking(subProject.id)}
                              disabled={startTracking.isPending || activeTimer?.active}
                            >
                              <Play className="h-3 w-3 mr-2" />
                              Start Tracking
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No subprojects yet</p>
              <Button className="mt-4" onClick={() => setIsAddSubProjectOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First SubProject
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* TASKS TAB */}
        {/* ============================================ */}
        <TabsContent value="tasks" className="space-y-4">
          {/* SubProject Selection */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Label>SubProject:</Label>
              <Select
                value={selectedSubProject || "none"}
                onValueChange={(value) => setSelectedSubProject(value === "none" ? null : value)}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a subproject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a subproject</SelectItem>
                  {subProjects?.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSubProject && (
              <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => setSelectedTaskSubProjectId(selectedSubProject)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                      Add a task to "{selectedSubProjectData?.title}". Tasks can be assigned to team members.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        placeholder="e.g., Implement login form"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Task description..."
                        rows={2}
                        value={taskForm.description}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select
                          value={taskForm.priority}
                          onValueChange={(value) => setTaskForm(prev => ({ ...prev, priority: value as Priority }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="URGENT">Urgent</SelectItem>
                            <SelectItem value="CRITICAL">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Points Value</Label>
                        <Input
                          type="number"
                          placeholder="10"
                          value={taskForm.pointsValue}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, pointsValue: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Estimated Minutes</Label>
                        <Input
                          type="number"
                          placeholder="60"
                          value={taskForm.estimatedMinutes}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, estimatedMinutes: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={taskForm.dueDate}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Assignee Selection */}
                    <div className="space-y-2">
                      <Label>Assignees (Optional)</Label>
                      <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                        {subProjectMembers.length > 0 ? (
                          subProjectMembers.map((member: any) => {
                            const isSelected = taskForm.assigneeIds.includes(member.user.id)
                            return (
                              <div
                                key={member.user.id}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-primary/10 border border-primary" : "hover:bg-muted"
                                  }`}
                                onClick={() => handleTaskAssigneeToggle(member.user.id)}
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={member.user?.avatar || ""} />
                                  <AvatarFallback className="text-xs">
                                    {member.user?.firstName?.[0]}{member.user?.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <span className="text-sm">
                                    {member.user?.firstName} {member.user?.lastName}
                                  </span>
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {getMemberRoleLabel(member.role)}
                                  </Badge>
                                </div>
                                {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            No members in this subproject yet
                          </p>
                        )}
                      </div>
                      {taskForm.assigneeIds.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {taskForm.assigneeIds.length} assignee(s) selected
                        </p>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleCreateTask}
                      disabled={createTask.isPending}
                    >
                      {createTask.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Task"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Selected SubProject Info */}
          {selectedSubProjectData && (
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{selectedSubProjectData.title}</CardTitle>
                    <Badge className={subProjectStatusColors[selectedSubProjectData.status]}>
                      {selectedSubProjectData.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    {selectedSubProjectData.pointsValue || 0} pts
                    {selectedSubProjectData.dueDate && (
                      <>
                        <span className="mx-2">•</span>
                        <Calendar className="h-4 w-4" />
                        Due {new Date(selectedSubProjectData.dueDate).toLocaleDateString()}
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Tasks List */}
          {!selectedSubProject ? (
            <Card className="p-8 text-center">
              <ListTodo className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Select a subproject to view its tasks</p>
            </Card>
          ) : tasksLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : subProjectTasks && subProjectTasks.length > 0 ? (
            <div className="space-y-3">
              {subProjectTasks.map((task) => {
                const StatusIcon = taskStatusIcons[task.status] || Circle
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED"
                const userCanEdit = canEditTask(task, user?.id || "", user?.role || "USER")
                const userCanSubmit = canSubmitForReview(task, user?.id || "")

                return (
                  <Card key={task.id} className={`${isOverdue ? "border-red-500/50" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <h4 className="font-semibold text-foreground truncate">
                              {task.title}
                            </h4>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Task Meta */}
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {task.pointsValue} pts
                            </span>
                            {task.dueDate && (
                              <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500" : ""}`}>
                                <Calendar className="h-3 w-3" />
                                {isOverdue ? "Overdue: " : "Due: "}
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {task.estimatedMinutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {task.estimatedMinutes}m estimated
                              </span>
                            )}
                          </div>

                          {/* Assignees */}
                          {task.assignees && task.assignees.length > 0 && (
                            <div className="flex items-center gap-2 mt-3">
                              <span className="text-sm text-muted-foreground">Assignees:</span>
                              <div className="flex -space-x-2">
                                {task.assignees.slice(0, 3).map((assignee) => (
                                  <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                                    <AvatarImage src={assignee.user.avatar || ""} />
                                    <AvatarFallback className="text-xs">
                                      {assignee.user.firstName?.[0]}
                                      {assignee.user.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {task.assignees.length > 3 && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    +{task.assignees.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Revision Notice */}
                          {task.status === "NEEDS_REVISION" && task.reviewNotes && (
                            <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/20">
                              <p className="text-sm text-red-600">
                                <strong>Feedback:</strong> {task.reviewNotes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Badges and Actions */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getTaskStatusColor(task.status)}>
                              {getTaskStatusLabel(task.status)}
                            </Badge>
                            <Badge className={getPriorityColor(task.priority)}>
                              {getPriorityLabel(task.priority)}
                            </Badge>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2 mt-2">
                            {task.status === "TODO" && userCanEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateTaskStatus(task.id, "IN_PROGRESS")}
                                disabled={updateTask.isPending}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Start
                              </Button>
                            )}
                            {(task.status === "IN_PROGRESS" || task.status === "NEEDS_REVISION") && userCanSubmit && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setSelectedTaskForSubmit(task)
                                  setSubmitNotes("")
                                  setIsSubmitTaskDialogOpen(true)
                                }}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Submit
                              </Button>
                            )}
                            {task.status === "IN_REVIEW" && (
                              <Badge variant="outline" className="text-orange-500">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending Review
                              </Badge>
                            )}
                            {task.status === "COMPLETED" && (
                              <Badge variant="outline" className="text-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            )}

                            {userCanEdit && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteTask(task.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <ListTodo className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No tasks in this subproject yet</p>
              <Button
                className="mt-4"
                onClick={() => {
                  setSelectedTaskSubProjectId(selectedSubProject)
                  setIsAddTaskOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Task
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* TIME TRACKER TAB */}
        {/* ============================================ */}
        <TabsContent value="tracker" className="space-y-4">
          {/* Screen Monitoring Alert */}
          {project.screenCaptureEnabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Screen Capture Active</AlertTitle>
              <AlertDescription>
                While tracking time on this project, your screen will be captured periodically for quality assurance purposes.
              </AlertDescription>
            </Alert>
          )}

          {/* Active Timer Display */}
          <Card>
            <CardContent className="p-8 text-center">
              {activeTimerLoading ? (
                <Skeleton className="h-16 w-48 mx-auto" />
              ) : activeTimer?.active ? (
                <>
                  <div className="text-6xl font-mono font-bold text-foreground mb-2">
                    {formatTime(trackingElapsed)}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Tracking: {activeTimer.timer?.subProjectTitle}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Project: {activeTimer.timer?.projectName}
                  </p>
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={handleStopTracking}
                    disabled={stopTracking.isPending}
                    className="gap-2"
                  >
                    {stopTracking.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                    Stop Tracking
                  </Button>
                  {activeTimer.timer?.screenCaptureRequired && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Camera className="h-4 w-4" />
                      <span>Screenshots are being captured periodically</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-6xl font-mono font-bold text-muted-foreground mb-4">
                    00:00:00
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Select a subproject to start tracking time
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Go to the SubProjects tab and click "Start Tracking" on any subproject
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Time Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Project Time Summary</CardTitle>
              <CardDescription>Total time tracked on this project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">
                    {(timeSummary as any)?.summary?.totalSessions || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Sessions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {(timeSummary as any)?.summary?.totalHours?.toFixed(1) || 0}h
                  </p>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {(timeSummary as any)?.summary?.totalFormatted || "0m"}
                  </p>
                  <p className="text-sm text-muted-foreground">Formatted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* By User Breakdown */}
          {(timeSummary as any)?.byUser && (timeSummary as any).byUser.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Time by Team Member</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(timeSummary as any).byUser.map((item: any) => (
                  <div key={item.user?.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={item.user?.avatar || ""} />
                        <AvatarFallback>
                          {item.user?.firstName?.[0]}{item.user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {item.user?.firstName} {item.user?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.sessions} sessions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{item.totalHours?.toFixed(1)}h</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* LEADERBOARD TAB */}
        {/* ============================================ */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Project Leaderboard
              </CardTitle>
              <CardDescription>Points earned from time tracking in this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboardLoading ? (
                [...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))
              ) : leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((member: any, index: number) => (
                  <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0
                        ? "bg-yellow-500 text-white"
                        : index === 1
                          ? "bg-gray-400 text-white"
                          : index === 2
                            ? "bg-amber-600 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {index + 1}
                    </span>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user?.avatar || ""} />
                      <AvatarFallback>
                        {member.user?.firstName?.[0]}{member.user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {member.user?.firstName} {member.user?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.role?.replace("_", " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">
                        {member.pointsEarned || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">points</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No points earned yet. Start tracking time on subprojects!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* TEAM TAB */}
        {/* ============================================ */}
        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Project Team</h3>
            {canManageProject && (
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
                    <DialogDescription>Add a company member to this project</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4 max-h-96 overflow-y-auto">
                    {nonMembers.length > 0 ? (
                      nonMembers.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted cursor-pointer"
                          onClick={() => handleAddMember(u.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={u.avatar || ""} />
                              <AvatarFallback>
                                {u.firstName?.[0]}{u.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{u.role?.replace("_", " ")}</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        All company members are already in this project
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Project Lead */}
            {project.projectLead && (
              <Card className="border-primary/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={project.projectLead.avatar || ""} />
                        <AvatarFallback>
                          {project.projectLead.firstName?.[0]}
                          {project.projectLead.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {project.projectLead.firstName} {project.projectLead.lastName}
                          </p>
                          <Crown className="h-4 w-4 text-yellow-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {project.projectLead.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline">
                      {project.projectLead.role?.replace("_", " ")}
                    </Badge>
                    <Badge className="bg-primary">Project Lead</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Other Members */}
            {project.members?.filter((m: any) => m.userId !== project.projectLeadId).map((member: any) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.user?.avatar || ""} />
                        <AvatarFallback>
                          {member.user?.firstName?.[0]}
                          {member.user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {member.user?.firstName} {member.user?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.user?.email}
                        </p>
                      </div>
                    </div>
                    {canManageProject && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleUpdateMemberRole(member.userId, "LEAD")}
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            Make Lead
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleRemoveMember(member.userId)}
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline">
                      {member.user?.role?.replace("_", " ")}
                    </Badge>
                    <Badge variant="secondary">
                      {member.role?.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {member.pointsEarned || 0} pts
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!project.members || project.members.length === 0) && !project.projectLead && (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No team members yet</p>
            </Card>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* CHAT TAB */}
        {/* ============================================ */}
        <TabsContent value="chat" className="space-y-4">
          {projectChatRoom ? (
            <Card className="h-[500px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <CardTitle>{projectChatRoom.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    {projectChatRoom.members?.length || 0} members
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages && chatMessages.length > 0 ? (
                  chatMessages.map((message: any) => {
                    const isOwnMessage = message.senderId === user?.id
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isOwnMessage ? "justify-end" : ""}`}
                      >
                        {!isOwnMessage && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.sender?.avatar || ""} />
                            <AvatarFallback>
                              {message.sender?.firstName?.[0]}
                              {message.sender?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-lg p-3 max-w-[80%] ${isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                            }`}
                        >
                          {!isOwnMessage && (
                            <p className="text-sm font-medium">
                              {message.sender?.firstName} {message.sender?.lastName}
                            </p>
                          )}
                          <p className="text-sm mt-1">{message.content}</p>
                          <p className={`text-xs mt-1 ${isOwnMessage ? "opacity-70" : "text-muted-foreground"}`}>
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        {isOwnMessage && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.avatar || ""} />
                            <AvatarFallback>
                              {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim() || sendMessage.isPending}
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No chat room created for this project yet</p>
              {canManageProject && (
                <Dialog open={isCreateChatOpen} onOpenChange={setIsCreateChatOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Chat Room
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Chat Room</DialogTitle>
                      <DialogDescription>
                        Create a chat room for this project
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Room Name *</Label>
                        <Input
                          placeholder="e.g., General Discussion"
                          value={chatRoomForm.name}
                          onChange={(e) => setChatRoomForm(prev => ({
                            ...prev,
                            name: e.target.value
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Room description..."
                          value={chatRoomForm.description}
                          onChange={(e) => setChatRoomForm(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleCreateChatRoom}
                        disabled={createChatRoom.isPending}
                      >
                        {createChatRoom.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Chat Room"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ============================================ */}
      {/* MODALS & DIALOGS */}
      {/* ============================================ */}

      {/* Submit Task for Review Dialog */}
      <Dialog open={isSubmitTaskDialogOpen} onOpenChange={setIsSubmitTaskDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Task for Review</DialogTitle>
            <DialogDescription>
              Submit "{selectedTaskForSubmit?.title}" for quality check review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="review-notes">Review Notes (Optional)</Label>
              <Textarea
                id="review-notes"
                placeholder="Add any notes for the reviewer..."
                rows={3}
                value={submitNotes}
                onChange={(e) => setSubmitNotes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Describe what you've completed or any specific areas you want reviewed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSubmitTaskDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitForReview}
              disabled={submitTaskForReview.isPending}
            >
              {submitTaskForReview.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Review"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget</Label>
                <Input
                  type="number"
                  value={editForm.budget}
                  onChange={(e) => setEditForm(prev => ({ ...prev, budget: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as ProjectStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNING">Planning</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleUpdateProject}
              disabled={updateProject.isPending}
            >
              {updateProject.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              "{project.name}" and all its subprojects, tasks, time entries, and chat rooms.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteProject}
            >
              {deleteProject.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}