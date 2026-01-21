// app/dashboard/qc-review/page.tsx
"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from "next/navigation"
import {
    useTasksPendingReview,
    useApproveTask,
    useRejectTask,
    getTaskStatusColor,
    getTaskStatusBadgeColor,
    getPriorityColor,
    getTaskStatusLabel,
    getPriorityLabel,
} from "@/lib/hooks/use-granular-tasks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Search,
    Filter,
    Eye,
    ThumbsUp,
    ThumbsDown,
    Calendar,
    Target,
    Loader2,
    RefreshCw,
    Star,
    Minus,
    Plus,
    FileText,
    ArrowRight,
    Users,
    FolderKanban,
    Timer,
    ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import type { Task, Priority } from "@/lib/types/index"

export default function QCReviewPage() {
    const { user } = useAuthStore()
    const router = useRouter()

    // State
    const [searchQuery, setSearchQuery] = useState("")
    const [priorityFilter, setPriorityFilter] = useState<string>("all")
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

    // Form state for approval
    const [approveNotes, setApproveNotes] = useState("")
    const [bonusPoints, setBonusPoints] = useState(0)

    // Form state for rejection
    const [rejectReason, setRejectReason] = useState("")
    const [pointsToDeduct, setPointsToDeduct] = useState(0)

    // Fetch pending tasks - uses GET /tasks/pending-review endpoint
    // This endpoint is guarded by @Roles(UserRole.QC_ADMIN, UserRole.COMPANY)
    const { data: pendingTasks, isLoading, refetch, error } = useTasksPendingReview()

    // Mutations
    const approveTask = useApproveTask()
    const rejectTask = useRejectTask()

    // Check if user can review (QC_ADMIN or COMPANY)
    const canReview = user?.role === "QC_ADMIN" || user?.role === "COMPANY"

    // Redirect if not authorized
    if (!canReview) {
        return (
            <div className="p-6">
                <Card className="p-8 text-center">
                    <ShieldAlert className="h-12 w-12 mx-auto text-yellow-500" />
                    <h2 className="text-xl font-bold mt-4">Access Denied</h2>
                    <p className="text-muted-foreground mt-2">
                        Only QC Admins and Company Admins can access the QC Review dashboard.
                    </p>
                    <Button className="mt-4" onClick={() => router.push("/dashboard")}>
                        Go to Dashboard
                    </Button>
                </Card>
            </div>
        )
    }

    // Filter tasks by search and priority
    const filteredTasks = pendingTasks?.filter((task) => {
        const matchesSearch = searchQuery
            ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.subProject?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.subProject?.project?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            : true
        const matchesPriority = priorityFilter !== "all" ? task.priority === priorityFilter : true
        return matchesSearch && matchesPriority
    }) || []

    // Group by priority for quick stats
    const criticalTasks = filteredTasks.filter(t => t.priority === "CRITICAL" || t.priority === "URGENT")
    const highPriorityTasks = filteredTasks.filter(t => t.priority === "HIGH")
    const normalTasks = filteredTasks.filter(t => t.priority === "MEDIUM" || t.priority === "LOW")

    // Handle approve - uses PATCH /tasks/:id/approve endpoint
    const handleApprove = async () => {
        if (!selectedTask) return

        try {
            await approveTask.mutateAsync({
                id: selectedTask.id,
                data: {
                    notes: approveNotes || undefined,
                    bonusPoints: bonusPoints > 0 ? bonusPoints : undefined,
                },
            })

            const totalPoints = (selectedTask.pointsValue || 0) + bonusPoints
            toast.success(
                `Task "${selectedTask.title}" approved! ${totalPoints} points awarded to assignee(s).`
            )
            setIsApproveDialogOpen(false)
            resetApproveForm()
        } catch (error: any) {
            toast.error(error?.message || "Failed to approve task")
        }
    }

    // Handle reject - uses PATCH /tasks/:id/reject endpoint
    const handleReject = async () => {
        if (!selectedTask) return

        if (!rejectReason.trim()) {
            toast.error("Please provide a reason for rejection")
            return
        }

        try {
            await rejectTask.mutateAsync({
                id: selectedTask.id,
                data: {
                    reason: rejectReason,
                    pointsToDeduct: pointsToDeduct > 0 ? pointsToDeduct : undefined,
                },
            })
            toast.success(`Task "${selectedTask.title}" sent back for revision.`)
            setIsRejectDialogOpen(false)
            resetRejectForm()
        } catch (error: any) {
            toast.error(error?.message || "Failed to reject task")
        }
    }

    const resetApproveForm = () => {
        setSelectedTask(null)
        setApproveNotes("")
        setBonusPoints(0)
    }

    const resetRejectForm = () => {
        setSelectedTask(null)
        setRejectReason("")
        setPointsToDeduct(0)
    }

    // Open approve dialog
    const openApproveDialog = (task: Task) => {
        setSelectedTask(task)
        setApproveNotes("")
        setBonusPoints(0)
        setIsApproveDialogOpen(true)
    }

    // Open reject dialog
    const openRejectDialog = (task: Task) => {
        setSelectedTask(task)
        setRejectReason("")
        setPointsToDeduct(0)
        setIsRejectDialogOpen(true)
    }

    // Open detail dialog
    const openDetailDialog = (task: Task) => {
        setSelectedTask(task)
        setIsDetailDialogOpen(true)
    }

    // Task Card Component
    const TaskCard = ({ task }: { task: Task }) => {
        const isRevision = (task.revisionCount || 0) > 0
        const waitTime = task.submittedForReviewAt
            ? formatDistanceToNow(new Date(task.submittedForReviewAt), { addSuffix: true })
            : "Unknown"

        return (
            <Card className={`hover:border-primary/50 transition-colors ${isRevision ? "border-orange-500/30" : ""}`}>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                        {/* Task Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-foreground truncate">
                                    {task.title}
                                </h3>
                                <Badge className={getPriorityColor(task.priority)}>
                                    {getPriorityLabel(task.priority)}
                                </Badge>
                                {isRevision && (
                                    <Badge variant="outline" className="text-orange-500 border-orange-500">
                                        Revision #{task.revisionCount}
                                    </Badge>
                                )}
                            </div>

                            {task.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {task.description}
                                </p>
                            )}

                            {/* Meta info */}
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                                {task.subProject?.project && (
                                    <Link
                                        href={`/dashboard/projects/${task.subProject.project.id}`}
                                        className="flex items-center gap-1 hover:text-primary transition-colors"
                                    >
                                        <FolderKanban className="h-3 w-3" />
                                        {task.subProject.project.name}
                                    </Link>
                                )}
                                {task.subProject && (
                                    <span className="flex items-center gap-1">
                                        <ArrowRight className="h-3 w-3" />
                                        {task.subProject.title}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3" />
                                    {task.pointsValue} pts
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Submitted {waitTime}
                                </span>
                            </div>

                            {/* Assignees */}
                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-sm text-muted-foreground">Assignees:</span>
                                <div className="flex -space-x-2">
                                    {task.assignees?.slice(0, 4).map((assignee) => (
                                        <Avatar
                                            key={assignee.id}
                                            className="h-6 w-6 border-2 border-background"
                                        >
                                            <AvatarImage src={assignee.user.avatar || ""} />
                                            <AvatarFallback className="text-xs">
                                                {assignee.user.firstName?.[0]}
                                                {assignee.user.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                    ))}
                                    {(task.assignees?.length || 0) > 4 && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                            +{(task.assignees?.length || 0) - 4} more
                                        </span>
                                    )}
                                </div>
                                {task.submittedForReviewBy && (
                                    <span className="text-sm text-muted-foreground ml-4">
                                        Submitted by: {task.submittedForReviewBy.firstName}{" "}
                                        {task.submittedForReviewBy.lastName}
                                    </span>
                                )}
                            </div>

                            {/* Previous revision feedback if any */}
                            {isRevision && task.reviewNotes && (
                                <div className="mt-3 p-2 rounded bg-orange-500/10 border border-orange-500/20">
                                    <p className="text-xs text-orange-600">
                                        <strong>Previous feedback:</strong> {task.reviewNotes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openDetailDialog(task)}
                                >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                </Button>
                                <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => openApproveDialog(task)}
                                >
                                    <ThumbsUp className="h-4 w-4 mr-1" />
                                    Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => openRejectDialog(task)}
                                >
                                    <ThumbsDown className="h-4 w-4 mr-1" />
                                    Reject
                                </Button>
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
                        <ClipboardCheck className="h-7 w-7 text-orange-500" />
                        QC Review Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Review and approve tasks submitted by team members
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-orange-500 border-orange-500">
                        {filteredTasks.length} pending
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Pending</p>
                                <p className="text-2xl font-bold text-orange-500">{filteredTasks.length}</p>
                            </div>
                            <Timer className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className={criticalTasks.length > 0 ? "border-red-500/50" : ""}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Critical/Urgent</p>
                                <p className={`text-2xl font-bold ${criticalTasks.length > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                                    {criticalTasks.length}
                                </p>
                            </div>
                            <AlertTriangle className={`h-8 w-8 ${criticalTasks.length > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">High Priority</p>
                                <p className="text-2xl font-bold text-orange-500">{highPriorityTasks.length}</p>
                            </div>
                            <Target className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Normal</p>
                                <p className="text-2xl font-bold text-muted-foreground">{normalTasks.length}</p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks, projects, subprojects..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-44">
                        <Filter className="h-4 w-4 mr-2" />
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

            {/* Tasks List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            ) : filteredTasks.length > 0 ? (
                <Tabs defaultValue="all" className="w-full">
                    <TabsList>
                        <TabsTrigger value="all">All ({filteredTasks.length})</TabsTrigger>
                        {criticalTasks.length > 0 && (
                            <TabsTrigger value="critical" className="text-red-500">
                                🔴 Critical/Urgent ({criticalTasks.length})
                            </TabsTrigger>
                        )}
                        {highPriorityTasks.length > 0 && (
                            <TabsTrigger value="high">High ({highPriorityTasks.length})</TabsTrigger>
                        )}
                        <TabsTrigger value="normal">Normal ({normalTasks.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-4 mt-4">
                        {filteredTasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                    </TabsContent>

                    <TabsContent value="critical" className="space-y-4 mt-4">
                        {criticalTasks.length > 0 && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Critical Tasks</AlertTitle>
                                <AlertDescription>
                                    These tasks require immediate attention.
                                </AlertDescription>
                            </Alert>
                        )}
                        {criticalTasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                    </TabsContent>

                    <TabsContent value="high" className="space-y-4 mt-4">
                        {highPriorityTasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                    </TabsContent>

                    <TabsContent value="normal" className="space-y-4 mt-4">
                        {normalTasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                    </TabsContent>
                </Tabs>
            ) : (
                <Card className="p-12 text-center">
                    <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
                    <h3 className="text-xl font-semibold mt-4">All caught up!</h3>
                    <p className="text-muted-foreground mt-2">
                        No tasks pending review at the moment.
                    </p>
                </Card>
            )}

            {/* ============================================ */}
            {/* APPROVE DIALOG */}
            {/* ============================================ */}
            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            Approve Task
                        </DialogTitle>
                        <DialogDescription>
                            Approve "{selectedTask?.title}" and award points to assignees.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Points info */}
                        <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-sm">
                                <strong>Base Points:</strong> {selectedTask?.pointsValue || 0} points
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Points will be split among {selectedTask?.assignees?.length || 1}{" "}
                                assignee(s)
                            </p>
                        </div>

                        {/* Bonus points */}
                        <div className="space-y-2">
                            <Label>Bonus Points (Optional)</Label>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setBonusPoints(Math.max(0, bonusPoints - 5))}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                    type="number"
                                    className="w-20 text-center"
                                    value={bonusPoints}
                                    onChange={(e) =>
                                        setBonusPoints(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))
                                    }
                                    min={0}
                                    max={50}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setBonusPoints(Math.min(50, bonusPoints + 5))}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground">Max: 50</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Award bonus points for exceptional work
                            </p>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label>Feedback Notes (Optional)</Label>
                            <Textarea
                                placeholder="Great work! Well organized and tested..."
                                value={approveNotes}
                                onChange={(e) => setApproveNotes(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Summary */}
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <p className="text-sm text-green-600 font-medium">
                                Total Points to Award:{" "}
                                {(selectedTask?.pointsValue || 0) + bonusPoints} points
                            </p>
                            {(selectedTask?.assignees?.length || 1) > 1 && (
                                <p className="text-xs text-green-500 mt-1">
                                    ~{Math.floor(((selectedTask?.pointsValue || 0) + bonusPoints) / (selectedTask?.assignees?.length || 1))} points per assignee
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleApprove}
                            disabled={approveTask.isPending}
                        >
                            {approveTask.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Approving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Approve Task
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ============================================ */}
            {/* REJECT DIALOG */}
            {/* ============================================ */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            Request Revision
                        </DialogTitle>
                        <DialogDescription>
                            Send "{selectedTask?.title}" back for revision with feedback.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Revision warning */}
                        {selectedTask && (selectedTask.revisionCount || 0) > 0 && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Multiple Revisions</AlertTitle>
                                <AlertDescription>
                                    This task has already been revised {selectedTask.revisionCount} time(s).
                                    Consider providing more detailed feedback.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Reason - REQUIRED */}
                        <div className="space-y-2">
                            <Label>
                                Reason for Rejection <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                placeholder="Please explain what needs to be fixed or improved..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Be specific so the assignee knows what to fix
                            </p>
                        </div>

                        {/* Points deduction */}
                        <div className="space-y-2">
                            <Label>Points to Deduct (Optional)</Label>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPointsToDeduct(Math.max(0, pointsToDeduct - 2))}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                    type="number"
                                    className="w-20 text-center"
                                    value={pointsToDeduct}
                                    onChange={(e) =>
                                        setPointsToDeduct(Math.min(20, Math.max(0, parseInt(e.target.value) || 0)))
                                    }
                                    min={0}
                                    max={20}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPointsToDeduct(Math.min(20, pointsToDeduct + 2))}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground">Max: 20</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Points will be deducted from assignees (use sparingly)
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={rejectTask.isPending || !rejectReason.trim()}
                        >
                            {rejectTask.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Request Revision
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ============================================ */}
            {/* TASK DETAIL DIALOG */}
            {/* ============================================ */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedTask?.title}</DialogTitle>
                        <DialogDescription>Task details and history</DialogDescription>
                    </DialogHeader>

                    {selectedTask && (
                        <div className="space-y-4 py-4">
                            {/* Status and Priority */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={getTaskStatusBadgeColor(selectedTask.status)}>
                                    {getTaskStatusLabel(selectedTask.status)}
                                </Badge>
                                <Badge className={getPriorityColor(selectedTask.priority)}>
                                    {getPriorityLabel(selectedTask.priority)}
                                </Badge>
                                <Badge variant="outline">
                                    <Star className="h-3 w-3 mr-1" />
                                    {selectedTask.pointsValue} pts
                                </Badge>
                            </div>

                            {/* Description */}
                            {selectedTask.description && (
                                <div>
                                    <h4 className="font-medium mb-1">Description</h4>
                                    <p className="text-muted-foreground whitespace-pre-wrap">
                                        {selectedTask.description}
                                    </p>
                                </div>
                            )}

                            {/* Project Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium mb-1">SubProject</h4>
                                    <p className="text-muted-foreground">
                                        {selectedTask.subProject?.title}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1">Project</h4>
                                    <Link
                                        href={`/dashboard/projects/${selectedTask.subProject?.project?.id}`}
                                        className="text-primary hover:underline"
                                    >
                                        {selectedTask.subProject?.project?.name}
                                    </Link>
                                </div>
                            </div>

                            {/* Assignees */}
                            <div>
                                <h4 className="font-medium mb-2">Assignees</h4>
                                <div className="space-y-2">
                                    {selectedTask.assignees?.map((assignee) => (
                                        <div
                                            key={assignee.id}
                                            className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={assignee.user.avatar || ""} />
                                                <AvatarFallback>
                                                    {assignee.user.firstName?.[0]}
                                                    {assignee.user.lastName?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {assignee.user.firstName} {assignee.user.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {assignee.user.email}
                                                </p>
                                            </div>
                                            {assignee.isCompleted && (
                                                <Badge className="bg-green-500">Marked Complete</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Revision History */}
                            {(selectedTask.revisionCount || 0) > 0 && (
                                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                    <h4 className="font-medium text-orange-600 mb-1">
                                        Revision History
                                    </h4>
                                    <p className="text-sm text-orange-600">
                                        This task has been revised {selectedTask.revisionCount} time(s)
                                    </p>
                                    {selectedTask.reviewNotes && (
                                        <p className="text-sm mt-2">
                                            <strong>Previous feedback:</strong> {selectedTask.reviewNotes}
                                        </p>
                                    )}
                                    {(selectedTask.pointsDeducted || 0) > 0 && (
                                        <p className="text-sm text-red-500 mt-1">
                                            Points deducted so far: {selectedTask.pointsDeducted}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                                <div>
                                    <span className="text-muted-foreground">Created:</span>{" "}
                                    {new Date(selectedTask.createdAt).toLocaleString()}
                                </div>
                                {selectedTask.dueDate && (
                                    <div>
                                        <span className="text-muted-foreground">Due:</span>{" "}
                                        {new Date(selectedTask.dueDate).toLocaleDateString()}
                                    </div>
                                )}
                                {selectedTask.submittedForReviewAt && (
                                    <div>
                                        <span className="text-muted-foreground">Submitted:</span>{" "}
                                        {new Date(selectedTask.submittedForReviewAt).toLocaleString()}
                                    </div>
                                )}
                                {selectedTask.estimatedMinutes && (
                                    <div>
                                        <span className="text-muted-foreground">Estimated:</span>{" "}
                                        {selectedTask.estimatedMinutes} minutes
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                            Close
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                                setIsDetailDialogOpen(false)
                                if (selectedTask) openApproveDialog(selectedTask)
                            }}
                        >
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            Approve
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setIsDetailDialogOpen(false)
                                if (selectedTask) openRejectDialog(selectedTask)
                            }}
                        >
                            <ThumbsDown className="h-4 w-4 mr-2" />
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}