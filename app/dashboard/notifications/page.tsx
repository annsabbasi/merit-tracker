// app/dashboard/notifications/page.tsx
"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useClearReadNotifications,
} from "@/lib/hooks/use-notifications"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
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
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Check,
  Trash2,
  MailOpen,
  FolderKanban,
  ClipboardList,
  FileVideo,
  MessageSquare,
  Building2,
  UserCog,
  Settings,
  MoreVertical,
  Loader2,
  CheckCheck,
  Inbox,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { Notification, NotificationType } from "@/lib/types/index"

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState("all")
  const [isClearReadOpen, setIsClearReadOpen] = useState(false)

  // Determine filter based on active tab
  const getFilters = () => {
    if (activeTab === "unread") {
      return { unreadOnly: true }
    }
    if (activeTab !== "all") {
      return { type: activeTab as NotificationType }
    }
    return undefined
  }

  // Fetch data
  const { data: notifications, isLoading } = useNotifications(getFilters())
  const { data: unreadData } = useUnreadNotificationsCount()
  const { data: allNotifications } = useNotifications() // For stats

  // Mutations
  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()
  const deleteNotification = useDeleteNotification()
  const clearReadNotifications = useClearReadNotifications()

  const unreadCount = unreadData?.unreadCount || 0

  // Calculate stats from all notifications
  const stats = {
    total: allNotifications?.length || 0,
    unread: unreadCount,
    projectAssignments: allNotifications?.filter(n => n.type === "PROJECT_ASSIGNMENT").length || 0,
    taskAssignments: allNotifications?.filter(n => n.type === "TASK_ASSIGNMENT").length || 0,
    sopApprovals: allNotifications?.filter(n => n.type === "SOP_APPROVAL").length || 0,
    sopRejections: allNotifications?.filter(n => n.type === "SOP_REJECTION").length || 0,
  }

  // Notification type configuration
  const typeConfig: Record<NotificationType, { icon: any; color: string; bg: string; label: string }> = {
    PROJECT_ASSIGNMENT: {
      icon: FolderKanban,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      label: "Project Assignment"
    },
    TASK_ASSIGNMENT: {
      icon: ClipboardList,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      label: "Task Assignment"
    },
    SOP_APPROVAL: {
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10",
      label: "SOP Approved"
    },
    SOP_REJECTION: {
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      label: "SOP Rejected"
    },
    CHAT_MESSAGE: {
      icon: MessageSquare,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      label: "Chat Message"
    },
    DEPARTMENT_ASSIGNMENT: {
      icon: Building2,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      label: "Department Assignment"
    },
    ROLE_CHANGE: {
      icon: UserCog,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      label: "Role Change"
    },
    SYSTEM: {
      icon: Settings,
      color: "text-gray-500",
      bg: "bg-gray-500/10",
      label: "System"
    },
  }

  // Handlers
  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead.mutateAsync(id)
      toast.success("Marked as read")
    } catch (error) {
      toast.error("Failed to mark as read")
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync()
      toast.success("All notifications marked as read")
    } catch (error) {
      toast.error("Failed to mark all as read")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification.mutateAsync(id)
      toast.success("Notification deleted")
    } catch (error) {
      toast.error("Failed to delete notification")
    }
  }

  const handleClearRead = async () => {
    try {
      await clearReadNotifications.mutateAsync()
      toast.success("Read notifications cleared")
      setIsClearReadOpen(false)
    } catch (error) {
      toast.error("Failed to clear notifications")
    }
  }

  // Format time helper
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  // Get link from notification metadata
  const getNotificationLink = (notification: Notification): string | null => {
    const metadata = notification.metadata as Record<string, any> | null

    if (!metadata) return null

    switch (notification.type) {
      case "PROJECT_ASSIGNMENT":
        return metadata.projectId ? `/dashboard/projects/${metadata.projectId}` : null
      case "TASK_ASSIGNMENT":
        return metadata.subProjectId ? `/dashboard/tasks` : null
      case "SOP_APPROVAL":
      case "SOP_REJECTION":
        return metadata.sopId ? `/dashboard/sops` : null
      case "CHAT_MESSAGE":
        return metadata.chatRoomId ? `/dashboard/chat` : null
      case "DEPARTMENT_ASSIGNMENT":
        return `/dashboard/manage?tab=departments`
      default:
        return null
    }
  }

  const readNotificationsCount = (allNotifications?.filter(n => n.isRead).length) || 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your team's activities</p>
        </div>
        <div className="flex items-center gap-2">
          {readNotificationsCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClearReadOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Read ({readNotificationsCount})
            </Button>
          )}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MailOpen className="h-4 w-4 mr-2" />
              )}
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="h-8 w-8 mx-auto text-blue-500" />
            <p className="text-2xl font-bold mt-2">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center ${unreadCount > 0 ? "bg-yellow-500/20" : "bg-muted"
              }`}>
              <span className={`font-bold ${unreadCount > 0 ? "text-yellow-500" : "text-muted-foreground"}`}>
                {unreadCount}
              </span>
            </div>
            <p className="text-2xl font-bold mt-2">{unreadCount}</p>
            <p className="text-sm text-muted-foreground">Unread</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FolderKanban className="h-8 w-8 mx-auto text-blue-500" />
            <p className="text-2xl font-bold mt-2">{stats.projectAssignments}</p>
            <p className="text-sm text-muted-foreground">Project Assignments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ClipboardList className="h-8 w-8 mx-auto text-purple-500" />
            <p className="text-2xl font-bold mt-2">{stats.taskAssignments}</p>
            <p className="text-sm text-muted-foreground">Task Assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-yellow-500">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="PROJECT_ASSIGNMENT">Projects</TabsTrigger>
              <TabsTrigger value="TASK_ASSIGNMENT">Tasks</TabsTrigger>
              <TabsTrigger value="SOP_APPROVAL">SOPs</TabsTrigger>
              <TabsTrigger value="SYSTEM">System</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const config = typeConfig[notification.type] || typeConfig.SYSTEM
                const Icon = config.icon
                const link = getNotificationLink(notification)

                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${notification.isRead
                        ? "bg-muted/30"
                        : "bg-muted/70 border-l-4 border-primary"
                      }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${config.bg}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-medium ${notification.isRead
                                ? "text-muted-foreground"
                                : "text-foreground"
                              }`}>
                              {notification.title}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-xs ${config.color} border-current`}
                            >
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(notification.createdAt)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!notification.isRead && (
                                <DropdownMenuItem
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Mark as read
                                </DropdownMenuItem>
                              )}
                              {link && (
                                <DropdownMenuItem asChild>
                                  <Link href={link}>
                                    <FolderKanban className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(notification.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {link && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={link}>View Details</Link>
                          </Button>
                        )}
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markAsRead.isPending}
                          >
                            {markAsRead.isPending ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No notifications</h3>
              <p className="mt-2 text-muted-foreground">
                {activeTab === "unread"
                  ? "You're all caught up! No unread notifications."
                  : activeTab !== "all"
                    ? `No ${typeConfig[activeTab as NotificationType]?.label || activeTab} notifications`
                    : "You don't have any notifications yet."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear Read Notifications Dialog */}
      <AlertDialog open={isClearReadOpen} onOpenChange={setIsClearReadOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Read Notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {readNotificationsCount} read notifications.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleClearRead}
            >
              {clearReadNotifications.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Clear All Read"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}