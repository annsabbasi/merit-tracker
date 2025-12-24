// app/dashboard/manage/page.tsx
"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useMyCompany, useCompanyStats } from "@/lib/hooks/use-companies"
import { useUsers, useUpdateUserRole, useDeactivateUser, useActivateUser, useLeaderboard } from "@/lib/hooks/use-users"
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, useAssignUsersToDepartment } from "@/lib/hooks/use-departments"
import { useSops, usePendingSops, useSopStats, useApproveSop, useRejectSop } from "@/lib/hooks/use-sops"
import { useNotifications, useUnreadNotificationsCount, useMarkAllNotificationsAsRead, useClearReadNotifications } from "@/lib/hooks/use-notifications"
import { useActivityLogs, useActivityLogStats } from "@/lib/hooks/use-activity-logs"
import { useSubscriptionStatus } from "@/lib/hooks/use-auth"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import {
  Building2,
  Users,
  FolderKanban,
  FileVideo,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  MoreVertical,
  Plus,
  Trash2,
  Edit,
  UserCog,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Bell,
  BellOff,
  Activity,
  TrendingUp,
  Calendar,
  Loader2,
  CreditCard,
  AlertTriangle,
  Search,
  Crown,
  Play,
} from "lucide-react"
import { toast } from "sonner"
import type { User, UserRole, Department, Sop, Notification } from "@/lib/types/index"

export default function ManagePage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [isCreateDeptOpen, setIsCreateDeptOpen] = useState(false)
  const [isEditDeptOpen, setIsEditDeptOpen] = useState(false)
  const [isDeleteDeptOpen, setIsDeleteDeptOpen] = useState(false)
  const [isAssignUsersOpen, setIsAssignUsersOpen] = useState(false)
  const [isRejectSopOpen, setIsRejectSopOpen] = useState(false)
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false)
  const [isDeactivateUserOpen, setIsDeactivateUserOpen] = useState(false)

  // Selected items
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [selectedSop, setSelectedSop] = useState<Sop | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [newRole, setNewRole] = useState<UserRole>("USER")

  // Form states
  const [deptForm, setDeptForm] = useState({
    name: "",
    description: "",
    tag: "",
    leadId: "",
  })
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  // Check permissions
  const isAdmin = user?.role === "COMPANY_ADMIN" || user?.role === "QC_ADMIN"
  const isCompanyAdmin = user?.role === "COMPANY_ADMIN"

  // Fetch data
  const { data: company, isLoading: companyLoading } = useMyCompany()
  const { data: companyStats, isLoading: statsLoading } = useCompanyStats()
  const { data: subscription } = useSubscriptionStatus()
  const { data: users, isLoading: usersLoading } = useUsers()
  const { data: leaderboard } = useLeaderboard()
  const { data: departments, isLoading: deptsLoading } = useDepartments()
  const { data: allSops } = useSops()
  const { data: pendingSops, isLoading: pendingSopsLoading } = usePendingSops()
  const { data: sopStats } = useSopStats()
  const { data: notifications } = useNotifications()
  const { data: unreadCount } = useUnreadNotificationsCount()
  const { data: activityLogs, isLoading: activityLoading } = useActivityLogs()
  const { data: activityStats } = useActivityLogStats()

  // Mutations
  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment()
  const deleteDepartment = useDeleteDepartment()
  const assignUsers = useAssignUsersToDepartment()
  const approveSop = useApproveSop()
  const rejectSop = useRejectSop()
  const updateUserRole = useUpdateUserRole()
  const deactivateUser = useDeactivateUser()
  const activateUser = useActivateUser()
  const markAllRead = useMarkAllNotificationsAsRead()
  const clearRead = useClearReadNotifications()

  // Filter users
  const filteredUsers = users?.filter(u =>
    u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  // Chart colors
  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"]

  // Activity type labels
  const activityTypeLabels: Record<string, string> = {
    USER_LOGIN: "Login",
    USER_LOGOUT: "Logout",
    PROJECT_CREATED: "Project Created",
    PROJECT_UPDATED: "Project Updated",
    SOP_CREATED: "SOP Created",
    SOP_APPROVED: "SOP Approved",
    TIME_TRACKING_START: "Time Start",
    TIME_TRACKING_END: "Time End",
    DEPARTMENT_CREATED: "Dept Created",
    USER_ROLE_CHANGED: "Role Changed",
  }

  // Handlers
  const handleCreateDepartment = async () => {
    if (!deptForm.name.trim()) {
      toast.error("Department name is required")
      return
    }

    try {
      await createDepartment.mutateAsync({
        name: deptForm.name,
        description: deptForm.description || undefined,
        tag: deptForm.tag || undefined,
        leadId: deptForm.leadId || undefined,
      })
      toast.success("Department created!")
      setIsCreateDeptOpen(false)
      setDeptForm({ name: "", description: "", tag: "", leadId: "" })
    } catch (error) {
      toast.error("Failed to create department")
    }
  }

  const handleUpdateDepartment = async () => {
    if (!selectedDepartment || !deptForm.name.trim()) return

    try {
      await updateDepartment.mutateAsync({
        id: selectedDepartment.id,
        data: {
          name: deptForm.name,
          description: deptForm.description || undefined,
          tag: deptForm.tag || undefined,
          leadId: deptForm.leadId || undefined,
        },
      })
      toast.success("Department updated!")
      setIsEditDeptOpen(false)
      setSelectedDepartment(null)
    } catch (error) {
      toast.error("Failed to update department")
    }
  }

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return

    try {
      await deleteDepartment.mutateAsync(selectedDepartment.id)
      toast.success("Department deleted!")
      setIsDeleteDeptOpen(false)
      setSelectedDepartment(null)
    } catch (error) {
      toast.error("Failed to delete department")
    }
  }

  const handleAssignUsers = async () => {
    if (!selectedDepartment || selectedUserIds.length === 0) return

    try {
      await assignUsers.mutateAsync({
        id: selectedDepartment.id,
        userIds: selectedUserIds,
      })
      toast.success("Users assigned!")
      setIsAssignUsersOpen(false)
      setSelectedUserIds([])
    } catch (error) {
      toast.error("Failed to assign users")
    }
  }

  const handleApproveSop = async (sop: Sop) => {
    try {
      await approveSop.mutateAsync({ id: sop.id })
      toast.success("SOP approved!")
    } catch (error) {
      toast.error("Failed to approve SOP")
    }
  }

  const handleRejectSop = async () => {
    if (!selectedSop || !rejectionReason.trim()) {
      toast.error("Rejection reason is required")
      return
    }

    try {
      await rejectSop.mutateAsync({
        id: selectedSop.id,
        rejectionReason,
      })
      toast.success("SOP rejected")
      setIsRejectSopOpen(false)
      setSelectedSop(null)
      setRejectionReason("")
    } catch (error) {
      toast.error("Failed to reject SOP")
    }
  }

  const handleUpdateUserRole = async () => {
    if (!selectedUser) return

    try {
      await updateUserRole.mutateAsync({
        id: selectedUser.id,
        role: newRole,
      })
      toast.success("User role updated!")
      setIsChangeRoleOpen(false)
      setSelectedUser(null)
    } catch (error) {
      toast.error("Failed to update role")
    }
  }

  const handleDeactivateUser = async () => {
    if (!selectedUser) return

    try {
      await deactivateUser.mutateAsync(selectedUser.id)
      toast.success("User deactivated")
      setIsDeactivateUserOpen(false)
      setSelectedUser(null)
    } catch (error) {
      toast.error("Failed to deactivate user")
    }
  }

  const handleActivateUser = async (userId: string) => {
    try {
      await activateUser.mutateAsync(userId)
      toast.success("User activated!")
    } catch (error) {
      toast.error("Failed to activate user")
    }
  }

  const openEditDepartment = (dept: Department) => {
    setSelectedDepartment(dept)
    setDeptForm({
      name: dept.name,
      description: dept.description || "",
      tag: dept.tag || "",
      leadId: dept.leadId || "",
    })
    setIsEditDeptOpen(true)
  }

  const openAssignUsers = (dept: Department) => {
    setSelectedDepartment(dept)
    setSelectedUserIds(dept.users?.map(u => u.id) || [])
    setIsAssignUsersOpen(true)
  }

  const openChangeRole = (u: User) => {
    setSelectedUser(u)
    setNewRole(u.role)
    setIsChangeRoleOpen(true)
  }

  const openDeactivateUser = (u: User) => {
    setSelectedUser(u)
    setIsDeactivateUserOpen(true)
  }

  const roleIcons: Record<string, any> = {
    COMPANY_ADMIN: Crown,
    QC_ADMIN: ShieldCheck,
    USER: Shield,
  }

  const roleColors: Record<string, string> = {
    COMPANY_ADMIN: "text-yellow-500 border-yellow-500 bg-yellow-500/10",
    QC_ADMIN: "text-blue-500 border-blue-500 bg-blue-500/10",
    USER: "text-gray-500 border-gray-500 bg-gray-500/10",
  }

  // Prepare chart data
  const activityChartData = activityStats?.byType?.map(item => ({
    name: activityTypeLabels[item.type] || item.type,
    value: item.count,
  })) || []

  const sopTypeData = sopStats?.byType?.map((item: any, index: number) => ({
    name: item.type,
    value: item.count,
  })) || []

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
          <p className="mt-2 text-muted-foreground">
            You need admin permissions to access this page.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manage</h1>
        <p className="text-muted-foreground">
          Company overview, user management, and analytics
        </p>
      </div>

      {/* Subscription Alert */}
      {subscription && !subscription.isValid && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Subscription Issue</p>
              <p className="text-sm text-muted-foreground">{subscription.message}</p>
            </div>
            <Button variant="destructive" size="sm">
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Subscription
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {companyStats?.activeUsers || 0}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <FolderKanban className="h-5 w-5 text-green-500" />
              </div>
              <div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {companyStats?.totalProjects || 0}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Building2 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {companyStats?.totalDepartments || 0}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                {pendingSopsLoading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {sopStats?.pending || pendingSops?.length || 0}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">Pending SOPs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Activity className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {activityStats?.last24Hours || 0}
                </p>
                <p className="text-sm text-muted-foreground">Actions (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">
            Users
            <Badge variant="secondary" className="ml-2">
              {companyStats?.totalUsers || users?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="pending">
            Pending SOPs
            {(sopStats?.pending || 0) > 0 && (
              <Badge className="ml-2 bg-yellow-500">
                {sopStats?.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {companyLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ) : company ? (
                  <>
                    <div className="flex items-center gap-4">
                      {company.logo ? (
                        <img
                          src={company.logo}
                          alt={company.name}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-semibold">{company.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Code: <span className="font-mono font-medium">{company.companyCode}</span>
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Subscription</p>
                        <Badge
                          variant="outline"
                          className={
                            subscription?.isValid
                              ? "text-green-500 border-green-500"
                              : "text-red-500 border-red-500"
                          }
                        >
                          {company.subscriptionStatus}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Days Remaining</p>
                        <p className="font-semibold">{subscription?.daysRemaining || 0} days</p>
                      </div>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Performers
                </CardTitle>
                <CardDescription>Points leaderboard</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard?.slice(0, 5).map((u, index) => (
                    <div key={u.id} className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0
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
                      </div>
                      <p className="font-bold text-primary">{u.points} pts</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Activity by Type</CardTitle>
                <CardDescription>Distribution of activities</CardDescription>
              </CardHeader>
              <CardContent>
                {activityChartData.length > 0 ? (
                  <ChartContainer
                    config={{ value: { label: "Count" } }}
                    className="h-[250px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityChartData}>
                        <XAxis dataKey="name" fontSize={12} tickLine={false} />
                        <YAxis fontSize={12} tickLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No activity data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SOP Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>SOPs by Type</CardTitle>
                <CardDescription>Content distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {sopTypeData.length > 0 ? (
                  <ChartContainer
                    config={{ value: { label: "Count" } }}
                    className="h-[250px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sopTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {sopTypeData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No SOP data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage user roles and status</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="space-y-3">
                  {filteredUsers.map((u) => {
                    const RoleIcon = roleIcons[u.role] || Shield
                    const isSelf = u.id === user?.id
                    const canModify = isCompanyAdmin && !isSelf && u.role !== "COMPANY_ADMIN"

                    return (
                      <div
                        key={u.id}
                        className={`flex items-center justify-between p-4 rounded-lg bg-muted/50 ${!u.isActive ? "opacity-60" : ""
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={u.avatar || ""} />
                            <AvatarFallback>
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {u.firstName} {u.lastName}
                              </p>
                              {isSelf && (
                                <Badge variant="outline" className="text-xs">You</Badge>
                              )}
                              {!u.isActive && (
                                <Badge variant="destructive" className="text-xs">Inactive</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={roleColors[u.role]}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {u.role.replace("_", " ")}
                          </Badge>
                          <p className="text-sm font-medium w-20 text-right">
                            {u.points} pts
                          </p>
                          {canModify && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openChangeRole(u)}>
                                  <UserCog className="h-4 w-4 mr-2" />
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {u.isActive ? (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => openDeactivateUser(u)}
                                  >
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    className="text-green-600"
                                    onClick={() => handleActivateUser(u.id)}
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Activate
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Departments</h3>
            <Dialog open={isCreateDeptOpen} onOpenChange={setIsCreateDeptOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Department
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Department</DialogTitle>
                  <DialogDescription>Add a new department to your company</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      placeholder="e.g., Engineering"
                      value={deptForm.name}
                      onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Department description..."
                      value={deptForm.description}
                      onChange={(e) => setDeptForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tag</Label>
                    <Input
                      placeholder="e.g., ENG"
                      value={deptForm.tag}
                      onChange={(e) => setDeptForm(prev => ({ ...prev, tag: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department Lead</Label>
                    <Select
                      value={deptForm.leadId || "none"}
                      onValueChange={(value) => setDeptForm(prev => ({
                        ...prev,
                        leadId: value === "none" ? "" : value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select lead" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Lead</SelectItem>
                        {users?.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.firstName} {u.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCreateDepartment}
                    disabled={createDepartment.isPending}
                  >
                    {createDepartment.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Create Department"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {deptsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : departments && departments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {departments.map((dept) => (
                <Card key={dept.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                        {dept.tag && (
                          <Badge variant="secondary" className="mt-1">
                            {dept.tag}
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDepartment(dept)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openAssignUsers(dept)}>
                            <Users className="h-4 w-4 mr-2" />
                            Assign Users
                          </DropdownMenuItem>
                          {isCompanyAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedDepartment(dept)
                                  setIsDeleteDeptOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {dept.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {dept.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{dept.users?.length || 0} members</span>
                      </div>
                      {dept.lead && (
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-500" />
                          <span>{dept.lead.firstName}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No departments yet</p>
              <Button className="mt-4" onClick={() => setIsCreateDeptOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Department
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Pending SOPs Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Review and approve submitted SOPs</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingSopsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : pendingSops && pendingSops.length > 0 ? (
                <div className="space-y-4">
                  {pendingSops.map((sop) => (
                    <div
                      key={sop.id}
                      className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-yellow-500/10">
                            <FileVideo className="h-5 w-5 text-yellow-500" />
                          </div>
                          <div>
                            <p className="font-medium">{sop.title}</p>
                            {sop.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {sop.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={sop.createdBy?.avatar || ""} />
                                <AvatarFallback className="text-xs">
                                  {sop.createdBy?.firstName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                {sop.createdBy?.firstName} {sop.createdBy?.lastName} •{" "}
                                {new Date(sop.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(sop.fileUrl, "_blank")}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleApproveSop(sop)}
                            disabled={approveSop.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedSop(sop)
                              setIsRejectSopOpen(true)
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                  <p className="mt-4 text-muted-foreground">All caught up! No pending approvals.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions in your company</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : activityLogs && activityLogs.length > 0 ? (
                <div className="space-y-3">
                  {activityLogs.slice(0, 20).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="p-2 rounded-full bg-primary/10">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {log.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {log.user && (
                            <span>
                              {log.user.firstName} {log.user.lastName}
                            </span>
                          )}
                          <span>•</span>
                          <span>
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activityTypeLabels[log.activityType] || log.activityType}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No activity logs yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDeptOpen} onOpenChange={setIsEditDeptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={deptForm.name}
                onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={deptForm.description}
                onChange={(e) => setDeptForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Tag</Label>
              <Input
                value={deptForm.tag}
                onChange={(e) => setDeptForm(prev => ({ ...prev, tag: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Department Lead</Label>
              <Select
                value={deptForm.leadId || "none"}
                onValueChange={(value) => setDeptForm(prev => ({
                  ...prev,
                  leadId: value === "none" ? "" : value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Lead</SelectItem>
                  {users?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleUpdateDepartment}
              disabled={updateDepartment.isPending}
            >
              {updateDepartment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Users Dialog */}
      <Dialog open={isAssignUsersOpen} onOpenChange={setIsAssignUsersOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Users to {selectedDepartment?.name}</DialogTitle>
            <DialogDescription>Select users to add to this department</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4 max-h-96 overflow-y-auto">
            {users?.map((u) => {
              const isSelected = selectedUserIds.includes(u.id)
              return (
                <div
                  key={u.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5" : "hover:bg-muted"
                    }`}
                  onClick={() => {
                    setSelectedUserIds(prev =>
                      isSelected
                        ? prev.filter(id => id !== u.id)
                        : [...prev, u.id]
                    )
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.avatar || ""} />
                      <AvatarFallback>
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{u.firstName} {u.lastName}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
              )
            })}
          </div>
          <Button
            className="w-full"
            onClick={handleAssignUsers}
            disabled={assignUsers.isPending}
          >
            {assignUsers.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Assign ${selectedUserIds.length} Users`
            )}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete Department Dialog */}
      <AlertDialog open={isDeleteDeptOpen} onOpenChange={setIsDeleteDeptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{selectedDepartment?.name}" and unassign all users.
              This action cannot be undone.
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

      {/* Reject SOP Dialog */}
      <Dialog open={isRejectSopOpen} onOpenChange={setIsRejectSopOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject SOP</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{selectedSop?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Textarea
                placeholder="Explain why this SOP is being rejected..."
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsRejectSopOpen(false)
                  setRejectionReason("")
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleRejectSop}
                disabled={rejectSop.isPending}
              >
                {rejectSop.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Reject SOP"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={isChangeRoleOpen} onOpenChange={setIsChangeRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update role for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="QC_ADMIN">QC Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleUpdateUserRole}
              disabled={updateUserRole.isPending}
            >
              {updateUserRole.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Update Role"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivate User Dialog */}
      <AlertDialog open={isDeactivateUserOpen} onOpenChange={setIsDeactivateUserOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent {selectedUser?.firstName} {selectedUser?.lastName} from
              accessing the platform. You can reactivate them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeactivateUser}
            >
              {deactivateUser.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Deactivate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}