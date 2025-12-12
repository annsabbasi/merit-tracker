// src/app/dashboard/layout.tsx
"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, token, user } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if token exists in storage
    const storedToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
        : null

    const hasAuth = isAuthenticated || !!storedToken || !!token

    if (!hasAuth) {
      router.push("/auth/login")
    } else {
      setIsChecking(false)
    }
  }, [isAuthenticated, token, router])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}