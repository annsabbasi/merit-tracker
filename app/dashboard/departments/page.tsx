"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { mockUsers, mockDepartments } from "@/lib/mock-data"
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
import { Search, Filter, UserPlus, Crown, Mail, Phone, Calendar, MoreHorizontal, Building2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import type { User } from "@/lib/types"

export default function DepartmentsPage() {
  const { hasPermission } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false)

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDept = selectedDepartment === "all" || user.department === selectedDepartment
    return matchesSearch && matchesDept
  })

  const roleColors = {
    company: "bg-chart-1 text-white",
    qc_admin: "bg-chart-3 text-white",
    user: "bg-chart-2 text-white",
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Department Management</h1>
          <p className="text-muted-foreground">Manage team members and their departments</p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission(["company", "qc_admin"]) && (
            <>
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
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Department Name</Label>
                      <Input placeholder="e.g., Engineering" />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="flex gap-2">
                        {["#2563eb", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"].map((color) => (
                          <button
                            key={color}
                            className="w-8 h-8 rounded-full border-2 border-transparent hover:border-foreground transition-colors"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Department Lead</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a lead" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">Create Department</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Team Member</DialogTitle>
                    <DialogDescription>Invite a new user to your organization</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" placeholder="john@company.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="qc_admin">QC Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockDepartments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Input placeholder="e.g., Senior Developer" />
                    </div>
                    <Button className="w-full">Send Invitation</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {mockDepartments.map((dept) => (
          <Card key={dept.id} className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: dept.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{dept.name}</p>
                  <p className="text-sm text-muted-foreground">{dept.memberCount} members</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                  {mockDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
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
              <UserCard key={user.id} user={user} hasPermission={hasPermission} />
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

function UserCard({ user, hasPermission }: { user: User; hasPermission: (role: string | string[]) => boolean }) {
  const roleColors = {
    company: "bg-chart-1 text-white",
    qc_admin: "bg-chart-3 text-white",
    user: "bg-chart-2 text-white",
  }

  const department = mockDepartments.find((d) => d.name === user.department)

  return (
    <Card className="group hover:border-primary transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/departments/user/${user.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {user.name}
                </Link>
                {user.isLead && <Crown className="h-4 w-4 text-chart-3" />}
              </div>
              <p className="text-sm text-muted-foreground">{user.position}</p>
            </div>
          </div>
          {hasPermission(["company", "qc_admin"]) && (
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
                <DropdownMenuItem>Edit User</DropdownMenuItem>
                <DropdownMenuItem>Change Department</DropdownMenuItem>
                <DropdownMenuItem>{user.isLead ? "Remove Lead Status" : "Make Team Lead"}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Remove User</DropdownMenuItem>
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
            <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={roleColors[user.role]}>{user.role.replace("_", " ")}</Badge>
            {department && (
              <Badge variant="outline" style={{ borderColor: department.color, color: department.color }}>
                {department.name}
              </Badge>
            )}
          </div>
          <span className="text-sm font-medium text-foreground">{user.points?.toLocaleString()} pts</span>
        </div>
      </CardContent>
    </Card>
  )
}
