// src/app/auth/login/page.tsx
"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useLogin } from "@/lib/hooks"
import { getErrorMessage } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Building2, User, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [loginType, setLoginType] = useState<"company" | "user">("company")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [companyCode, setCompanyCode] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const loginMutation = useLogin()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent any default behavior

    // Validate fields
    if (!email || !password) {
      return
    }

    // Note: companyCode is NOT needed for login, only for registration
    // The backend identifies the user's company from their email
    loginMutation.mutate({
      email: email.trim(),
      password,
      rememberMe,
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">MT</span>
          </div>
          <span className="font-semibold text-foreground">Merit-Tracker</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={loginType} onValueChange={(v) => setLoginType(v as "company" | "user")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="company" className="flex items-center gap-2 hover-lift  cursor-pointer border-sidebar-border">
                  <Building2 className="h-4 w-4" />
                  Company
                </TabsTrigger>
                <TabsTrigger value="user" className="flex items-center gap-2 hover-lift  cursor-pointer border-sidebar-border">
                  <User className="h-4 w-4" />
                  User
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} noValidate>
                {loginMutation.isError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {getErrorMessage(loginMutation.error)}
                    </AlertDescription>
                  </Alert>
                )}

                <TabsContent value="company" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="company-email">Email</Label>
                    <Input
                      id="company-email"
                      type="email"
                      placeholder="company@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loginMutation.isPending}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-password">Password</Label>
                    <Input
                      id="company-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loginMutation.isPending}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="user" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="user-email">Email</Label>
                    <Input
                      id="user-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loginMutation.isPending}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-password">Password</Label>
                    <Input
                      id="user-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loginMutation.isPending}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use the email and password provided by your company administrator
                  </p>
                </TabsContent>

                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={loginMutation.isPending}
                  />
                  <Label
                    htmlFor="remember-me"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>

                <Button type="submit" className="w-full mt-6 hover-lift cursor-pointer border" disabled={loginMutation.isPending}>
                  {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </Tabs>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don&apos;t have an account? </span>
              <Link href="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}