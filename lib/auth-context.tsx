"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, Company, UserRole } from "./types/index"
import { mockUsers, mockCompany } from "./mock-data"

interface AuthContextType {
  user: User | null
  company: Company | null
  isLoading: boolean
  login: (email: string, password: string, companyCode?: string) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => void
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean
}

interface RegisterData {
  type: "COMPANY" | "USER"
  email: string
  password: string
  name: string
  companyName?: string
  companyCode?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  console.log("The Complete Initial data of user", user)
  console.log("The Complete Initial data of company", company)
  useEffect(() => {
    const savedUser = localStorage.getItem("workflow_user")
    const savedCompany = localStorage.getItem("workflow_company")
    if (savedUser && savedCompany) {
      setUser(JSON.parse(savedUser))
      setCompany(JSON.parse(savedCompany))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, companyCode?: string): Promise<boolean> => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const foundUser = mockUsers.find((u) => u.email === email)
    if (foundUser) {
      if (companyCode && foundUser.companyId !== "comp_1") {
        setIsLoading(false)
        return false
      }
      setUser(foundUser)
      setCompany(mockCompany)
      localStorage.setItem("workflow_user", JSON.stringify(foundUser))
      localStorage.setItem("workflow_company", JSON.stringify(mockCompany))
      setIsLoading(false)
      return true
    }
    setIsLoading(false)
    return false
  }

  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (data.type === "COMPANY") {
      const newCompany: Company = {
        id: `comp_${Date.now()}`,
        name: data.companyName || "New Company",
        companyCode: `CODE${Date.now().toString().slice(-6)}`,
        trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
        plan: "trial",
      }
      const newUser: User = {
        id: `user_${Date.now()}`,
        email: data.email,
        name: data.name,
        role: "COMPANY",
        companyId: newCompany.id,
        joinDate: new Date().toISOString().split("T")[0],
        points: 0,
      }
      setUser(newUser)
      setCompany(newCompany)
      localStorage.setItem("workflow_user", JSON.stringify(newUser))
      localStorage.setItem("workflow_company", JSON.stringify(newCompany))
    } else {
      if (!data.companyCode) {
        setIsLoading(false)
        return false
      }
      const newUser: User = {
        id: `user_${Date.now()}`,
        email: data.email,
        name: data.name,
        role: "USER",
        companyId: "comp_1",
        joinDate: new Date().toISOString().split("T")[0],
        points: 0,
      }
      setUser(newUser)
      setCompany(mockCompany)
      localStorage.setItem("workflow_user", JSON.stringify(newUser))
      localStorage.setItem("workflow_company", JSON.stringify(mockCompany))
    }
    setIsLoading(false)
    return true
  }

  const logout = () => {
    setUser(null)
    setCompany(null)
    localStorage.removeItem("workflow_user")
    localStorage.removeItem("workflow_company")
  }

  const hasPermission = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (user.role === "COMPANY") return true
    if (user.role === "QC_ADMIN" && roles.includes("QC_ADMIN")) return true
    if (roles.includes("USER")) return true
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, company, isLoading, login, register, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
