// app/dashboard/departments/[id]/page.tsx
"use client"

import { use, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
  useDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useAssignUsersToDepartment,
  useRemoveUsersFromDepartment,
  useLinkProjectsToDepartment,
  useUnlinkProjectsFromDepartment,
  useAvailableProjects,
  useAvailableUsers,
} from "@/lib/hooks/use-departments"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Building2,
  Users,
  FolderKanban,
  Clock,
  Trophy,
  Crown,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Link as LinkIcon,
  Unlink,
  Target,
  TrendingUp,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Settings,
  Plus,
  Eye,
  ExternalLink,
  DollarSign,
  ImageIcon,
} from "lucide-react"
import { toast } from "sonner"
import type { User } from "@/lib/types/index"

import { ImageUpload } from "@/components/ui/image-upload"
import { useUploadDepartmentLogo, useRemoveDepartmentLogo } from "@/lib/hooks/use-departments"
import { BASE_URL } from "@/lib/api/request"

export default function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()

  // Get initial tab from URL
  const initialTab = searchParams.get("tab") || "overview"
  const [activeTab, setActiveTab] = useState(initialTab)

  // Dialog states
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isLinkProjectOpen, setIsLinkProjectOpen] = useState(false)
  const [isRemoveMemberOpen, setIsRemoveMemberOpen] = useState(false)
  const [isUnlinkProjectOpen, setIsUnlinkProjectOpen] = useState(false)

  // Selected items
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])

  // Edit form
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    tag: "",
    leadId: "",
    startDate: "",
    endDate: "",
  })

  // Check permissions
  const isCompanyAdmin = user?.role === "COMPANY"

  // Fetch data
  const { data: department, isLoading, error } = useDepartment(id)
  const { data: availableProjects } = useAvailableProjects(id)
  const { data: availableUsers } = useAvailableUsers(id)

  // Mutations
  const updateDepartment = useUpdateDepartment()
  const deleteDepartment = useDeleteDepartment()
  const assignUsers = useAssignUsersToDepartment()
  const removeUsers = useRemoveUsersFromDepartment()
  const linkProjects = useLinkProjectsToDepartment()
  const unlinkProjects = useUnlinkProjectsFromDepartment()
  const uploadDepartmentLogo = useUploadDepartmentLogo()
  const removeDepartmentLogo = useRemoveDepartmentLogo()

  // 3. ADD this state for logo handling:
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // 4. ADD this handler function:
  const handleLogoUpload = async (file: File | null) => {
    if (!file) return

    try {
      await uploadDepartmentLogo.mutateAsync({
        id,
        file,
      })
      toast.success("Department logo updated!")
    } catch (error: any) {
      toast.error(error.message || "Failed to upload logo")
    }
  }

  const handleRemoveLogo = async () => {
    try {
      await removeDepartmentLogo.mutateAsync(id)
      toast.success("Logo removed!")
    } catch (error: any) {
      toast.error(error.message || "Failed to remove logo")
    }
  }

  // Initialize edit form when department loads
  useEffect(() => {
    if (department) {
      setEditForm({
        name: department.name,
        description: department.description || "",
        tag: department.tag || "#2563eb",
        leadId: department.leadId || "",
        startDate: department.startDate?.split("T")[0] || "",
        endDate: department.endDate?.split("T")[0] || "",
      })
    }
  }, [department])

  // Handlers
  const handleUpdateDepartment = async () => {
    if (!editForm.name.trim()) {
      toast.error("Department name is required")
      return
    }

    try {
      await updateDepartment.mutateAsync({
        id,
        data: {
          name: editForm.name,
          description: editForm.description || undefined,
          tag: editForm.tag || undefined,
          leadId: editForm.leadId || undefined,
          startDate: editForm.startDate || undefined,
          endDate: editForm.endDate || undefined,
        },
      })
      toast.success("Department updated!")
      setIsEditOpen(false)
    } catch (error) {
      toast.error("Failed to update department")
    }
  }

  const handleDeleteDepartment = async () => {
    try {
      await deleteDepartment.mutateAsync(id)
      toast.success("Department deleted!")
      router.push("/dashboard/departments")
    } catch (error) {
      toast.error("Failed to delete department")
    }
  }

  const handleAddMembers = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one user")
      return
    }

    try {
      await assignUsers.mutateAsync({ id, userIds: selectedUserIds })
      toast.success(`${selectedUserIds.length} member(s) added!`)
      setIsAddMemberOpen(false)
      setSelectedUserIds([])
    } catch (error) {
      toast.error("Failed to add members")
    }
  }

  const handleRemoveMember = async () => {
    if (!selectedUser) return

    try {
      await removeUsers.mutateAsync({ id, userIds: [selectedUser.id] })
      toast.success("Member removed!")
      setIsRemoveMemberOpen(false)
      setSelectedUser(null)
    } catch (error) {
      toast.error("Failed to remove member")
    }
  }

  const handleLinkProjects = async () => {
    if (selectedProjectIds.length === 0) {
      toast.error("Please select at least one project")
      return
    }

    try {
      await linkProjects.mutateAsync({ id, projectIds: selectedProjectIds })
      toast.success(`${selectedProjectIds.length} project(s) linked!`)
      setIsLinkProjectOpen(false)
      setSelectedProjectIds([])
    } catch (error) {
      toast.error("Failed to link projects")
    }
  }

  const handleUnlinkProject = async () => {
    if (!selectedProject) return

    try {
      await unlinkProjects.mutateAsync({ id, projectIds: [selectedProject.projectId] })
      toast.success("Project unlinked!")
      setIsUnlinkProjectOpen(false)
      setSelectedProject(null)
    } catch (error) {
      toast.error("Failed to unlink project")
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const projectStatusColors: Record<string, string> = {
    PLANNING: "text-yellow-500 border-yellow-500 bg-yellow-500/10",
    IN_PROGRESS: "text-blue-500 border-blue-500 bg-blue-500/10",
    ON_HOLD: "text-orange-500 border-orange-500 bg-orange-500/10",
    COMPLETED: "text-green-500 border-green-500 bg-green-500/10",
    CANCELLED: "text-red-500 border-red-500 bg-red-500/10",
  }

  const roleColors: Record<string, string> = {
    COMPANY: "bg-yellow-500 text-white",
    QC_ADMIN: "bg-blue-500 text-white",
    USER: "bg-gray-500 text-white",
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  // Error state
  if (error || !department) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Departments
        </Button>
        <Card className="p-8 text-center">
          <p className="text-destructive">Department not found or you don't have access.</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard/departments")}>
            Go to Departments
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" className="cursor-pointer" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Departments
      </Button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: department.tag || "#888" }}
          >
            <Building2 className="h-6 w-6 text-white" />
          </div> */}
          {department.logo ? (
            <Avatar className="h-12 w-12 rounded-lg">
              <AvatarImage src={department.logo} className="object-cover" />
              <AvatarFallback className="rounded-lg" style={{ backgroundColor: department.tag || "#888" }}>
                {department.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: department.tag || "#888" }}
            >
              <Building2 className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{department.name}</h1>
            {department.description && (
              <p className="text-muted-foreground mt-1 max-w-2xl">
                {department.description}
              </p>
            )}
            {department.lead && (
              <div className="flex items-center gap-2 mt-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <Avatar className="h-6 w-6">
                  <AvatarImage src={department.lead.avatar || ""} />
                  <AvatarFallback className="text-xs">
                    {department.lead.firstName?.[0]}{department.lead.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  {department.lead.firstName} {department.lead.lastName}
                </span>
                <Badge variant="secondary" className="text-xs">Head</Badge>
              </div>
            )}
          </div>
        </div>
        {isCompanyAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="cursor-pointer" onClick={() => setIsEditOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="cursor-pointer">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsAddMemberOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsLinkProjectOpen(true)}>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Link Projects
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Department
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-blue-500" />
            <p className="text-2xl font-bold mt-2">{department.stats?.totalMembers || 0}</p>
            <p className="text-sm text-muted-foreground">Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FolderKanban className="h-8 w-8 mx-auto text-purple-500" />
            <p className="text-2xl font-bold mt-2">{department.stats?.totalProjects || 0}</p>
            <p className="text-sm text-muted-foreground">Projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto text-green-500" />
            <p className="text-2xl font-bold mt-2">{department.stats?.completionRate || 0}%</p>
            <p className="text-sm text-muted-foreground">Completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-orange-500" />
            <p className="text-2xl font-bold mt-2">{department.stats?.totalTimeHours || 0}h</p>
            <p className="text-sm text-muted-foreground">Hours Logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto text-yellow-500" />
            <p className="text-2xl font-bold mt-2">{department.stats?.totalPoints || 0}</p>
            <p className="text-sm text-muted-foreground">Total Points</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects ({department.stats?.totalProjects || 0})</TabsTrigger>
          <TabsTrigger value="members">Members ({department.stats?.totalMembers || 0})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Task Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Task Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Tasks</span>
                  <span className="font-bold">{department.stats?.totalTasks || 0}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      Completed
                    </span>
                    <span>{department.stats?.completedTasks || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      In Progress
                    </span>
                    <span>{department.stats?.inProgressTasks || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      To Do
                    </span>
                    <span>{department.stats?.todoTasks || 0}</span>
                  </div>
                </div>
                <Progress value={department.stats?.completionRate || 0} className="h-2" />
              </CardContent>
            </Card>

            {/* Team Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Team Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">
                      {department.stats?.avgPointsPerMember || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Points/Member</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">
                      {department.stats?.activeMembers || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Active Members</p>
                  </div>
                </div>

                {/* Top Performers */}
                <div>
                  <p className="text-sm font-medium mb-2">Top Performers</p>
                  <div className="space-y-2">
                    {department.users?.slice(0, 3).map((member, index) => (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? "bg-yellow-500 text-white" :
                            index === 1 ? "bg-gray-400 text-white" :
                              "bg-amber-600 text-white"
                            }`}>
                            {index + 1}
                          </span>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar || ""} />
                            <AvatarFallback className="text-xs">
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member.firstName} {member.lastName}</span>
                        </div>
                        <span className="text-sm font-medium">{member.points || 0} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Linked Projects
              </CardTitle>
              {isCompanyAdmin && (
                <Button variant="outline" size="sm" onClick={() => setIsLinkProjectOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Link Project
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {department.projects && department.projects.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {department.projects.slice(0, 6).map((dp) => (
                    <Card key={dp.id} className="hover:border-primary transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/dashboard/projects/${dp.project.id}`}
                              className="font-medium hover:underline line-clamp-1"
                            >
                              {dp.project.name}
                            </Link>
                            <Badge
                              variant="outline"
                              className={`mt-1 ${projectStatusColors[dp.project.status]}`}
                            >
                              {dp.project.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {dp.project._count?.members || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {dp.project._count?.subProjects || 0} tasks
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No projects linked yet</p>
                  {isCompanyAdmin && (
                    <Button className="mt-4" onClick={() => setIsLinkProjectOpen(true)}>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Link Project
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Linked Projects</h3>
            {isCompanyAdmin && (
              <Button onClick={() => setIsLinkProjectOpen(true)}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Link Project
              </Button>
            )}
          </div>

          {department.projects && department.projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {department.projects.map((dp) => (
                <Card key={dp.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/projects/${dp.project.id}`}
                            className="font-medium hover:underline"
                          >
                            {dp.project.name}
                          </Link>
                          <Badge
                            variant="outline"
                            className={projectStatusColors[dp.project.status]}
                          >
                            {dp.project.status.replace("_", " ")}
                          </Badge>
                        </div>
                        {dp.project.projectLead && (
                          <div className="flex items-center gap-2 mt-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={dp.project.projectLead.avatar || ""} />
                              <AvatarFallback className="text-xs">
                                {dp.project.projectLead.firstName?.[0]}
                                {dp.project.projectLead.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {dp.project.projectLead.firstName} {dp.project.projectLead.lastName}
                            </span>
                          </div>
                        )}
                      </div>
                      {isCompanyAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/projects/${dp.project.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Project
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedProject(dp)
                                setIsUnlinkProjectOpen(true)
                              }}
                            >
                              <Unlink className="h-4 w-4 mr-2" />
                              Unlink
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {dp.project._count?.members || 0} members
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {dp.project._count?.subProjects || 0} tasks
                      </span>
                    </div>
                    {dp.assignedBy && (
                      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                        Linked by {dp.assignedBy.firstName} {dp.assignedBy.lastName} on{" "}
                        {new Date(dp.assignedAt).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No projects linked to this department</p>
              {isCompanyAdmin && (
                <Button className="mt-4" onClick={() => setIsLinkProjectOpen(true)}>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Link Project
                </Button>
              )}
            </Card>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Department Members</h3>
            {isCompanyAdmin && (
              <Button onClick={() => setIsAddMemberOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            )}
          </div>

          {department.users && department.users.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {department.users.map((member) => {
                const isHead = department.leadId === member.id
                return (
                  <Card key={member.id} className={isHead ? "border-yellow-500/50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar || ""} />
                            <AvatarFallback>
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {member.firstName} {member.lastName}
                              </p>
                              {isHead && <Crown className="h-4 w-4 text-yellow-500" />}
                            </div>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        {isCompanyAdmin && !isHead && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditForm(prev => ({ ...prev, leadId: member.id }))
                                  handleUpdateDepartment()
                                }}
                              >
                                <Crown className="h-4 w-4 mr-2" />
                                Make Head
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedUser(member as User)
                                  setIsRemoveMemberOpen(true)
                                }}
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Badge className={roleColors[member.role] || "bg-gray-500"}>
                            {member.role.replace("_", " ")}
                          </Badge>
                          {!member.isActive && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {member.points || 0} pts
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No members in this department</p>
              {isCompanyAdmin && (
                <Button className="mt-4" onClick={() => setIsAddMemberOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              )}
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {isCompanyAdmin ? (
            <>
              {/* Department Logo Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Department Logo
                  </CardTitle>
                  <CardDescription>
                    Upload a logo for this department
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <ImageUpload
                      value={department.logo}
                      onChange={handleLogoUpload}
                      onRemove={handleRemoveLogo}
                      isUploading={uploadDepartmentLogo.isPending}
                      fallback={department.name?.substring(0, 2).toUpperCase() || "DP"}
                      shape="square"
                      size="lg"
                    />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Current Logo</p>
                      <p className="text-xs text-muted-foreground">
                        Recommended: 128x128px or larger, PNG or SVG format
                      </p>
                      {department.logo && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveLogo}
                          disabled={removeDepartmentLogo.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          {removeDepartmentLogo.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Remove Logo
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Department Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Settings</CardTitle>
                  <CardDescription>Manage department configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Department Name</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color Tag</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editForm.tag}
                          onChange={(e) => setEditForm(prev => ({ ...prev, tag: e.target.value }))}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={editForm.tag}
                          onChange={(e) => setEditForm(prev => ({ ...prev, tag: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      rows={3}
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department Head</Label>
                    <Select
                      value={editForm.leadId || "none"}
                      onValueChange={(value) => setEditForm(prev => ({
                        ...prev,
                        leadId: value === "none" ? "" : value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select head" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Head</SelectItem>
                        {department.users?.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.firstName} {u.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    onClick={handleUpdateDepartment}
                    disabled={updateDepartment.isPending}
                  >
                    {updateDepartment.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="p-8 text-center">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                Only company administrators can modify department settings
              </p>
            </Card>
          )}

          {/* Danger Zone */}
          {isCompanyAdmin && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Department
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>



      </Tabs>

      {/* Edit Department Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update department information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Department Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color Tag</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editForm.tag}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tag: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={editForm.tag}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tag: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Department Head</Label>
                <Select
                  value={editForm.leadId || "none"}
                  onValueChange={(value) => setEditForm(prev => ({
                    ...prev,
                    leadId: value === "none" ? "" : value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select head" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Head</SelectItem>
                    {department.users?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full  hover-lift cursor-pointer border-sidebar-border border"
              onClick={handleUpdateDepartment}
              disabled={updateDepartment.isPending}
            >
              {updateDepartment.isPending ? (
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

      {/* Add Members Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Members</DialogTitle>
            <DialogDescription>Select users to add to this department</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
              {availableUsers && availableUsers.length > 0 ? (
                availableUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id)
                  return (
                    <div
                      key={u.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-muted"
                        }`}
                      onClick={() => toggleUserSelection(u.id)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar || ""} />
                        <AvatarFallback className="text-xs">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      {u.department && (
                        <Badge variant="outline" className="text-xs">
                          {u.department.name}
                        </Badge>
                      )}
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No available users to add
                </p>
              )}
            </div>
            {selectedUserIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedUserIds.length} user(s) selected
              </p>
            )}
            <Button
              className="w-full"
              onClick={handleAddMembers}
              disabled={assignUsers.isPending || selectedUserIds.length === 0}
            >
              {assignUsers.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add ${selectedUserIds.length || ""} Member(s)`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Projects Dialog */}
      <Dialog open={isLinkProjectOpen} onOpenChange={setIsLinkProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Projects</DialogTitle>
            <DialogDescription>Select projects to link to this department</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
              {availableProjects && availableProjects.length > 0 ? (
                availableProjects.map((project) => {
                  const isSelected = selectedProjectIds.includes(project.id)
                  return (
                    <div
                      key={project.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-muted"
                        }`}
                      onClick={() => toggleProjectSelection(project.id)}
                    >
                      <FolderKanban className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{project.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${projectStatusColors[project.status]}`}
                          >
                            {project.status.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {project._count?.members || 0} members
                          </span>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No available projects to link
                </p>
              )}
            </div>
            {selectedProjectIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedProjectIds.length} project(s) selected
              </p>
            )}
            <Button
              className="w-full"
              onClick={handleLinkProjects}
              disabled={linkProjects.isPending || selectedProjectIds.length === 0}
            >
              {linkProjects.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Linking...
                </>
              ) : (
                `Link ${selectedProjectIds.length || ""} Project(s)`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <AlertDialog open={isRemoveMemberOpen} onOpenChange={setIsRemoveMemberOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedUser?.firstName} {selectedUser?.lastName} from this department?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemoveMember}
            >
              {removeUsers.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlink Project Dialog */}
      <AlertDialog open={isUnlinkProjectOpen} onOpenChange={setIsUnlinkProjectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Project?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink "{selectedProject?.project?.name}" from this department?
              The project will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleUnlinkProject}
            >
              {unlinkProjects.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Unlink"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Department Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete "{department.name}" and remove all members from it.
              Projects will be unlinked but not deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteDepartment}
            >
              {deleteDepartment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}