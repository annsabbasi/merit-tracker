// app/dashboard/sops/page.tsx
"use client"

import { useState, useRef } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
  useSops,
  useApprovedSops,
  usePendingSops,
  useSopStats,
  useCreateSop,
  useApproveSop,
  useRejectSop,
  useDeleteSop,
  useIncrementSopView,
} from "@/lib/hooks/use-sops"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Video,
  FileText,
  LinkIcon,
  ImageIcon,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  Play,
  ExternalLink,
  Eye,
  MoreVertical,
  Trash2,
  Loader2,
  FileVideo,
  File,
} from "lucide-react"
import { toast } from "sonner"
import type { SopType, SopStatus, Sop } from "@/lib/types/index"

export default function SOPsPage() {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedSop, setSelectedSop] = useState<Sop | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state for creating SOP
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "" as SopType | "",
    fileUrl: "",
    thumbnailUrl: "",
    duration: "",
    tags: [] as string[],
    tagInput: "",
  })

  // Check permissions
  const isAdmin = user?.role === "COMPANY_ADMIN" || user?.role === "QC_ADMIN"

  // Fetch data using hooks - conditionally based on tab and role
  const { data: allSops, isLoading: allSopsLoading } = useSops({
    search: searchQuery || undefined,
    type: activeTab !== "all" && activeTab !== "pending" ? activeTab as SopType : undefined,
  })
  const { data: pendingSops, isLoading: pendingLoading } = usePendingSops()
  const { data: sopStats } = useSopStats()

  // Mutations
  const createSop = useCreateSop()
  const approveSop = useApproveSop()
  const rejectSop = useRejectSop()
  const deleteSop = useDeleteSop()
  const incrementView = useIncrementSopView()

  // Filter SOPs based on active tab
  const getFilteredSops = () => {
    if (activeTab === "pending") {
      return pendingSops || []
    }

    let sops = allSops || []

    // Filter by search
    if (searchQuery) {
      sops = sops.filter(sop =>
        sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sop.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by type
    if (activeTab !== "all") {
      sops = sops.filter(sop => sop.type === activeTab.toUpperCase())
    }

    return sops
  }

  const filteredSOPs = getFilteredSops()
  const isLoading = activeTab === "pending" ? pendingLoading : allSopsLoading

  const typeIcons: Record<string, any> = {
    VIDEO: Video,
    DOCUMENT: FileText,
    PDF: FileText,
    LINK: LinkIcon,
    IMAGE: ImageIcon,
  }

  const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
    APPROVED: { icon: CheckCircle2, color: "text-green-500 border-green-500", bg: "bg-green-500/10" },
    PENDING_APPROVAL: { icon: Clock, color: "text-yellow-500 border-yellow-500", bg: "bg-yellow-500/10" },
    REJECTED: { icon: XCircle, color: "text-red-500 border-red-500", bg: "bg-red-500/10" },
    DRAFT: { icon: FileText, color: "text-gray-500 border-gray-500", bg: "bg-gray-500/10" },
  }

  // Handlers
  const handleCreateSop = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!formData.type) {
      toast.error("Type is required")
      return
    }
    if (!formData.fileUrl.trim()) {
      toast.error("File URL is required")
      return
    }

    try {
      await createSop.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type as SopType,
        fileUrl: formData.fileUrl,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      })

      toast.success("SOP submitted for approval!")
      setIsUploadOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to create SOP")
    }
  }

  const handleApproveSop = async (sop: Sop) => {
    try {
      await approveSop.mutateAsync({ id: sop.id })
      toast.success("SOP approved!")
    } catch (error) {
      toast.error("Failed to approve SOP")
    }
  }

  const handleRejectSop = async () => {
    if (!selectedSop) return
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required")
      return
    }

    try {
      await rejectSop.mutateAsync({
        id: selectedSop.id,
        rejectionReason: rejectionReason,
      })
      toast.success("SOP rejected")
      setIsRejectOpen(false)
      setSelectedSop(null)
      setRejectionReason("")
    } catch (error) {
      toast.error("Failed to reject SOP")
    }
  }

  const handleDeleteSop = async () => {
    if (!selectedSop) return

    try {
      await deleteSop.mutateAsync(selectedSop.id)
      toast.success("SOP deleted!")
      setIsDeleteOpen(false)
      setSelectedSop(null)
    } catch (error) {
      toast.error("Failed to delete SOP")
    }
  }

  const handleViewSop = async (sop: Sop) => {
    setSelectedSop(sop)
    setIsViewOpen(true)
    // Increment view count
    try {
      await incrementView.mutateAsync(sop.id)
    } catch (error) {
      // Silent fail for view count
    }
  }

  const handleAddTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: "",
      }))
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }))
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "",
      fileUrl: "",
      thumbnailUrl: "",
      duration: "",
      tags: [],
      tagInput: "",
    })
  }

  const openRejectDialog = (sop: Sop) => {
    setSelectedSop(sop)
    setIsRejectOpen(true)
  }

  const openDeleteDialog = (sop: Sop) => {
    setSelectedSop(sop)
    setIsDeleteOpen(true)
  }

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return null
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const pendingCount = sopStats?.pending || pendingSops?.length || 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SOPs Management</h1>
          <p className="text-muted-foreground">Standard Operating Procedures and documentation</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload SOP
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload New SOP</DialogTitle>
              <DialogDescription>
                Upload documentation for approval. Content will be reviewed before publishing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="e.g., Employee Onboarding Guide"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the SOP content..."
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as SopType }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIDEO">Video</SelectItem>
                      <SelectItem value="PDF">PDF Document</SelectItem>
                      <SelectItem value="DOCUMENT">Document</SelectItem>
                      <SelectItem value="LINK">External Link</SelectItem>
                      <SelectItem value="IMAGE">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.type === "VIDEO" && (
                  <div className="space-y-2">
                    <Label>Duration (seconds)</Label>
                    <Input
                      type="number"
                      placeholder="120"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>File URL *</Label>
                <Input
                  placeholder="https://example.com/file.pdf"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, fileUrl: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the URL where the file is hosted (e.g., cloud storage link)
                </p>
              </div>
              {(formData.type === "VIDEO" || formData.type === "IMAGE") && (
                <div className="space-y-2">
                  <Label>Thumbnail URL</Label>
                  <Input
                    placeholder="https://example.com/thumbnail.jpg"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={formData.tagInput}
                    onChange={(e) => setFormData(prev => ({ ...prev, tagInput: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button
                className="w-full"
                onClick={handleCreateSop}
                disabled={createSop.isPending}
              >
                {createSop.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Approval"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards for Admins */}
      {isAdmin && sopStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{sopStats.total}</p>
              <p className="text-sm text-muted-foreground">Total SOPs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{sopStats.approved}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{sopStats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{sopStats.rejected}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search SOPs..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All SOPs</TabsTrigger>
          <TabsTrigger value="VIDEO">Videos</TabsTrigger>
          <TabsTrigger value="PDF">Documents</TabsTrigger>
          <TabsTrigger value="LINK">Links</TabsTrigger>
          <TabsTrigger value="IMAGE">Images</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="pending" className="text-yellow-500">
              Pending ({pendingCount})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="aspect-video rounded-t-lg" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSOPs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSOPs.map((sop) => {
                const TypeIcon = typeIcons[sop.type] || FileText
                const status = statusConfig[sop.status] || statusConfig.DRAFT
                const StatusIcon = status.icon
                const canDelete = sop.createdById === user?.id || isAdmin

                return (
                  <Card key={sop.id} className="group hover:border-primary transition-colors overflow-hidden">
                    <CardContent className="p-0">
                      {/* Thumbnail for videos and images */}
                      {(sop.type === "VIDEO" || sop.type === "IMAGE") && (
                        <div
                          className="relative aspect-video bg-muted rounded-t-lg overflow-hidden cursor-pointer"
                          onClick={() => handleViewSop(sop)}
                        >
                          {sop.thumbnailUrl || sop.fileUrl ? (
                            <img
                              src={sop.thumbnailUrl || sop.fileUrl}
                              alt={sop.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.svg"
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <TypeIcon className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="secondary" className="rounded-full">
                              {sop.type === "VIDEO" ? <Play className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                            </Button>
                          </div>
                          {sop.type === "VIDEO" && sop.duration && (
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {formatDuration(sop.duration)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={`p-1.5 rounded ${status.bg}`}>
                              <TypeIcon className={`h-4 w-4 ${status.color.split(" ")[0]}`} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-medium text-foreground line-clamp-1">{sop.title}</h3>
                              {sop.tags && sop.tags.length > 0 && (
                                <p className="text-xs text-muted-foreground">{sop.tags[0]}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {sop.status.replace("_", " ")}
                            </Badge>
                            {canDelete && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewSop(sop)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => openDeleteDialog(sop)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>

                        {sop.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {sop.description}
                          </p>
                        )}

                        {/* Tags */}
                        {sop.tags && sop.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {sop.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {sop.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{sop.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={sop.createdBy?.avatar || ""} />
                              <AvatarFallback className="text-xs">
                                {sop.createdBy?.firstName?.[0]}
                                {sop.createdBy?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {sop.createdBy?.firstName} • {new Date(sop.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {sop.viewCount}
                          </div>
                        </div>

                        {/* Action buttons for pending SOPs */}
                        {sop.status === "PENDING_APPROVAL" && isAdmin && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-500 hover:bg-green-600"
                              onClick={() => handleApproveSop(sop)}
                              disabled={approveSop.isPending}
                            >
                              {approveSop.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => openRejectDialog(sop)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {/* Rejection reason */}
                        {sop.status === "REJECTED" && sop.rejectionReason && (
                          <div className="mt-3 p-2 bg-red-500/10 rounded text-sm text-red-500">
                            <strong>Rejection reason:</strong> {sop.rejectionReason}
                          </div>
                        )}

                        {/* Open link button */}
                        {sop.type === "LINK" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => window.open(sop.fileUrl, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Link
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileVideo className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-foreground">No SOPs found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search"
                  : activeTab === "pending"
                    ? "No pending SOPs to review"
                    : "Get started by uploading your first SOP"}
              </p>
              {!searchQuery && activeTab !== "pending" && (
                <Button className="mt-4" onClick={() => setIsUploadOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload SOP
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View SOP Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedSop && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSop.title}</DialogTitle>
                <DialogDescription>
                  {selectedSop.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {/* Media preview */}
                {selectedSop.type === "VIDEO" && (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      src={selectedSop.fileUrl}
                      controls
                      className="w-full h-full"
                      poster={selectedSop.thumbnailUrl || undefined}
                    />
                  </div>
                )}
                {selectedSop.type === "IMAGE" && (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={selectedSop.fileUrl}
                      alt={selectedSop.title}
                      className="w-full h-auto"
                    />
                  </div>
                )}
                {(selectedSop.type === "PDF" || selectedSop.type === "DOCUMENT") && (
                  <div className="border rounded-lg p-8 text-center">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Document Preview</p>
                    <Button
                      className="mt-4"
                      onClick={() => window.open(selectedSop.fileUrl, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Document
                    </Button>
                  </div>
                )}
                {selectedSop.type === "LINK" && (
                  <div className="border rounded-lg p-8 text-center">
                    <LinkIcon className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground break-all">{selectedSop.fileUrl}</p>
                    <Button
                      className="mt-4"
                      onClick={() => window.open(selectedSop.fileUrl, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Link
                    </Button>
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium">{selectedSop.type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge
                      variant="outline"
                      className={statusConfig[selectedSop.status]?.color}
                    >
                      {selectedSop.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created by</p>
                    <p className="font-medium">
                      {selectedSop.createdBy?.firstName} {selectedSop.createdBy?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Views</p>
                    <p className="font-medium">{selectedSop.viewCount}</p>
                  </div>
                </div>

                {/* Tags */}
                {selectedSop.tags && selectedSop.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSop.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject SOP</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{selectedSop?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Textarea
                placeholder="Explain why this SOP is being rejected..."
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsRejectOpen(false)
                  setRejectionReason("")
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleRejectSop}
                disabled={rejectSop.isPending}
              >
                {rejectSop.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Reject SOP"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SOP?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the SOP
              "{selectedSop?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteSop}
            >
              {deleteSop.isPending ? (
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