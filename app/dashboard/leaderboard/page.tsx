// app/dashboard/leaderboard/page.tsx
"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
    useCompanyLeaderboard,
    useMyPerformance,
    formatPerformanceScore,
    getTrendInfo,
    getRankBadgeColor,
    getAchievementIcon,
    formatPeriodLabel,
} from "@/lib/hooks/use-leaderboard"
import { useProjects } from "@/lib/hooks/use-projects"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Trophy,
    Medal,
    TrendingUp,
    TrendingDown,
    Minus,
    Clock,
    Target,
    Flame,
    Award,
    Calendar,
    BarChart3,
    Users,
    Star,
    Zap,
} from "lucide-react"
import type { LeaderboardPeriod } from "@/lib/types/index"

export default function LeaderboardPage() {
    const { user } = useAuthStore()
    const [period, setPeriod] = useState<LeaderboardPeriod>('WEEKLY')
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all')

    // Fetch data
    const { data: leaderboard, isLoading: leaderboardLoading } = useCompanyLeaderboard({
        period,
        projectId: selectedProjectId !== 'all' ? selectedProjectId : undefined,
        limit: 50,
    })
    const { data: myPerformance, isLoading: performanceLoading } = useMyPerformance({ period })
    const { data: projects } = useProjects()

    // Find current user's rank
    const myRank = leaderboard?.leaderboard.find(entry => entry.user.id === user?.id)

    const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="h-4 w-4 text-green-500" />
            case 'down':
                return <TrendingDown className="h-4 w-4 text-red-500" />
            default:
                return <Minus className="h-4 w-4 text-muted-foreground" />
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Trophy className="h-7 w-7 text-yellow-500" />
                        Leaderboard
                    </h1>
                    <p className="text-muted-foreground">Track performance and compete with your team</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Period Filter */}
                    <Select value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}>
                        <SelectTrigger className="w-36">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DAILY">Today</SelectItem>
                            <SelectItem value="WEEKLY">This Week</SelectItem>
                            <SelectItem value="MONTHLY">This Month</SelectItem>
                            <SelectItem value="QUARTERLY">This Quarter</SelectItem>
                            <SelectItem value="YEARLY">This Year</SelectItem>
                            <SelectItem value="ALL_TIME">All Time</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Project Filter */}
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="w-44">
                            <Users className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects?.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* My Performance Summary */}
            {performanceLoading ? (
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
            ) : myPerformance && (
                <div className="grid gap-4 md:grid-cols-4">
                    {/* My Rank */}
                    <Card className="border-primary/50">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Your Rank</p>
                                    <p className="text-3xl font-bold text-foreground">
                                        #{myPerformance.rank.current || '-'}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-full ${getRankBadgeColor(myPerformance.rank.current)}`}>
                                    <Trophy className="h-6 w-6" />
                                </div>
                            </div>
                            {myPerformance.rank.change !== 0 && (
                                <div className={`flex items-center gap-1 mt-2 text-sm ${myPerformance.rank.change > 0 ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                    {myPerformance.rank.change > 0 ? (
                                        <TrendingUp className="h-3 w-3" />
                                    ) : (
                                        <TrendingDown className="h-3 w-3" />
                                    )}
                                    <span>{Math.abs(myPerformance.rank.change)} positions</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Performance Score */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Performance Score</p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {formatPerformanceScore(myPerformance.currentPeriod.performanceScore)}
                                    </p>
                                </div>
                                <div className="p-3 rounded-full bg-blue-500/10">
                                    <BarChart3 className="h-6 w-6 text-blue-500" />
                                </div>
                            </div>
                            <div className="mt-2">
                                <Progress value={myPerformance.currentPeriod.performanceScore} className="h-1.5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tasks Completed */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Tasks Completed</p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {myPerformance.currentPeriod.tasksCompleted}
                                    </p>
                                </div>
                                <div className="p-3 rounded-full bg-green-500/10">
                                    <Target className="h-6 w-6 text-green-500" />
                                </div>
                            </div>
                            {myPerformance.change.tasksCompletedChange !== 0 && (
                                <p className={`text-sm mt-2 ${myPerformance.change.tasksCompletedChange > 0 ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                    {myPerformance.change.tasksCompletedChange > 0 ? '+' : ''}
                                    {myPerformance.change.tasksCompletedChange} from last period
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Current Streak */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Current Streak</p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {myPerformance.streaks.current} days
                                    </p>
                                </div>
                                <div className="p-3 rounded-full bg-orange-500/10">
                                    <Flame className="h-6 w-6 text-orange-500" />
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Longest: {myPerformance.streaks.longest} days
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs for different views */}
            <Tabs defaultValue="rankings" className="w-full">
                <TabsList>
                    <TabsTrigger value="rankings">Rankings</TabsTrigger>
                    <TabsTrigger value="achievements">My Achievements</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                {/* Rankings Tab */}
                <TabsContent value="rankings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Medal className="h-5 w-5" />
                                {formatPeriodLabel(period)} Rankings
                            </CardTitle>
                            <CardDescription>
                                {leaderboard?.totalParticipants || 0} participants
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {leaderboardLoading ? (
                                <div className="space-y-3">
                                    {[...Array(10)].map((_, i) => (
                                        <Skeleton key={i} className="h-16" />
                                    ))}
                                </div>
                            ) : leaderboard && leaderboard.leaderboard.length > 0 ? (
                                <div className="space-y-3">
                                    {leaderboard.leaderboard.map((entry, index) => {
                                        const isCurrentUser = entry.user.id === user?.id

                                        return (
                                            <div
                                                key={entry.user.id}
                                                className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${isCurrentUser
                                                        ? 'bg-primary/10 border border-primary'
                                                        : 'bg-muted/50 hover:bg-muted'
                                                    }`}
                                            >
                                                {/* Rank */}
                                                <span
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadgeColor(entry.rank)
                                                        }`}
                                                >
                                                    {entry.rank}
                                                </span>

                                                {/* User Info */}
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={entry.user.avatar || ""} />
                                                    <AvatarFallback>
                                                        {entry.user.firstName?.[0]}
                                                        {entry.user.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-foreground truncate">
                                                            {entry.user.firstName} {entry.user.lastName}
                                                        </p>
                                                        {isCurrentUser && (
                                                            <Badge variant="outline" className="text-xs">You</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Target className="h-3 w-3" />
                                                            {entry.metrics.tasksCompleted} tasks
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {entry.metrics.totalHours.toFixed(1)}h
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Trend */}
                                                <div className="flex items-center gap-2">
                                                    <TrendIcon trend={entry.trend} />
                                                </div>

                                                {/* Score */}
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-foreground">
                                                        {formatPerformanceScore(entry.performanceScore)}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">score</p>
                                                </div>

                                                {/* Points */}
                                                <div className="text-right min-w-[80px]">
                                                    <p className="font-semibold text-foreground">
                                                        {entry.metrics.pointsEarned}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">points</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground" />
                                    <p className="mt-4 text-muted-foreground">No rankings yet for this period</p>
                                    <p className="text-sm text-muted-foreground">
                                        Complete tasks and track time to appear on the leaderboard
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Achievements Tab */}
                <TabsContent value="achievements" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5" />
                                Your Achievements
                            </CardTitle>
                            <CardDescription>
                                Badges and milestones you've earned
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {performanceLoading ? (
                                <div className="grid gap-4 md:grid-cols-3">
                                    {[...Array(6)].map((_, i) => (
                                        <Skeleton key={i} className="h-24" />
                                    ))}
                                </div>
                            ) : myPerformance?.achievements && myPerformance.achievements.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-3">
                                    {myPerformance.achievements.map((achievement, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border"
                                        >
                                            <span className="text-3xl">
                                                {getAchievementIcon(achievement.type)}
                                            </span>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {achievement.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {achievement.description}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Star className="h-12 w-12 mx-auto text-muted-foreground" />
                                    <p className="mt-4 text-muted-foreground">No achievements yet</p>
                                    <p className="text-sm text-muted-foreground">
                                        Complete tasks and maintain streaks to unlock achievements
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Recent Activity Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5" />
                                    Recent Activity
                                </CardTitle>
                                <CardDescription>
                                    Your work over the past 14 days
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {performanceLoading ? (
                                    <Skeleton className="h-48" />
                                ) : myPerformance?.recentActivity && myPerformance.recentActivity.length > 0 ? (
                                    <div className="space-y-2">
                                        {myPerformance.recentActivity.slice(0, 7).map((activity, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 rounded bg-muted/30"
                                            >
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(activity.date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                                <div className="flex-1 mx-4">
                                                    <Progress
                                                        value={Math.min((activity.minutesWorked / 480) * 100, 100)}
                                                        className="h-2"
                                                    />
                                                </div>
                                                <span className="text-sm font-medium">
                                                    {Math.round(activity.minutesWorked / 60 * 10) / 10}h
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Clock className="h-8 w-8 mx-auto text-muted-foreground" />
                                        <p className="mt-2 text-muted-foreground">No recent activity</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* All-Time Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    All-Time Stats
                                </CardTitle>
                                <CardDescription>
                                    Your cumulative performance
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {performanceLoading ? (
                                    <div className="space-y-4">
                                        {[...Array(4)].map((_, i) => (
                                            <Skeleton key={i} className="h-12" />
                                        ))}
                                    </div>
                                ) : myPerformance?.allTimeStats ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <Target className="h-5 w-5 text-green-500" />
                                                <span className="text-muted-foreground">Total Tasks</span>
                                            </div>
                                            <span className="text-xl font-bold">
                                                {myPerformance.allTimeStats.totalTasksCompleted}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <Clock className="h-5 w-5 text-blue-500" />
                                                <span className="text-muted-foreground">Total Hours</span>
                                            </div>
                                            <span className="text-xl font-bold">
                                                {myPerformance.allTimeStats.totalTimeHours.toFixed(1)}h
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <Trophy className="h-5 w-5 text-yellow-500" />
                                                <span className="text-muted-foreground">Total Points</span>
                                            </div>
                                            <span className="text-xl font-bold">
                                                {myPerformance.user.totalPoints}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <Flame className="h-5 w-5 text-orange-500" />
                                                <span className="text-muted-foreground">Longest Streak</span>
                                            </div>
                                            <span className="text-xl font-bold">
                                                {myPerformance.streaks.longest} days
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground" />
                                        <p className="mt-2 text-muted-foreground">No stats available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}