export type UserRole = "user" | "qc_admin" | "company"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  companyId: string
  avatar?: string
  department?: string
  position?: string
  phone?: string
  joinDate: string
  isLead?: boolean
  points?: number
}

export interface Company {
  id: string
  name: string
  companyCode: string
  logo?: string
  trialEndsAt: string
  isActive: boolean
  createdAt: string
  plan: "trial" | "basic" | "pro" | "enterprise"
}

export interface Department {
  id: string
  name: string
  color: string
  leadId?: string
  memberCount: number
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  budget: number
  status: "planning" | "in_progress" | "review" | "completed"
  startDate: string
  endDate: string
  teamIds: string[]
  leadId: string
  progress: number
  createdAt: string
}

export interface SubProject {
  id: string
  projectId: string
  name: string
  description: string
  assigneeId: string
  status: "todo" | "in_progress" | "review" | "done"
  priority: "low" | "medium" | "high" | "urgent"
  points: number
  dueDate: string
  createdAt: string
}

export interface TimeEntry {
  id: string
  userId: string
  projectId: string
  subProjectId?: string
  startTime: string
  endTime?: string
  duration: number
  screenshots: string[]
  description?: string
}

export interface SOP {
  id: string
  title: string
  description: string
  type: "video" | "pdf" | "link" | "image"
  url: string
  thumbnailUrl?: string
  status: "pending" | "approved" | "rejected"
  createdBy: string
  approvedBy?: string
  createdAt: string
  updatedAt: string
  category: string
}

export interface ChatMessage {
  id: string
  roomId: string
  userId: string
  content: string
  createdAt: string
  attachments?: string[]
}

export interface ChatRoom {
  id: string
  projectId: string
  name: string
  memberIds: string[]
  hasQcAdmin: boolean
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  link?: string
  createdAt: string
}
