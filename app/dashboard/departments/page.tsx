// app/dashboard/departments/page.tsx
"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  useDepartments,
  useCreateDepartment,
  useDeleteDepartment,
  useAssignUsersToDepartment
} from "@/lib/hooks/use-departments"
import { useUpdateUser, useUsers } from "@/lib/hooks/use-users"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Search, Filter, UserPlus, Crown, Mail, Phone, Calendar, MoreHorizontal, Building2, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { toast } from "sonner" // Assuming you use sonner or similar for notifications
import { useForm } from "react-hook-form"
import type { User, Department } from "@/lib/types/index"
import { useAuthStore } from "@/lib/stores/auth-store"

interface CreateDepartmentForm {
  name: string
  description?: string
  tag?: string
  leadId?: string
}

export default function DepartmentsPage() {
  const { user: currentUser } = useAuthStore()
  const { hasPermission } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Use the hooks
  const { data: departments, isLoading: departmentsLoading, error: departmentsError } = useDepartments()
  const { data: users, isLoading: usersLoading } = useUsers()
  const createDepartment = useCreateDepartment()
  const deleteDepartment = useDeleteDepartment()
  const assignUsers = useAssignUsersToDepartment()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateDepartmentForm>()

  const handleCreateDepartment = async (data: CreateDepartmentForm) => {
    try {
      await createDepartment.mutateAsync(data)
      toast.success("Department created successfully")
      setIsAddDeptOpen(false)
      reset()
    } catch (error) {
      toast.error("Failed to create department")
    }
  }

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return

    try {
      await deleteDepartment.mutateAsync(id)
      toast.success("Department deleted successfully")
    } catch (error) {
      toast.error("Failed to delete department")
    }
  }

  const handleAssignUsers = async (departmentId: string) => {
    if (selectedUsers.length === 0) {
      toast.warning("Please select at least one user")
      return
    }

    try {
      await assignUsers.mutateAsync({ id: departmentId, userIds: selectedUsers })
      toast.success("Users assigned successfully")
      setSelectedUsers([])
    } catch (error) {
      toast.error("Failed to assign users")
    }
  }
  const filteredUsers = users?.filter((user) => {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const email = user.email?.toLowerCase() || "";

    const matchesSearch =
      name.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase());

    const matchesDept =
      selectedDepartment === "all" ||
      user.departmentId === selectedDepartment;

    return matchesSearch && matchesDept;
  }) || [];


  const roleColors = {
    COMPANY_ADMIN: "bg-chart-1 text-white",
    QC_ADMIN: "bg-chart-3 text-white",
    USER: "bg-chart-2 text-white",
  }

  if (departmentsLoading || usersLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (departmentsError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load departments</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Department Management</h1>
          <p className="text-muted-foreground">Manage team members and their departments</p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission(["COMPANY_ADMIN", "QC_ADMIN"]) && (
            <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Building2 className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Department</DialogTitle>
                  <DialogDescription>Add a new department to your organization</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleCreateDepartment)} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Department Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Engineering"
                      {...register("name", { required: "Department name is required" })}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Brief description of the department"
                      {...register("description")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tag">Color Tag (hex code)</Label>
                    <Input
                      id="tag"
                      placeholder="#2563eb"
                      {...register("tag")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leadId">Department Lead</Label>
                    <Select onValueChange={(value) => {
                      // Update form value
                      reset({ ...useForm.getValues(), leadId: value })
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a lead" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No lead selected</SelectItem>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createDepartment.isPending}
                  >
                    {createDepartment.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Create Department
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {departments?.map((dept) => (
          <Card key={dept.id} className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="p-4">
              <Link href={`/dashboard/departments/${dept.id}`}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: dept.tag || "#888" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{dept.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {dept.users?.length || 0} members
                    </p>
                  </div>
                </div>
              </Link>
              {hasPermission(["COMPANY_ADMIN", "QC_ADMIN"]) && (
                <div className="mt-2 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/departments/${dept.id}`}>
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Edit Department</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteDepartment(dept.id)}
                      >
                        Delete Department
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>View and manage all users in your organization</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                departments={departments || []}
                hasPermission={hasPermission}
                onAssignUsers={handleAssignUsers}
                selectedUsers={selectedUsers}
                setSelectedUsers={setSelectedUsers}
              />
            ))}
          </div>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No users found matching your criteria</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface UserCardProps {
  user: User
  departments: Department[]
  hasPermission: (role: string | string[]) => boolean
  onAssignUsers: (departmentId: string) => void
  selectedUsers: string[]
  setSelectedUsers: (ids: string[]) => void
}

function UserCard({ user, departments, hasPermission, onAssignUsers, selectedUsers, setSelectedUsers }: UserCardProps) {
  const { mutate: updateUser } = useUpdateUser()
  const department = departments.find((d) => d.id === user.departmentId)

  const roleColors = {
    COMPANY_ADMIN: "bg-chart-1 text-white",
    QC_ADMIN: "bg-chart-3 text-white",
    USER: "bg-chart-2 text-white",
  }

  const handleAssignToDept = (deptId: string) => {
    updateUser({
      id: user.id,
      data: { departmentId: deptId }
    })
  }

  const handleToggleSelection = () => {
    if (selectedUsers.includes(user.id)) {
      setSelectedUsers(selectedUsers.filter(id => id !== user.id))
    } else {
      setSelectedUsers([...selectedUsers, user.id])
    }
  }

  const isLead = department?.leadId === user.id

  return (
    <Card className="group hover:border-primary transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback>
                {user.firstName?.slice(0, 1)}{user.lastName?.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/departments/user/${user.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {user.name}
                </Link>
                {isLead && <Crown className="h-4 w-4 text-chart-3" />}
              </div>
              <p className="text-sm text-muted-foreground">{user.position || "No position"}</p>
            </div>
          </div>
          {hasPermission(["COMPANY_ADMIN", "QC_ADMIN"]) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/users/${user.id}/edit`}>
                    Edit User
                  </Link>
                </DropdownMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Change Department
                    </DropdownMenuItem>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right">
                    <DropdownMenuItem onClick={() => handleAssignToDept("")}>
                      Remove from Department
                    </DropdownMenuItem>
                    {departments.map((dept) => (
                      <DropdownMenuItem
                        key={dept.id}
                        onClick={() => handleAssignToDept(dept.id)}
                      >
                        {dept.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenuItem
                  onClick={handleToggleSelection}
                  className={selectedUsers.includes(user.id) ? "bg-primary/10" : ""}
                >
                  {selectedUsers.includes(user.id) ? "Deselect User" : "Select for Bulk Assign"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  Remove User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{user.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={roleColors[user.role as keyof typeof roleColors] || "bg-gray-500"}>
              {user.role.replace("_", " ")}
            </Badge>
            {department && (
              <Badge
                variant="outline"
                style={{
                  borderColor: department.tag || "#888",
                  color: department.tag || "#888"
                }}
              >
                {department.name}
              </Badge>
            )}
          </div>
          <span className="text-sm font-medium text-foreground">
            {user.points?.toLocaleString() || 0} pts
          </span>
        </div>
      </CardContent>
    </Card>
  )
}