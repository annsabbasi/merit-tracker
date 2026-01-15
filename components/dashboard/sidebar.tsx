// components/dashboard/sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useLogout } from "@/lib/hooks"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileVideo,
  Settings,
  Bell,
  LogOut,
  ChevronLeft,
  Building2,
  Copy,
  Monitor,
  GalleryHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Department", href: "/dashboard/departments", icon: Users },
  { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { name: "Screen Monitor", href: "/dashboard/screen-monitoring", icon: GalleryHorizontal },
  { name: "SOPs", href: "/dashboard/sops", icon: FileVideo },
  { name: "Manage", href: "/dashboard/manage", icon: Settings },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Screen Capture", href: "/dashboard/settings/screen-capture", icon: Monitor },
]

export function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const company: any = useAuthStore((s) => s.company)
  const logoutMutation = useLogout()
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyCompanyCode = () => {
    if (company?.companyCode) {
      navigator.clipboard.writeText(company.companyCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  const roleColors = {
    COMPANY: "bg-chart-1 text-white",
    QC_ADMIN: "bg-chart-3 text-white",
    USER: "bg-chart-2 text-white",
  }

  // Calculate trial days remaining
  const getTrialDaysRemaining = () => {
    if (!company?.trialEndsAt) return 0
    const now = new Date()
    const trialEnd = new Date(company.trialEndsAt)
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, daysLeft)
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-bold text-sm">MT</span>
              </div>
              <span className="font-semibold text-sidebar-foreground truncate">Merit-Tracker</span>
            </div>
          )}
          {collapsed && (
            <div className="p-2 rounded-full -ml-1 bg-primary flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-bold text-sm">MT</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 shrink-0 cursor-pointer bg-white/20 z-10", collapsed && "mx-auto mt-2")}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>

        {!collapsed && company && user?.role === "COMPANY" && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Building2 className="h-4 w-4" />
              <span className="truncate">{company.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{company.companyCode}</code>
              <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer" onClick={copyCompanyCode}>
                <Copy className="h-3 w-3" />
              </Button>
              {copied && <span className="text-xs text-chart-2">Copied!</span>}
            </div>
            {company.plan === "TRIAL" && (
              <Badge variant="outline" className="mt-2 text-chart-3 border-chart-3">
                Trial: {getTrialDaysRemaining()} days left
              </Badge>
            )}
          </div>
        )}

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            // const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))
            const NavItem = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover-lift",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              )
            }

            return NavItem
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className={`flex items-center justify-between ${collapsed ? "flex-col" : ""} gap-2`}>
            <ThemeToggle />
            {!collapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
            {collapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="h-9 w-9 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            )}
          </div>

          {user && (
            <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.firstName} />
                <AvatarFallback>
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <Badge className={cn("text-xs", roleColors[user.role as keyof typeof roleColors])}>
                    {user.role.replace("_", " ")}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}