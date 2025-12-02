"use client"

import { useState } from "react"
import { mockNotifications } from "@/lib/mock-data"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCircle2, AlertTriangle, Info, XCircle, Check, Trash2, MailOpen } from "lucide-react"
import Link from "next/link"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [activeTab, setActiveTab] = useState("all")

  const unreadCount = notifications.filter((n) => !n.read).length

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !n.read
    return n.type === activeTab
  })

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const typeConfig = {
    info: { icon: Info, color: "text-chart-1", bg: "bg-chart-1/10" },
    success: { icon: CheckCircle2, color: "text-chart-2", bg: "bg-chart-2/10" },
    warning: { icon: AlertTriangle, color: "text-chart-3", bg: "bg-chart-3/10" },
    error: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your team's activities</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <MailOpen className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="h-8 w-8 mx-auto text-chart-1" />
            <p className="text-2xl font-bold mt-2">{notifications.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="h-8 w-8 mx-auto rounded-full bg-chart-3/10 flex items-center justify-center">
              <span className="text-chart-3 font-bold">{unreadCount}</span>
            </div>
            <p className="text-2xl font-bold mt-2">{unreadCount}</p>
            <p className="text-sm text-muted-foreground">Unread</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-chart-3" />
            <p className="text-2xl font-bold mt-2">{notifications.filter((n) => n.type === "warning").length}</p>
            <p className="text-sm text-muted-foreground">Warnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto text-chart-2" />
            <p className="text-2xl font-bold mt-2">{notifications.filter((n) => n.type === "success").length}</p>
            <p className="text-sm text-muted-foreground">Success</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && <Badge className="ml-2 bg-chart-3">{unreadCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="success">Success</TabsTrigger>
              <TabsTrigger value="warning">Warning</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const config = typeConfig[notification.type]
              const Icon = config.icon

              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                    notification.read ? "bg-muted/30" : "bg-muted/70 border-l-4 border-chart-1"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-medium ${notification.read ? "text-muted-foreground" : "text-foreground"}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {notification.link && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={notification.link}>View Details</Link>
                        </Button>
                      )}
                      {!notification.read && (
                        <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                          <Check className="h-4 w-4 mr-1" />
                          Mark as read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredNotifications.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto opacity-50" />
                <p className="mt-4">No notifications found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
