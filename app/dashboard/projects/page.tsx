// app/dashboard/projects/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useProjects, useCreateProject } from "@/lib/hooks/use-projects"
import { useUsers } from "@/lib/hooks/use-users"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
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
import { Search, Plus, Calendar, DollarSign, Users, Filter, FolderKanban, Loader2 } from "lucide-react"
import { toast } from "sonner"
// import type { ProjectStatus } from "@/lib/types/index"
import type { ProjectStatus } from "@/lib/types/project"

export default function ProjectsPage() {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Form state for creating project
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budget: "",
    status: "PLANNING" as ProjectStatus,
    projectLeadId: "",
    startDate: "",
    endDate: "",
    memberIds: [] as string[],
  })

  // Fetch data using hooks
  const { data: projects, isLoading: projectsLoading, error: projectsError } = useProjects({
    status: statusFilter !== "all" ? statusFilter as ProjectStatus : undefined,
    search: searchQuery || undefined,
  })
  const { data: users, isLoading: usersLoading } = useUsers()
  const createProject = useCreateProject()

  // Check if user can create projects (COMPANY_ADMIN or QC_ADMIN)
  const canCreateProject = user?.role === "COMPANY_ADMIN" || user?.role === "QC_ADMIN"

  // Filter projects based on search (additional client-side filtering if needed)
  const filteredProjects = projects?.filter((project) => {
    const matchesSearch = searchQuery
      ? project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    return matchesSearch
  }) || []

  const statusColors: Record<string, string> = {
    PLANNING: "text-yellow-500 border-yellow-500 bg-yellow-500/10",
    IN_PROGRESS: "text-blue-500 border-blue-500 bg-blue-500/10",
    ON_HOLD: "text-orange-500 border-orange-500 bg-orange-500/10",
    COMPLETED: "text-green-500 border-green-500 bg-green-500/10",
    CANCELLED: "text-red-500 border-red-500 bg-red-500/10",
  }

  const handleCreateProject = async () => {
    if (!formData.name.trim()) {
      toast.error("Project name is required")
      return
    }

    try {
      await createProject.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        status: formData.status,
        projectLeadId: formData.projectLeadId || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        memberIds: formData.memberIds.length > 0 ? formData.memberIds : undefined,
      })

      toast.success("Project created successfully!")
      setIsCreateOpen(false)
      setFormData({
        name: "",
        description: "",
        budget: "",
        status: "PLANNING",
        projectLeadId: "",
        startDate: "",
        endDate: "",
        memberIds: [],
      })
    } catch (error) {
      toast.error("Failed to create project")
    }
  }

  const handleMemberToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId]
    }))
  }

  // Get admins/leads for project lead selection
  const eligibleLeads = users?.filter(u =>
    u.role === "COMPANY_ADMIN" || u.role === "QC_ADMIN"
  ) || []

  if (projectsError) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load projects. Please try again.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground">Manage and track all your projects</p>
        </div>
        {canCreateProject && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Set up a new project for your team</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Project Name *</Label>
                  <Input
                    placeholder="e.g., Website Redesign"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the project goals and scope..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Budget</Label>
                    <Input
                      type="number"
                      placeholder="50000"
                      value={formData.budget}
                      onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as ProjectStatus }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PLANNING">Planning</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                <div className="space-y-2">
                  <Label>Project Lead</Label>
                  <Select
                    value={formData.projectLeadId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, projectLeadId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleLeads.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatar || ""} />
                              <AvatarFallback className="text-xs">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            {user.firstName} {user.lastName}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {user.role?.replace("_", " ")}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Team Members Selection */}
                <div className="space-y-2">
                  <Label>Team Members</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {usersLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : users && users.length > 0 ? (
                      users.map((u) => (
                        <div
                          key={u.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${formData.memberIds.includes(u.id)
                            ? "bg-primary/10 border border-primary"
                            : "hover:bg-muted"
                            }`}
                          onClick={() => handleMemberToggle(u.id)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.avatar || ""} />
                            <AvatarFallback>
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {u.role?.replace("_", " ")}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No users available
                      </p>
                    )}
                  </div>
                  {formData.memberIds.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formData.memberIds.length} member(s) selected
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={handleCreateProject}
                  disabled={createProject.isPending}
                >
                  {createProject.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PLANNING">Planning</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {projectsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const completedTasks = project.subProjects?.filter(
              (sp: any) => sp.status === "COMPLETED"
            ).length || 0
            const totalTasks = project._count?.subProjects || project.subProjects?.length || 0
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <Card className="h-full cursor-pointer hover:border-primary transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {project.description || "No description"}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className={statusColors[project.status] || ""}
                      >
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      {project.endDate && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(project.endDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {project.budget && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>${Number(project.budget).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        {project.projectLead && (
                          <>
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={project.projectLead.avatar || ""} />
                              <AvatarFallback className="text-xs">
                                {project.projectLead.firstName?.[0]}
                                {project.projectLead.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                              {project.projectLead.firstName} {project.projectLead.lastName}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {project._count?.members || project.members?.length || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No projects found</h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first project"}
          </p>
          {canCreateProject && !searchQuery && statusFilter === "all" && (
            <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          )}
        </div>
      )}
    </div>
  )
}