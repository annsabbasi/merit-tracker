// app/dashboard/my-tasks/page.tsx
"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
    useMyGranularTasks,
    useUpdateGranularTask,
    useSubmitTaskForReview,
    getTaskStatusColor,
    getPriorityColor,
    type GranularTask,
    type TaskStatus,
} from "@/lib/hooks/use-granular-tasks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
    Search,
    Filter,
    Clock,
    Target,
    Calendar,
    Play,
    CheckCircle2,
    Circle,
    Timer,
    RefreshCw,
    AlertTriangle,
    Send,
    Star,
    Loader2,
    ArrowRight,
    FileText,
    AlertCircle,
    XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

// Status icons mapping
const statusIcons: Record<TaskStatus, any> = {
    TODO: Circle,
    IN_PROGRESS: Timer,
    IN_REVIEW: RefreshCw,
    NEEDS_REVISION: AlertCircle,
    COMPLETED: CheckCircle2,
    BLOCKED: AlertTriangle,
    CANCELLED: XCircle,
}

export default function MyTasksPage() {
    const { user } = useAuthStore()
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [priorityFilter, setPriorityFilter] = useState<string>("all")
    const [selectedTask, setSelectedTask] = useState<GranularTask | null>(null)
    const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
    const [submitNotes, setSubmitNotes] = useState("")

    // Fetch my tasks
    const { data: tasks, isLoading, refetch } = useMyGranularTasks({
        status: statusFilter !== "all" ? (statusFilter as TaskStatus) : undefined,
        priority: priorityFilter !== "all" ? (priorityFilter as any) : undefined,
    })

    // Mutations
    const updateTask = useUpdateGranularTask()
    const submitForReview = useSubmitTaskForReview()

    // Filter tasks
    const filteredTasks = tasks?.filter((task) => {
        const matchesSearch = searchQuery
            ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase())
            : true
        return matchesSearch
    }) || []

    // Group tasks by status for tabs
    const todoTasks = filteredTasks.filter((t) => t.status === "TODO")
    const inProgressTasks = filteredTasks.filter((t) => t.status === "IN_PROGRESS")
    const inReviewTasks = filteredTasks.filter((t) => t.status === "IN_REVIEW")
    const needsRevisionTasks = filteredTasks.filter((t) => t.status === "NEEDS_REVISION")
    const completedTasks = filteredTasks.filter((t) => t.status === "COMPLETED")

    // Calculate stats
    const totalTasks = filteredTasks.length
    const completedCount = completedTasks.length
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0
    const totalPoints = filteredTasks.reduce((sum, t) => sum + (t.pointsValue || 0), 0)
    const earnedPoints = completedTasks.reduce((sum, t) => sum + (t.pointsValue || 0), 0)

    // Handle status change
    const handleStatusChange = async (task: GranularTask, newStatus: TaskStatus) => {
        try {
            await updateTask.mutateAsync({
                id: task.id,
                data: { status: newStatus },
            })
            toast.success(`Task moved to ${newStatus.replace("_", " ")}`)
        } catch (error: any) {
            toast.error(error?.message || "Failed to update task")
        }
    }

    // Handle submit for review
    const handleSubmitForReview = async () => {
        if (!selectedTask) return

        try {
            await submitForReview.mutateAsync({
                id: selectedTask.id,
                data: submitNotes ? { notes: submitNotes } : undefined,
            })
            toast.success("Task submitted for review!")
            setIsSubmitDialogOpen(false)
            setSelectedTask(null)
            setSubmitNotes("")
        } catch (error: any) {
            toast.error(error?.message || "Failed to submit task")
        }
    }

    // Open submit dialog
    const openSubmitDialog = (task: GranularTask) => {
        setSelectedTask(task)
        setSubmitNotes("")
        setIsSubmitDialogOpen(true)
    }

    // Render task card
    const TaskCard = ({ task }: { task: GranularTask }) => {
        const StatusIcon = statusIcons[task.status] || Circle
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED"

        return (
            <Card className={`hover:border-primary/50 transition-colors ${isOverdue ? "border-red-500/50" : ""}`}>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            {/* Title and status */}
                            <div className="flex items-center gap-2">
                                <StatusIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <h3 className="font-semibold text-foreground truncate">
                                    {task.title}
                                </h3>
                            </div>

                            {/* Description */}
                            {task.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {task.description}
                                </p>
                            )}

                            {/* Meta info */}
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {task.subProject?.title}
                                </span>
                                <span className="flex items-center gap-1">
                                    <ArrowRight className="h-3 w-3" />
                                    {task.subProject?.project?.name}
                                </span>
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
                            </div>

                            {/* Revision notice */}
                            {task.status === "NEEDS_REVISION" && task.reviewNotes && (
                                <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/20">
                                    <p className="text-sm text-red-600">
                                        <strong>Feedback:</strong> {task.reviewNotes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Badges and actions */}
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                                <Badge className={getTaskStatusColor(task.status)}>
                                    {task.status.replace("_", " ")}
                                </Badge>
                                <Badge className={getPriorityColor(task.priority)}>
                                    {task.priority}
                                </Badge>
                            </div>

                            {/* Quick actions based on status */}
                            <div className="flex items-center gap-2 mt-2">
                                {task.status === "TODO" && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStatusChange(task, "IN_PROGRESS")}
                                        disabled={updateTask.isPending}
                                    >
                                        <Play className="h-3 w-3 mr-1" />
                                        Start
                                    </Button>
                                )}
                                {(task.status === "IN_PROGRESS" || task.status === "NEEDS_REVISION") && (
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => openSubmitDialog(task)}
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
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Target className="h-7 w-7 text-primary" />
                        My Tasks
                    </h1>
                    <p className="text-muted-foreground">
                        Tasks assigned to you across all projects
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Tasks</p>
                                <p className="text-2xl font-bold">{totalTasks}</p>
                            </div>
                            <Target className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Completed</p>
                                <p className="text-2xl font-bold text-green-500">{completedCount}</p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                        <Progress value={completionRate} className="mt-2 h-1.5" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">In Progress</p>
                                <p className="text-2xl font-bold text-blue-500">
                                    {inProgressTasks.length + needsRevisionTasks.length}
                                </p>
                            </div>
                            <Timer className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Points Earned</p>
                                <p className="text-2xl font-bold text-yellow-500">{earnedPoints}</p>
                            </div>
                            <Star className="h-8 w-8 text-yellow-500" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            of {totalPoints} total available
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="IN_REVIEW">In Review</SelectItem>
                        <SelectItem value="NEEDS_REVISION">Needs Revision</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-40">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tasks by Status Tabs */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            ) : (
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="w-full justify-start overflow-x-auto">
                        <TabsTrigger value="all">
                            All ({filteredTasks.length})
                        </TabsTrigger>
                        <TabsTrigger value="todo">
                            To Do ({todoTasks.length})
                        </TabsTrigger>
                        <TabsTrigger value="in_progress">
                            In Progress ({inProgressTasks.length})
                        </TabsTrigger>
                        {needsRevisionTasks.length > 0 && (
                            <TabsTrigger value="needs_revision" className="text-red-500">
                                Needs Revision ({needsRevisionTasks.length})
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="in_review">
                            In Review ({inReviewTasks.length})
                        </TabsTrigger>
                        <TabsTrigger value="completed">
                            Completed ({completedTasks.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-4 mt-4">
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
                        ) : (
                            <EmptyState />
                        )}
                    </TabsContent>

                    <TabsContent value="todo" className="space-y-4 mt-4">
                        {todoTasks.length > 0 ? (
                            todoTasks.map((task) => <TaskCard key={task.id} task={task} />)
                        ) : (
                            <EmptyState message="No tasks to do" />
                        )}
                    </TabsContent>

                    <TabsContent value="in_progress" className="space-y-4 mt-4">
                        {inProgressTasks.length > 0 ? (
                            inProgressTasks.map((task) => <TaskCard key={task.id} task={task} />)
                        ) : (
                            <EmptyState message="No tasks in progress" />
                        )}
                    </TabsContent>

                    <TabsContent value="needs_revision" className="space-y-4 mt-4">
                        {needsRevisionTasks.length > 0 ? (
                            needsRevisionTasks.map((task) => <TaskCard key={task.id} task={task} />)
                        ) : (
                            <EmptyState message="No tasks needing revision" />
                        )}
                    </TabsContent>

                    <TabsContent value="in_review" className="space-y-4 mt-4">
                        {inReviewTasks.length > 0 ? (
                            inReviewTasks.map((task) => <TaskCard key={task.id} task={task} />)
                        ) : (
                            <EmptyState message="No tasks in review" />
                        )}
                    </TabsContent>

                    <TabsContent value="completed" className="space-y-4 mt-4">
                        {completedTasks.length > 0 ? (
                            completedTasks.map((task) => <TaskCard key={task.id} task={task} />)
                        ) : (
                            <EmptyState message="No completed tasks" />
                        )}
                    </TabsContent>
                </Tabs>
            )}

            {/* Submit for Review Dialog */}
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-primary" />
                            Submit for Review
                        </DialogTitle>
                        <DialogDescription>
                            Submit "{selectedTask?.title}" for QC review.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-sm">
                                <strong>Points Value:</strong> {selectedTask?.pointsValue || 0} points
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Once approved, you'll earn these points.
                            </p>
                        </div>

                        {selectedTask?.revisionCount && selectedTask.revisionCount > 0 && (
                            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <p className="text-sm text-orange-600">
                                    This is revision #{selectedTask.revisionCount + 1}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Notes for Reviewer (Optional)</Label>
                            <Textarea
                                placeholder="Describe what you've done, any changes made, etc..."
                                value={submitNotes}
                                onChange={(e) => setSubmitNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitForReview}
                            disabled={submitForReview.isPending}
                        >
                            {submitForReview.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit for Review
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Empty state component
function EmptyState({ message = "No tasks found" }: { message?: string }) {
    return (
        <Card className="p-12 text-center">
            <Target className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold mt-4">{message}</h3>
            <p className="text-muted-foreground mt-2">
                Tasks assigned to you will appear here.
            </p>
        </Card>
    )
}