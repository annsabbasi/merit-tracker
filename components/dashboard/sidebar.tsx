// components/dashboard/sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
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
  const { user, company, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyCompanyCode = () => {
    if (company?.companyCode) {
      navigator.clipboard.writeText(company.companyCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const roleColors = {
    company: "bg-chart-1 text-white",
    qc_admin: "bg-chart-3 text-white",
    user: "bg-chart-2 text-white",
  }
  console.log("This is the data of the company", company)
  console.log("This is the data of the user", user)
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
                <span className="text-primary-foreground font-bold text-sm">WF</span>
              </div>
              <span className="font-semibold text-sidebar-foreground truncate">WorkFlow Pro</span>
            </div>
          )}
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-bold text-sm">WF</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 shrink-0", collapsed && "mx-auto mt-2")}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>

        {!collapsed && company && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Building2 className="h-4 w-4" />
              <span className="truncate">{company.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{company.companyCode}</code>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyCompanyCode}>
                <Copy className="h-3 w-3" />
              </Button>
              {copied && <span className="text-xs text-chart-2">Copied!</span>}
            </div>
            {company.plan === "trial" && (
              <Badge variant="outline" className="mt-2 text-chart-3 border-chart-3">
                Trial: {Math.ceil((new Date(company.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                left
              </Badge>
            )}
          </div>
        )}

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const NavItem = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
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
          <div className="flex items-center justify-between">
            <ThemeToggle />
            {!collapsed && (
              <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
            {collapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={logout} className="h-9 w-9">
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
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                  <Badge className={cn("text-xs", roleColors[user.role])}>{user.role.replace("_", " ")}</Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
