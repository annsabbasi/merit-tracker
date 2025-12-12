// src/app/dashboard/departments/user/[id]/page.tsx
"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/hooks/use-users"
import { useDepartments } from "@/lib/hooks/use-departments"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Mail, Phone, Calendar, Crown, Building2, Clock, Target, Trophy, TrendingUp, Loader2 } from "lucide-react"

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { hasPermission } = useAuth()

  // Fetch data using hooks
  const { data: user, isLoading: userLoading, error: userError } = useUser(id)
  const { data: departments, isLoading: departmentsLoading } = useDepartments()

  const department = departments?.find((d) => d.id === user?.departmentId)

  const roleColors = {
    COMPANY_ADMIN: "bg-chart-1 text-white",
    QC_ADMIN: "bg-chart-3 text-white",
    USER: "bg-chart-2 text-white",
  }

  if (userLoading || departmentsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-40" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (userError || !user) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">User not found</p>
            <Button onClick={() => router.back()} className="mt-4">
              Return to Departments
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isLead = department?.leadId === user.id

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Department
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="text-center">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="text-2xl">
                  {user.firstName?.slice(0, 1)}
                  {user.lastName?.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="mt-4">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">
                    {user.firstName} {user.lastName}
                  </h2>
                  {isLead && <Crown className="h-5 w-5 text-chart-3" />}
                </div>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge className={roleColors[user.role] || "bg-gray-500"}>
                    {user.role.replace("_", " ")}
                  </Badge>
                  {department && (
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: department.tag || "#888",
                        color: department.tag || "#888",
                      }}
                    >
                      {department.name}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{department?.name || "No Department"}</span>
                </div>
              </div>

              {hasPermission(["COMPANY_ADMIN", "QC_ADMIN"]) && (
                <div className="mt-6">
                  <Button variant="outline" className="w-full">
                    Edit User Profile
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats and Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto text-chart-3" />
                <p className="text-2xl font-bold mt-2">{user.points?.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto text-chart-1" />
                <p className="text-2xl font-bold mt-2">--</p>
                <p className="text-sm text-muted-foreground">Tasks Done</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto text-chart-2" />
                <p className="text-2xl font-bold mt-2">--</p>
                <p className="text-sm text-muted-foreground">Hours Logged</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-chart-4" />
                <p className="text-2xl font-bold mt-2">--</p>
                <p className="text-sm text-muted-foreground">Projects</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="info" className="w-full">
            <TabsList>
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{user.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium">{user.role.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{department?.name || "Unassigned"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Points Earned</p>
                      <p className="font-medium">{user.points?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Activity data for this user is not available.
                    <br />
                    <span className="text-sm">
                      Note: To view user-specific activity, additional API endpoints would be needed.
                    </span>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}