// src/app/dashboard/profile/page.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
    useProfile,
    useUpdateProfile,
    useChangePassword,
    useUploadAvatar,
    useDeleteAvatar,
    useProfileStats,
    useActivitySummary,
    useAchievements,
    useMyProjects,
    useRecentTimeTrackings,
    useProfileNotifications,
    useMarkNotificationsRead,
} from "@/lib/hooks/use-profile"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
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
    User,
    Mail,
    Phone,
    Building2,
    Calendar,
    Trophy,
    Target,
    Clock,
    TrendingUp,
    Award,
    FolderKanban,
    Camera,
    Pencil,
    Trash2,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    Bell,
    CheckCircle2,
    XCircle,
    Flame,
    Star,
    Medal,
    Crown,
    Zap,
    BarChart3,
    Activity,
    Shield,
    Settings,
    ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function ProfilePage() {
    const { user } = useAuthStore()
    const [activeTab, setActiveTab] = useState("overview")

    // Edit states
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isPasswordOpen, setIsPasswordOpen] = useState(false)
    const [isDeleteAvatarOpen, setIsDeleteAvatarOpen] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)

    // File upload ref
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Form states
    const [editForm, setEditForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        startDate: "",
    })

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    // Queries
    const { data: profile, isLoading: profileLoading } = useProfile()
    const { data: stats, isLoading: statsLoading } = useProfileStats()
    const { data: activity, isLoading: activityLoading } = useActivitySummary(30)
    const { data: achievementsData, isLoading: achievementsLoading } = useAchievements()
    const { data: projects, isLoading: projectsLoading } = useMyProjects()
    const { data: timeTrackings, isLoading: timeTrackingsLoading } = useRecentTimeTrackings(10)
    const { data: notifications, isLoading: notificationsLoading } = useProfileNotifications(false, 10)

    // Mutations
    const updateProfile = useUpdateProfile()
    const changePassword = useChangePassword()
    const uploadAvatar = useUploadAvatar()
    const deleteAvatar = useDeleteAvatar()
    const markNotificationsRead = useMarkNotificationsRead()

    // Initialize edit form when profile loads
    useEffect(() => {
        if (profile) {
            setEditForm({
                firstName: profile.firstName || "",
                lastName: profile.lastName || "",
                phone: profile.phone || "",
                startDate: profile.startDate?.split("T")[0] || "",
            })
        }
    }, [profile])

    // Handlers
    const handleUpdateProfile = async () => {
        if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
            toast.error("First name and last name are required")
            return
        }

        await updateProfile.mutateAsync({
            firstName: editForm.firstName.trim(),
            lastName: editForm.lastName.trim(),
            phone: editForm.phone.trim() || undefined,
            startDate: editForm.startDate || undefined,
        })

        setIsEditOpen(false)
    }

    const handleChangePassword = async () => {
        const { currentPassword, newPassword, confirmPassword } = passwordForm

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("All fields are required")
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match")
            return
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        try {
            await changePassword.mutateAsync({
                currentPassword,
                newPassword,
                confirmPassword,
            })

            setIsPasswordOpen(false)
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            })
        } catch (error) {
            // Error handled in mutation
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if (!allowedTypes.includes(file.type)) {
            toast.error("Only JPEG, PNG, GIF, and WebP images are allowed")
            return
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5MB")
            return
        }

        await uploadAvatar.mutateAsync(file)

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleDeleteAvatar = async () => {
        await deleteAvatar.mutateAsync()
        setIsDeleteAvatarOpen(false)
    }

    const handleMarkAllRead = async () => {
        await markNotificationsRead.mutateAsync()
    }

    // Role colors
    const roleColors: Record<string, string> = {
        COMPANY: "bg-yellow-500 text-white",
        QC_ADMIN: "bg-blue-500 text-white",
        USER: "bg-green-500 text-white",
        SUPER_ADMIN: "bg-purple-500 text-white",
    }

    // Achievement icon mapping
    const getAchievementIcon = (type: string) => {
        if (type.includes("TASK")) return <Target className="h-5 w-5" />
        if (type.includes("HOUR") || type.includes("TIME")) return <Clock className="h-5 w-5" />
        if (type.includes("STREAK")) return <Flame className="h-5 w-5" />
        if (type.includes("TOP") || type.includes("PERFORMER")) return <Crown className="h-5 w-5" />
        if (type.includes("TEAM") || type.includes("MENTOR")) return <User className="h-5 w-5" />
        return <Award className="h-5 w-5" />
    }

    // Status colors for projects
    const projectStatusColors: Record<string, string> = {
        PLANNING: "text-yellow-500 border-yellow-500 bg-yellow-500/10",
        IN_PROGRESS: "text-blue-500 border-blue-500 bg-blue-500/10",
        ON_HOLD: "text-orange-500 border-orange-500 bg-orange-500/10",
        COMPLETED: "text-green-500 border-green-500 bg-green-500/10",
        CANCELLED: "text-red-500 border-red-500 bg-red-500/10",
    }

    if (profileLoading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-32 w-full" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <Skeleton className="h-96" />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="p-6">
                <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Failed to load profile</p>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Profile Header */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                        {/* Avatar Section */}
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                <AvatarImage src={profile.avatar || ""} alt={profile.fullName} />
                                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                                </AvatarFallback>
                            </Avatar>

                            {/* Avatar Actions Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-white hover:bg-white/20"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadAvatar.isPending}
                                >
                                    {uploadAvatar.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Camera className="h-4 w-4" />
                                    )}
                                </Button>
                                {profile.avatar && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                        onClick={() => setIsDeleteAvatarOpen(true)}
                                        disabled={deleteAvatar.isPending}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-bold text-foreground">{profile.fullName}</h1>
                                <Badge className={roleColors[profile.role] || "bg-gray-500"}>
                                    {profile.role.replace("_", " ")}
                                </Badge>
                                {!profile.isActive && (
                                    <Badge variant="destructive">Inactive</Badge>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    {profile.email}
                                </span>
                                {profile.phone && (
                                    <span className="flex items-center gap-1">
                                        <Phone className="h-4 w-4" />
                                        {profile.phone}
                                    </span>
                                )}
                                {profile.department && (
                                    <span className="flex items-center gap-1">
                                        <Building2 className="h-4 w-4" />
                                        {profile.department.name}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-sm text-muted-foreground">
                                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                                </span>
                                {profile.startDate && (
                                    <>
                                        <span className="text-muted-foreground">•</span>
                                        <span className="text-sm text-muted-foreground">
                                            Started {new Date(profile.startDate).toLocaleDateString()}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Profile
                            </Button>
                            <Button variant="outline" onClick={() => setIsPasswordOpen(true)}>
                                <Lock className="h-4 w-4 mr-2" />
                                Change Password
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-500/10">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                                {statsLoading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    <p className="text-2xl font-bold">{stats?.totalPointsEarned || profile.points || 0}</p>
                                )}
                                <p className="text-sm text-muted-foreground">Total Points</p>
                            </div>
                        </div>
                        {stats && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Rank #{stats.leaderboardRank} in company
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <Target className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                {statsLoading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    <p className="text-2xl font-bold">{stats?.totalTasksCompleted || 0}</p>
                                )}
                                <p className="text-sm text-muted-foreground">Tasks Completed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Clock className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                {statsLoading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    <p className="text-2xl font-bold">{stats?.totalTimeFormatted || "0h"}</p>
                                )}
                                <p className="text-sm text-muted-foreground">Time Tracked</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                                <Flame className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                {statsLoading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    <p className="text-2xl font-bold">{stats?.currentStreak || 0} days</p>
                                )}
                                <p className="text-sm text-muted-foreground">Current Streak</p>
                            </div>
                        </div>
                        {stats && stats.longestStreak > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Best: {stats.longestStreak} days
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    {/* <TabsTrigger value="achievements">
                        Achievements ({achievementsData?.total || 0})
                    </TabsTrigger> */}
                    <TabsTrigger value="projects">
                        Projects ({stats?.projectsCount || 0})
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                        Notifications
                        {notifications?.unreadCount ? (
                            <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                                {notifications.unreadCount}
                            </Badge>
                        ) : null}
                    </TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Company Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Company Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Company</span>
                                    <span className="font-medium">{profile.company.name}</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Company Code</span>
                                    <code className="bg-muted px-2 py-1 rounded text-sm">
                                        {profile.company.companyCode}
                                    </code>
                                </div>
                                {profile.department && (
                                    <>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Department</span>
                                            <span className="font-medium">{profile.department.name}</span>
                                        </div>
                                        {profile.department.lead && (
                                            <>
                                                <Separator />
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Department Head</span>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={profile.department.lead.avatar || ""} />
                                                            <AvatarFallback className="text-xs">
                                                                {profile.department.lead.firstName?.[0]}
                                                                {profile.department.lead.lastName?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm">
                                                            {profile.department.lead.firstName} {profile.department.lead.lastName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Performance Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Performance Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-2xl font-bold">{stats?.projectsCount || 0}</p>
                                        <p className="text-xs text-muted-foreground">Projects</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-muted/50">
                                        <p className="text-2xl font-bold">{stats?.subProjectsCount || 0}</p>
                                        <p className="text-xs text-muted-foreground">Sub Projects</p>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">Achievements Unlocked</span>
                                        <span className="font-medium">{stats?.achievementsCount || 0}</span>
                                    </div>
                                    <Progress
                                        value={Math.min((stats?.achievementsCount || 0) * 5, 100)}
                                        className="h-2"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">Streak Progress</span>
                                        <span className="font-medium">{stats?.currentStreak || 0} / 30 days</span>
                                    </div>
                                    <Progress
                                        value={Math.min(((stats?.currentStreak || 0) / 30) * 100, 100)}
                                        className="h-2"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Time Trackings */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Recent Time Sessions
                                </CardTitle>
                                <CardDescription>Your latest time tracking activity</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {timeTrackingsLoading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <Skeleton key={i} className="h-16 w-full" />
                                    ))}
                                </div>
                            ) : timeTrackings && timeTrackings.length > 0 ? (
                                <div className="space-y-3">
                                    {timeTrackings.slice(0, 5).map((session) => (
                                        <div
                                            key={session.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${session.isActive ? "bg-green-500/10" : "bg-muted"}`}>
                                                    <Clock className={`h-4 w-4 ${session.isActive ? "text-green-500" : "text-muted-foreground"}`} />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{session.subProject.title}</p>
                                                    <p className="text-sm text-muted-foreground">{session.project.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{session.durationFormatted}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(session.startTime).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No time tracking sessions yet</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Activity Summary (Last 30 Days)
                            </CardTitle>
                            <CardDescription>Your daily productivity breakdown</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {activityLoading ? (
                                <div className="space-y-2">
                                    {[...Array(7)].map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
                            ) : activity && activity.length > 0 ? (
                                <div className="space-y-2">
                                    {activity.slice(0, 14).map((day) => {
                                        const hasActivity = day.minutesTracked > 0 || day.tasksCompleted > 0
                                        return (
                                            <div
                                                key={day.date}
                                                className={`flex items-center justify-between p-3 rounded-lg ${hasActivity ? "bg-muted/50" : "bg-muted/20"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 text-sm font-medium">
                                                        {new Date(day.date).toLocaleDateString("en-US", {
                                                            weekday: "short",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </div>
                                                    {hasActivity ? (
                                                        <div className="flex items-center gap-4">
                                                            <span className="flex items-center gap-1 text-sm">
                                                                <Clock className="h-3 w-3 text-blue-500" />
                                                                {Math.floor(day.minutesTracked / 60)}h {day.minutesTracked % 60}m
                                                            </span>
                                                            <span className="flex items-center gap-1 text-sm">
                                                                <Target className="h-3 w-3 text-green-500" />
                                                                {day.tasksCompleted} tasks
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">No activity</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {day.pointsEarned > 0 && (
                                                        <Badge variant="secondary">+{day.pointsEarned} pts</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No activity data available</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Achievements Tab */}
                {/* <TabsContent value="achievements" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5" />
                                Your Achievements
                            </CardTitle>
                            <CardDescription>Badges and milestones you've earned</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {achievementsLoading ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {[...Array(6)].map((_, i) => (
                                        <Skeleton key={i} className="h-24" />
                                    ))}
                                </div>
                            ) : achievementsData && achievementsData.achievements.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {achievementsData.achievements.map((achievement) => (
                                        <Card key={achievement.id} className="border-2 border-yellow-500/20 bg-yellow-500/5">
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-600">
                                                        {getAchievementIcon(achievement.type)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium">{achievement.title}</p>
                                                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Award className="h-12 w-12 mx-auto text-muted-foreground" />
                                    <p className="mt-4 text-muted-foreground">No achievements yet</p>
                                    <p className="text-sm text-muted-foreground">Complete tasks and track time to earn badges!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent> */}

                {/* Projects Tab */}
                <TabsContent value="projects" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FolderKanban className="h-5 w-5" />
                                My Projects
                            </CardTitle>
                            <CardDescription>Projects you're a member of</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {projectsLoading ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {[...Array(4)].map((_, i) => (
                                        <Skeleton key={i} className="h-32" />
                                    ))}
                                </div>
                            ) : projects && projects.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {projects.map((project) => (
                                        <Card key={project.id} className="hover:border-primary transition-colors">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <Link
                                                            href={`/dashboard/projects/${project.id}`}
                                                            className="font-medium hover:underline"
                                                        >
                                                            {project.name}
                                                        </Link>
                                                        <Badge
                                                            variant="outline"
                                                            className={`ml-2 ${projectStatusColors[project.status]}`}
                                                        >
                                                            {project.status.replace("_", " ")}
                                                        </Badge>
                                                    </div>
                                                    <Link href={`/dashboard/projects/${project.id}`}>
                                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                    </Link>
                                                </div>
                                                {project.description && (
                                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                                        {project.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {project._count?.members || 0} members
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Target className="h-3 w-3" />
                                                        {project._count?.subProjects || 0} tasks
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground" />
                                    <p className="mt-4 text-muted-foreground">No projects yet</p>
                                    <p className="text-sm text-muted-foreground">
                                        You'll see projects here once you're added to one
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Notifications
                                </CardTitle>
                                <CardDescription>
                                    {notifications?.unreadCount || 0} unread notifications
                                </CardDescription>
                            </div>
                            {notifications?.unreadCount ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMarkAllRead}
                                    disabled={markNotificationsRead.isPending}
                                >
                                    {markNotificationsRead.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Mark All Read"
                                    )}
                                </Button>
                            ) : null}
                        </CardHeader>
                        <CardContent>
                            {notificationsLoading ? (
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-16 w-full" />
                                    ))}
                                </div>
                            ) : notifications && notifications.notifications.length > 0 ? (
                                <div className="space-y-3">
                                    {notifications.notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className={`flex items-start gap-3 p-3 rounded-lg ${notif.isRead ? "bg-muted/30" : "bg-blue-500/10 border border-blue-500/20"
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg ${notif.isRead ? "bg-muted" : "bg-blue-500/20"}`}>
                                                <Bell className={`h-4 w-4 ${notif.isRead ? "text-muted-foreground" : "text-blue-500"}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{notif.title}</p>
                                                    {!notif.isRead && (
                                                        <Badge variant="secondary" className="text-xs">New</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">{notif.message}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(notif.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
                                    <p className="mt-4 text-muted-foreground">No notifications</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Account Settings
                            </CardTitle>
                            <CardDescription>Manage your account preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Profile Settings */}
                            <div>
                                <h3 className="text-sm font-medium mb-3">Profile Information</h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>First Name</Label>
                                        <Input value={profile.firstName} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Last Name</Label>
                                        <Input value={profile.lastName} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input value={profile.email} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input value={profile.phone || "Not set"} disabled />
                                    </div>
                                </div>
                                <Button className="mt-4" onClick={() => setIsEditOpen(true)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Profile
                                </Button>
                            </div>

                            <Separator />

                            {/* Security Settings */}
                            <div>
                                <h3 className="text-sm font-medium mb-3">Security</h3>
                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <Shield className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">Password</p>
                                            <p className="text-sm text-muted-foreground">Last changed: Unknown</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" onClick={() => setIsPasswordOpen(true)}>
                                        Change Password
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>Update your profile information</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input
                                    id="firstName"
                                    value={editForm.firstName}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                                    placeholder="John"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name *</Label>
                                <Input
                                    id="lastName"
                                    value={editForm.lastName}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                                    placeholder="Doe"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={editForm.phone}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                                placeholder="+1234567890"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={editForm.startDate}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateProfile} disabled={updateProfile.isPending}>
                            {updateProfile.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Enter your current password and choose a new one
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={passwordForm.currentPassword}
                                    onChange={(e) =>
                                        setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                                    }
                                    placeholder="Enter current password"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    value={passwordForm.newPassword}
                                    onChange={(e) =>
                                        setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                                    }
                                    placeholder="Enter new password"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Min 8 characters with uppercase, lowercase, number, and special character
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) =>
                                    setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                                }
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleChangePassword} disabled={changePassword.isPending}>
                            {changePassword.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Changing...
                                </>
                            ) : (
                                "Change Password"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Avatar Confirmation */}
            <AlertDialog open={isDeleteAvatarOpen} onOpenChange={setIsDeleteAvatarOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Avatar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove your profile picture. You can upload a new one at any time.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeleteAvatar}
                        >
                            {deleteAvatar.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}