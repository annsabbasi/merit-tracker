"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { mockSOPs, mockUsers } from "@/lib/mock-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Video, FileText, Clock, CheckCircle2, XCircle, Eye, Download } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

export default function ManagePage() {
  const { hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState("recordings")

  const pendingApprovals = mockSOPs.filter((s) => s.status === "pending")
  const approvedSOPs = mockSOPs.filter((s) => s.status === "approved")
  const rejectedSOPs = mockSOPs.filter((s) => s.status === "rejected")

  const sopsByCategory = mockSOPs.reduce(
    (acc, sop) => {
      acc[sop.category] = (acc[sop.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const categoryData = Object.entries(sopsByCategory).map(([name, value]) => ({ name, value }))

  const sopsByType = mockSOPs.reduce(
    (acc, sop) => {
      acc[sop.type] = (acc[sop.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const typeData = Object.entries(sopsByType).map(([name, value]) => ({ name, value }))

  const weeklyData = [
    { day: "Mon", uploads: 4, approvals: 3 },
    { day: "Tue", uploads: 6, approvals: 5 },
    { day: "Wed", uploads: 3, approvals: 4 },
    { day: "Thu", uploads: 8, approvals: 6 },
    { day: "Fri", uploads: 5, approvals: 7 },
    { day: "Sat", uploads: 2, approvals: 2 },
    { day: "Sun", uploads: 1, approvals: 1 },
  ]

  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manage</h1>
        <p className="text-muted-foreground">Recordings, approvals, and analytics overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-1/10">
                <Video className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockSOPs.length}</p>
                <p className="text-sm text-muted-foreground">Total Recordings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <Clock className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingApprovals.length}</p>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <CheckCircle2 className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{approvedSOPs.length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{rejectedSOPs.length}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="recordings">All Recordings</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approvals
            {pendingApprovals.length > 0 && <Badge className="ml-2 bg-chart-3">{pendingApprovals.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="recordings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Media Files</CardTitle>
              <CardDescription>Complete list of all uploaded SOPs and recordings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockSOPs.map((sop) => {
                  const creator = mockUsers.find((u) => u.id === sop.createdBy)
                  const statusColors = {
                    approved: "text-chart-2 border-chart-2",
                    pending: "text-chart-3 border-chart-3",
                    rejected: "text-destructive border-destructive",
                  }
                  return (
                    <div key={sop.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-background">
                          {sop.type === "video" ? (
                            <Video className="h-5 w-5 text-chart-1" />
                          ) : (
                            <FileText className="h-5 w-5 text-chart-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{sop.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {creator?.name} • {sop.category} • {new Date(sop.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={statusColors[sop.status]}>
                          {sop.status}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Review and approve submitted SOPs</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length > 0 ? (
                <div className="space-y-4">
                  {pendingApprovals.map((sop) => {
                    const creator = mockUsers.find((u) => u.id === sop.createdBy)
                    return (
                      <div key={sop.id} className="p-4 rounded-lg border border-chart-3/30 bg-chart-3/5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-chart-3/10">
                              {sop.type === "video" ? (
                                <Video className="h-5 w-5 text-chart-3" />
                              ) : (
                                <FileText className="h-5 w-5 text-chart-3" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{sop.title}</p>
                              <p className="text-sm text-muted-foreground">{sop.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Submitted by {creator?.name} on {new Date(sop.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button size="sm" className="bg-chart-2 hover:bg-chart-2/90">
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive">
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-chart-2" />
                  <p className="mt-4">All caught up! No pending approvals.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
                <CardDescription>Uploads and approvals over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    uploads: { label: "Uploads", color: "hsl(var(--chart-1))" },
                    approvals: { label: "Approvals", color: "hsl(var(--chart-2))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <XAxis dataKey="day" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="uploads" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="approvals" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SOPs by Category</CardTitle>
                <CardDescription>Distribution across different categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: { label: "Count" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Content Type Distribution</CardTitle>
              <CardDescription>Breakdown of SOP types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {typeData.map((type, index) => (
                  <div key={type.name} className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-foreground capitalize">{type.name}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground mt-2">{type.value}</p>
                    <Progress value={(type.value / mockSOPs.length) * 100} className="mt-2 h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
