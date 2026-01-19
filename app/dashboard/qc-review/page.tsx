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
    getPriorityColor,
    type GranularTask,
} from "@/lib/hooks/use-granular-tasks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Search,
    Filter,
    MoreVertical,
    Eye,
    ThumbsUp,
    ThumbsDown,
    Calendar,
    Users,
    Target,
    Loader2,
    RefreshCw,
    Star,
    Minus,
    Plus,
    FileText,
    ArrowRight,
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

export default function QCReviewPage() {
    const { user } = useAuthStore()
    const router = useRouter()

    // State
    const [searchQuery, setSearchQuery] = useState("")
    const [priorityFilter, setPriorityFilter] = useState<string>("all")
    const [selectedTask, setSelectedTask] = useState<GranularTask | null>(null)
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

    // Form state
    const [approveNotes, setApproveNotes] = useState("")
    const [bonusPoints, setBonusPoints] = useState(0)
    const [rejectReason, setRejectReason] = useState("")
    const [pointsToDeduct, setPointsToDeduct] = useState(0)

    // Fetch pending tasks
    const { data: pendingTasks, isLoading, refetch } = useTasksPendingReview()

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
                    <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500" />
                    <h2 className="text-xl font-bold mt-4">Access Denied</h2>
                    <p className="text-muted-foreground mt-2">
                        Only QC Admins and Company Admins can access this page.
                    </p>
                    <Button className="mt-4" onClick={() => router.push("/dashboard")}>
                        Go to Dashboard
                    </Button>
                </Card>
            </div>
        )
    }

    // Filter tasks
    const filteredTasks = pendingTasks?.filter((task) => {
        const matchesSearch = searchQuery
            ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase())
            : true
        const matchesPriority = priorityFilter !== "all" ? task.priority === priorityFilter : true
        return matchesSearch && matchesPriority
    }) || []

    // Handle approve
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
            toast.success(`Task "${selectedTask.title}" approved! Points awarded.`)
            setIsApproveDialogOpen(false)
            setSelectedTask(null)
            setApproveNotes("")
            setBonusPoints(0)
        } catch (error: any) {
            toast.error(error?.message || "Failed to approve task")
        }
    }

    // Handle reject
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
            setSelectedTask(null)
            setRejectReason("")
            setPointsToDeduct(0)
        } catch (error: any) {
            toast.error(error?.message || "Failed to reject task")
        }
    }

    // Open approve dialog
    const openApproveDialog = (task: GranularTask) => {
        setSelectedTask(task)
        setApproveNotes("")
        setBonusPoints(0)
        setIsApproveDialogOpen(true)
    }

    // Open reject dialog
    const openRejectDialog = (task: GranularTask) => {
        setSelectedTask(task)
        setRejectReason("")
        setPointsToDeduct(0)
        setIsRejectDialogOpen(true)
    }

    // Open detail dialog
    const openDetailDialog = (task: GranularTask) => {
        setSelectedTask(task)
        setIsDetailDialogOpen(true)
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
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-40">
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
                <div className="space-y-4">
                    {filteredTasks.map((task) => (
                        <Card key={task.id} className="hover:border-primary/50 transition-colors">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    {/* Task Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold text-foreground truncate">
                                                {task.title}
                                            </h3>
                                            <Badge className={getPriorityColor(task.priority)}>
                                                {task.priority}
                                            </Badge>
                                            {task.revisionCount > 0 && (
                                                <Badge variant="outline" className="text-orange-500">
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
                                            <span className="flex items-center gap-1">
                                                <FileText className="h-3 w-3" />
                                                {task.subProject?.title}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ArrowRight className="h-3 w-3" />
                                                {task.subProject?.project?.name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Target className="h-3 w-3" />
                                                {task.pointsValue} pts
                                            </span>
                                            {task.submittedForReviewAt && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Submitted{" "}
                                                    {formatDistanceToNow(new Date(task.submittedForReviewAt), {
                                                        addSuffix: true,
                                                    })}
                                                </span>
                                            )}
                                        </div>

                                        {/* Assignees */}
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="text-sm text-muted-foreground">Assignees:</span>
                                            <div className="flex -space-x-2">
                                                {task.assignees?.slice(0, 3).map((assignee) => (
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
                                                {(task.assignees?.length || 0) > 3 && (
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        +{(task.assignees?.length || 0) - 3} more
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
                                    </div>

                                    {/* Actions */}
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
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
                    <h3 className="text-xl font-semibold mt-4">All caught up!</h3>
                    <p className="text-muted-foreground mt-2">
                        No tasks pending review at the moment.
                    </p>
                </Card>
            )}

            {/* Approve Dialog */}
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
                        <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-sm">
                                <strong>Base Points:</strong> {selectedTask?.pointsValue || 0} points
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Points will be split among {selectedTask?.assignees?.length || 1}{" "}
                                assignee(s)
                            </p>
                        </div>

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
                                        setBonusPoints(
                                            Math.min(50, Math.max(0, parseInt(e.target.value) || 0))
                                        )
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
                        </div>

                        <div className="space-y-2">
                            <Label>Feedback Notes (Optional)</Label>
                            <Textarea
                                placeholder="Great work! Well organized and tested..."
                                value={approveNotes}
                                onChange={(e) => setApproveNotes(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <p className="text-sm text-green-600 font-medium">
                                Total Points to Award:{" "}
                                {(selectedTask?.pointsValue || 0) + bonusPoints} points
                            </p>
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

            {/* Reject Dialog */}
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
                        {selectedTask && selectedTask.revisionCount > 0 && (
                            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <p className="text-sm text-orange-600">
                                    ⚠️ This task has already been revised {selectedTask.revisionCount}{" "}
                                    time(s)
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>
                                Reason for Rejection <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                placeholder="Please explain what needs to be fixed..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                                required
                            />
                        </div>

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
                                        setPointsToDeduct(
                                            Math.min(20, Math.max(0, parseInt(e.target.value) || 0))
                                        )
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
                                Points will be deducted from assignees
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

            {/* Task Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedTask?.title}</DialogTitle>
                        <DialogDescription>Task details and history</DialogDescription>
                    </DialogHeader>

                    {selectedTask && (
                        <div className="space-y-4 py-4">
                            {/* Status and Priority */}
                            <div className="flex items-center gap-2">
                                <Badge className={getTaskStatusColor(selectedTask.status)}>
                                    {selectedTask.status.replace("_", " ")}
                                </Badge>
                                <Badge className={getPriorityColor(selectedTask.priority)}>
                                    {selectedTask.priority}
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
                                    <p className="text-muted-foreground">{selectedTask.description}</p>
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
                                    <p className="text-muted-foreground">
                                        {selectedTask.subProject?.project?.name}
                                    </p>
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
                                            <div>
                                                <p className="font-medium">
                                                    {assignee.user.firstName} {assignee.user.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {assignee.user.email}
                                                </p>
                                            </div>
                                            {assignee.isCompleted && (
                                                <Badge className="ml-auto bg-green-500">Completed</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Revision History */}
                            {selectedTask.revisionCount > 0 && (
                                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                    <h4 className="font-medium text-orange-600 mb-1">
                                        Revision History
                                    </h4>
                                    <p className="text-sm text-orange-600">
                                        This task has been revised {selectedTask.revisionCount} time(s)
                                    </p>
                                    {selectedTask.reviewNotes && (
                                        <p className="text-sm mt-2">
                                            <strong>Last feedback:</strong> {selectedTask.reviewNotes}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
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