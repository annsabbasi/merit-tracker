// app/dashboard/departments/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
  useDepartments,
  useCreateDepartment,
  useDeleteDepartment,
} from "@/lib/hooks/use-departments"
import { useUsers } from "@/lib/hooks/use-users"
import { useProjects } from "@/lib/hooks/use-projects"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Search,
  Plus,
  Building2,
  Users,
  FolderKanban,
  Clock,
  Trophy,
  Crown,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  CheckCircle2,
  Loader2,
  Target,
  BarChart3,
} from "lucide-react"
import { toast } from "sonner"
import type { DepartmentWithStats } from "@/lib/hooks/use-departments"

export default function DepartmentsPage() {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentWithStats | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tag: "#2563eb",
    leadId: "",
    startDate: "",
    endDate: "",
    memberIds: [] as string[],
    projectIds: [] as string[],
  })

  // Check permissions - only COMPANY_ADMIN can manage departments
  const isCompanyAdmin = user?.role === "COMPANY_ADMIN"

  // Fetch data
  const { data: departments, isLoading: departmentsLoading } = useDepartments({
    search: searchQuery || undefined,
  })
  const { data: users } = useUsers()
  const { data: projects } = useProjects()

  // Mutations
  const createDepartment = useCreateDepartment()
  const deleteDepartment = useDeleteDepartment()

  // Filter departments based on search
  const filteredDepartments = departments?.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  // Handlers
  const handleCreateDepartment = async () => {
    if (!formData.name.trim()) {
      toast.error("Department name is required")
      return
    }

    try {
      await createDepartment.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        tag: formData.tag || undefined,
        leadId: formData.leadId || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        memberIds: formData.memberIds.length > 0 ? formData.memberIds : undefined,
        projectIds: formData.projectIds.length > 0 ? formData.projectIds : undefined,
      })
      toast.success("Department created successfully!")
      setIsCreateOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to create department")
    }
  }

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return

    try {
      await deleteDepartment.mutateAsync(selectedDepartment.id)
      toast.success("Department deleted!")
      setIsDeleteOpen(false)
      setSelectedDepartment(null)
    } catch (error) {
      toast.error("Failed to delete department")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      tag: "#2563eb",
      leadId: "",
      startDate: "",
      endDate: "",
      memberIds: [],
      projectIds: [],
    })
  }

  const toggleMember = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId]
    }))
  }

  const toggleProject = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      projectIds: prev.projectIds.includes(projectId)
        ? prev.projectIds.filter(id => id !== projectId)
        : [...prev.projectIds, projectId]
    }))
  }

  // Calculate overall stats
  const overallStats = {
    totalDepartments: departments?.length || 0,
    totalMembers: departments?.reduce((sum, d) => sum + (d.stats?.totalMembers || 0), 0) || 0,
    totalProjects: departments?.reduce((sum, d) => sum + (d.stats?.totalProjects || 0), 0) || 0,
    avgCompletionRate: departments && departments.length > 0
      ? Math.round(departments.reduce((sum, d) => sum + (d.stats?.completionRate || 0), 0) / departments.length)
      : 0,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Departments</h1>
          <p className="text-muted-foreground">Manage your organization's departments and teams</p>
        </div>
        {isCompanyAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Department
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Department</DialogTitle>
                <DialogDescription>
                  Set up a new department with a head, members, and linked projects
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Department Name *</Label>
                    <Input
                      placeholder="e.g., Engineering"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe the department's purpose..."
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color Tag</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.tag}
                        onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={formData.tag}
                        onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Department Head</Label>
                    <Select
                      value={formData.leadId || "none"}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        leadId: value === "none" ? "" : value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select head" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Head Selected</SelectItem>
                        {users?.filter(u => u.isActive).map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={u.avatar || ""} />
                                <AvatarFallback className="text-xs">
                                  {u.firstName?.[0]}{u.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              {u.firstName} {u.lastName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Members Selection */}
                <div className="space-y-2">
                  <Label>Initial Members</Label>
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {users?.filter(u => u.isActive).map((u) => {
                      const isSelected = formData.memberIds.includes(u.id)
                      return (
                        <div
                          key={u.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected
                            ? "bg-primary/10 border border-primary"
                            : "hover:bg-muted"
                            }`}
                          onClick={() => toggleMember(u.id)}
                        >
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={u.avatar || ""} />
                            <AvatarFallback className="text-xs">
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
                          </div>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                      )
                    })}
                  </div>
                  {formData.memberIds.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formData.memberIds.length} member(s) selected
                    </p>
                  )}
                </div>

                {/* Projects Selection */}
                <div className="space-y-2">
                  <Label>Link Projects</Label>
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {projects && projects.length > 0 ? (
                      projects.map((project) => {
                        const isSelected = formData.projectIds.includes(project.id)
                        return (
                          <div
                            key={project.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected
                              ? "bg-primary/10 border border-primary"
                              : "hover:bg-muted"
                              }`}
                            onClick={() => toggleProject(project.id)}
                          >
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{project.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {project.status.replace("_", " ")}
                              </p>
                            </div>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No projects available
                      </p>
                    )}
                  </div>
                  {formData.projectIds.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formData.projectIds.length} project(s) selected
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={handleCreateDepartment}
                  disabled={createDepartment.isPending}
                >
                  {createDepartment.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Department"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{overallStats.totalDepartments}</p>
                <p className="text-sm text-muted-foreground">Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{overallStats.totalMembers}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FolderKanban className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{overallStats.totalProjects}</p>
                <p className="text-sm text-muted-foreground">Linked Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{overallStats.avgCompletionRate}%</p>
                <p className="text-sm text-muted-foreground">Avg Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search departments..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Departments Grid */}
      {departmentsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDepartments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDepartments.map((dept) => (
            <Card key={dept.id} className="group hover:border-primary transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: dept.tag || "#888" }}
                    />
                    <div>
                      <CardTitle className="text-lg">
                        <Link
                          href={`/dashboard/departments/${dept.id}`}
                          className="hover:underline"
                        >
                          {dept.name}
                        </Link>
                      </CardTitle>
                      {dept.description && (
                        <CardDescription className="line-clamp-1">
                          {dept.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  {isCompanyAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/departments/${dept.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/departments/${dept.id}?tab=settings`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedDepartment(dept)
                            setIsDeleteOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Department Head */}
                {dept.lead && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={dept.lead.avatar || ""} />
                      <AvatarFallback className="text-xs">
                        {dept.lead.firstName?.[0]}{dept.lead.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {dept.lead.firstName} {dept.lead.lastName}
                    </span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Head
                    </Badge>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{dept.stats?.totalMembers || 0} members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    <span>{dept.stats?.totalProjects || 0} projects</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{dept.stats?.totalTimeHours || 0}h logged</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span>{dept.stats?.totalPoints || 0} pts</span>
                  </div>
                </div>

                {/* Completion Rate */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Task Completion</span>
                    <span className="font-medium">{dept.stats?.completionRate || 0}%</span>
                  </div>
                  <Progress value={dept.stats?.completionRate || 0} className="h-1.5" />
                </div>

                {/* Members Preview */}
                {dept.users && dept.users.length > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex -space-x-2">
                      {dept.users.slice(0, 5).map((u) => (
                        <Avatar key={u.id} className="h-7 w-7 border-2 border-background">
                          <AvatarImage src={u.avatar || ""} />
                          <AvatarFallback className="text-xs">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {dept.users.length > 5 && (
                        <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                          <span className="text-xs font-medium">+{dept.users.length - 5}</span>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/departments/${dept.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No departments found</h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search"
              : "Get started by creating your first department"
            }
          </p>
          {isCompanyAdmin && !searchQuery && (
            <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Department
            </Button>
          )}
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete "{selectedDepartment?.name}" and remove all members from it.
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