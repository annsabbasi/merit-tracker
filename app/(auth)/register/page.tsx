// src/app/auth/register/page.tsx
"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRegisterCompany, useRegisterUser } from "@/lib/hooks"
import { getErrorMessage } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import { Loader2, Building2, User, AlertCircle, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegisterPage() {
  const [error, setError] = useState("")
  const [registerType, setRegisterType] = useState<"company" | "user">("company")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyCode: "",
    phone: "",
  })

  const registerCompanyMutation = useRegisterCompany()
  const registerUserMutation = useRegisterUser()

  const isLoading = registerCompanyMutation.isPending || registerUserMutation.isPending
  const mutationError = registerCompanyMutation.error || registerUserMutation.error

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setError("")

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required")
      return
    }

    if (registerType === "company") {
      if (!formData.companyName.trim()) {
        setError("Company name is required")
        return
      }

      // Register company with admin
      registerCompanyMutation.mutate({
        companyName: formData.companyName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || undefined,
      })
    } else {
      if (!formData.companyCode.trim()) {
        setError("Company code is required")
        return
      }

      // Register user to existing company
      registerUserMutation.mutate({
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        companyCode: formData.companyCode.trim(),
        phone: formData.phone.trim() || undefined,
      })
    }
  }

  const updateForm = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">WF</span>
          </div>
          <span className="font-semibold text-foreground">WorkFlow Pro</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>Get started with your free trial</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={registerType} onValueChange={(v) => setRegisterType(v as "company" | "user")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="company" className="flex items-center gap-2 hover-lift cursor-pointer border-sidebar-border">
                  <Building2 className="h-4 w-4" />
                  Company
                </TabsTrigger>
                <TabsTrigger value="user" className="flex items-center gap-2 hover-lift cursor-pointer border-sidebar-border">
                  <User className="h-4 w-4" />
                  User
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} noValidate>
                {(error || mutationError) && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {error || getErrorMessage(mutationError)}
                    </AlertDescription>
                  </Alert>
                )}

                <TabsContent value="company" className="space-y-4 mt-0">
                  <div className="p-3 rounded-lg bg-chart-2/10 border border-chart-2/20 flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-chart-2" />
                    <span className="text-chart-2 font-medium">3 days free trial included!</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company-name-input">Company Name</Label>
                    <Input
                      id="company-name-input"
                      placeholder="Acme Inc."
                      value={formData.companyName}
                      onChange={(e) => updateForm("companyName", e.target.value)}
                      disabled={isLoading}
                      required
                      autoComplete="organization"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="admin-first-name">First Name</Label>
                      <Input
                        id="admin-first-name"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => updateForm("firstName", e.target.value)}
                        disabled={isLoading}
                        required
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-last-name">Last Name</Label>
                      <Input
                        id="admin-last-name"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => updateForm("lastName", e.target.value)}
                        disabled={isLoading}
                        required
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-email-reg">Email</Label>
                    <Input
                      id="company-email-reg"
                      type="email"
                      placeholder="admin@company.com"
                      value={formData.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      disabled={isLoading}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-phone">Phone (Optional)</Label>
                    <Input
                      id="company-phone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={formData.phone}
                      onChange={(e) => updateForm("phone", e.target.value)}
                      disabled={isLoading}
                      autoComplete="tel"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="company-password">Password</Label>
                      <Input
                        id="company-password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => updateForm("password", e.target.value)}
                        disabled={isLoading}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-confirm">Confirm</Label>
                      <Input
                        id="company-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => updateForm("confirmPassword", e.target.value)}
                        disabled={isLoading}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="user" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="user-company-code-reg">Company Code</Label>
                    <Input
                      id="user-company-code-reg"
                      placeholder="Enter company code"
                      value={formData.companyCode}
                      onChange={(e) => updateForm("companyCode", e.target.value)}
                      disabled={isLoading}
                      required={registerType === "user"}
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">Get this code from your company administrator</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="user-first-name">First Name</Label>
                      <Input
                        id="user-first-name"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => updateForm("firstName", e.target.value)}
                        disabled={isLoading}
                        required
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-last-name">Last Name</Label>
                      <Input
                        id="user-last-name"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => updateForm("lastName", e.target.value)}
                        disabled={isLoading}
                        required
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email-reg">Email</Label>
                    <Input
                      id="user-email-reg"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      disabled={isLoading}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-phone">Phone (Optional)</Label>
                    <Input
                      id="user-phone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={formData.phone}
                      onChange={(e) => updateForm("phone", e.target.value)}
                      disabled={isLoading}
                      autoComplete="tel"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="user-password">Password</Label>
                      <Input
                        id="user-password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => updateForm("password", e.target.value)}
                        disabled={isLoading}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-confirm">Confirm</Label>
                      <Input
                        id="user-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => updateForm("confirmPassword", e.target.value)}
                        disabled={isLoading}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </TabsContent>

                <Button type="submit" className="w-full mt-6 hover-lift cursor-pointer border" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </Tabs>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}