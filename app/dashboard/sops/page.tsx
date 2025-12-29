// app/dashboard/sops/page.tsx
"use client"

import { useState, useRef, useCallback } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
  useSops,
  usePendingSops,
  useSopStats,
  useCreateSopWithUpload,
  useApproveSop,
  useRejectSop,
  useDeleteSop,
  useIncrementSopView,
  useSop,
} from "@/lib/hooks/use-sops"
import { formatFileSize, validateFile } from "../../../hooks/use-storage"
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
  X,
  CloudUpload,
  FileUp,
} from "lucide-react"
import { toast } from "sonner"
import type { SopType, Sop } from "@/lib/types/index"

export default function SOPsPage() {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedSopId, setSelectedSopId] = useState<string | null>(null)
  const [selectedSop, setSelectedSop] = useState<Sop | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    tags: [] as string[],
    tagInput: "",
    file: null as File | null,
    thumbnail: null as File | null,
  })

  const isAdmin = user?.role === "COMPANY" || user?.role === "QC_ADMIN"

  // Queries
  const { data: allSops, isLoading: allSopsLoading } = useSops({
    search: searchQuery || undefined,
    type: activeTab !== "all" && activeTab !== "pending" ? activeTab as SopType : undefined,
  })
  const { data: pendingSops, isLoading: pendingLoading } = usePendingSops()
  const { data: sopStats } = useSopStats()

  // Mutations
  const createSop = useCreateSopWithUpload()
  const approveSop = useApproveSop()
  const rejectSop = useRejectSop()
  const deleteSop = useDeleteSop()
  const incrementView = useIncrementSopView()

  const getFilteredSops = () => {
    if (activeTab === "pending") return pendingSops || []
    let sops = allSops || []
    if (searchQuery) {
      sops = sops.filter(sop =>
        sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sop.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
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

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      const validation = validateFile(file)
      if (!validation.valid) {
        toast.error(validation.error)
        return
      }
      setFormData(prev => ({
        ...prev,
        file,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "")
      }))
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const validation = validateFile(file)
      if (!validation.valid) {
        toast.error(validation.error)
        return
      }
      setFormData(prev => ({
        ...prev,
        file,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "")
      }))
    }
  }

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (!file.type.startsWith('image/')) {
        toast.error('Thumbnail must be an image')
        return
      }
      setFormData(prev => ({ ...prev, thumbnail: file }))
    }
  }

  const removeFile = () => {
    setFormData(prev => ({ ...prev, file: null }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeThumbnail = () => {
    setFormData(prev => ({ ...prev, thumbnail: null }))
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""
  }

  const getFileCategory = (mimeType: string): string => {
    if (mimeType.startsWith('video/')) return 'Video'
    if (mimeType.startsWith('image/')) return 'Image'
    if (mimeType === 'application/pdf') return 'PDF'
    return 'Document'
  }

  const handleCreateSop = async () => {
    if (!formData.file) {
      toast.error("Please select a file to upload")
      return
    }
    if (!formData.title.trim()) {
      toast.error("Title is required")
      return
    }

    try {
      await createSop.mutateAsync({
        file: formData.file,
        thumbnail: formData.thumbnail || undefined,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      })
      toast.success("SOP uploaded and submitted for approval!")
      setIsUploadOpen(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.message || "Failed to upload SOP")
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
    if (!selectedSop || !rejectionReason.trim()) {
      toast.error("Rejection reason is required")
      return
    }
    try {
      await rejectSop.mutateAsync({ id: selectedSop.id, rejectionReason: rejectionReason.trim() })
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

  // FIXED: View SOP handler - directly use the SOP data from the list
  const handleViewSop = async (sop: Sop) => {
    console.log("Opening SOP:", sop) // Debug log
    setSelectedSop(sop)
    setIsViewOpen(true)

    // Increment view count in background
    try {
      await incrementView.mutateAsync(sop.id)
    } catch (error) {
      console.error("Failed to increment view:", error)
    }
  }

  const handleAddTag = () => {
    const tag = formData.tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag], tagInput: "" }))
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const resetForm = () => {
    setFormData({ title: "", description: "", duration: "", tags: [], tagInput: "", file: null, thumbnail: null })
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""
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
        <Dialog open={isUploadOpen} onOpenChange={(open) => { setIsUploadOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button><Upload className="h-4 w-4 mr-2" />Upload SOP</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload New SOP</DialogTitle>
              <DialogDescription>Upload a video, image, PDF, or document. Content will be reviewed before publishing.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {/* Drag and Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : formData.file ? "border-green-500 bg-green-500/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {formData.file ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      {formData.file.type.startsWith('video/') && <Video className="h-12 w-12 text-green-500" />}
                      {formData.file.type.startsWith('image/') && <ImageIcon className="h-12 w-12 text-green-500" />}
                      {formData.file.type === 'application/pdf' && <FileText className="h-12 w-12 text-green-500" />}
                      {!formData.file.type.startsWith('video/') && !formData.file.type.startsWith('image/') && formData.file.type !== 'application/pdf' && <File className="h-12 w-12 text-green-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{formData.file.name}</p>
                      <p className="text-sm text-muted-foreground">{getFileCategory(formData.file.type)} • {formatFileSize(formData.file.size)}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={removeFile}><X className="h-4 w-4 mr-1" />Remove</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <CloudUpload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Drag and drop your file here</p>
                      <p className="text-sm text-muted-foreground">or click to browse</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Supports: MP4, WebM, JPG, PNG, GIF, PDF, DOC, DOCX (Max 100MB)</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="video/*,image/*,.pdf,.doc,.docx" onChange={handleFileSelect} />
              </div>

              {/* Thumbnail Upload */}
              {formData.file && (formData.file.type.startsWith('video/') || formData.file.type.startsWith('image/')) && (
                <div className="space-y-2">
                  <Label>Thumbnail (Optional)</Label>
                  {formData.thumbnail ? (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <img src={URL.createObjectURL(formData.thumbnail)} alt="Thumbnail" className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{formData.thumbnail.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(formData.thumbnail.size)}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={removeThumbnail}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <Input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailSelect} />
                  )}
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input placeholder="e.g., Employee Onboarding Guide" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Describe the SOP content..." rows={3} value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
              </div>

              {/* Duration (for videos) */}
              {formData.file?.type.startsWith('video/') && (
                <div className="space-y-2">
                  <Label>Duration (seconds)</Label>
                  <Input type="number" placeholder="120" value={formData.duration} onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))} />
                </div>
              )}

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input placeholder="Add a tag" value={formData.tagInput} onChange={(e) => setFormData(prev => ({ ...prev, tagInput: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag() } }} />
                  <Button type="button" variant="outline" onClick={handleAddTag}>Add</Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleRemoveTag(tag)}>{tag} ×</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button className="w-full" onClick={handleCreateSop} disabled={createSop.isPending || !formData.file}>
                {createSop.isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>) : (<><FileUp className="h-4 w-4 mr-2" />Upload & Submit for Approval</>)}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards for Admins */}
      {isAdmin && sopStats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{sopStats.total}</p><p className="text-sm text-muted-foreground">Total SOPs</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-500">{sopStats.approved}</p><p className="text-sm text-muted-foreground">Approved</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-500">{sopStats.pending}</p><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-500">{sopStats.rejected}</p><p className="text-sm text-muted-foreground">Rejected</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-500">{sopStats.totalViews || 0}</p><p className="text-sm text-muted-foreground">Total Views</p></CardContent></Card>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search SOPs..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All SOPs</TabsTrigger>
          <TabsTrigger value="VIDEO">Videos</TabsTrigger>
          <TabsTrigger value="PDF">Documents</TabsTrigger>
          <TabsTrigger value="IMAGE">Images</TabsTrigger>
          {isAdmin && <TabsTrigger value="pending" className="text-yellow-500">Pending ({pendingCount})</TabsTrigger>}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}><CardContent className="p-0"><Skeleton className="aspect-video rounded-t-lg" /><div className="p-4 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /></div></CardContent></Card>
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
                      {/* Thumbnail for VIDEO */}
                      {sop.type === "VIDEO" && (
                        <div
                          className="relative aspect-video bg-muted rounded-t-lg overflow-hidden cursor-pointer"
                          onClick={() => handleViewSop(sop)}
                        >
                          {sop.thumbnailUrl ? (
                            <img
                              src={sop.thumbnailUrl}
                              alt={sop.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-500/20 to-purple-500/20">
                              <Video className="h-16 w-16 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="secondary" className="rounded-full h-12 w-12">
                              <Play className="h-6 w-6" />
                            </Button>
                          </div>
                          {sop.duration && (
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {formatDuration(sop.duration)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Thumbnail for IMAGE */}
                      {sop.type === "IMAGE" && (
                        <div
                          className="relative aspect-video bg-muted rounded-t-lg overflow-hidden cursor-pointer"
                          onClick={() => handleViewSop(sop)}
                        >
                          <img
                            src={sop.fileUrl}
                            alt={sop.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="h-16 w-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>'
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="secondary" className="rounded-full h-12 w-12">
                              <Eye className="h-6 w-6" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Icon for PDF/DOCUMENT */}
                      {(sop.type === "PDF" || sop.type === "DOCUMENT") && (
                        <div
                          className="aspect-video bg-linear-to-br from-orange-500/10 to-red-500/10 rounded-t-lg flex items-center justify-center cursor-pointer group-hover:from-orange-500/20 group-hover:to-red-500/20 transition-colors"
                          onClick={() => handleViewSop(sop)}
                        >
                          <FileText className="h-16 w-16 text-orange-500/70" />
                        </div>
                      )}

                      {/* Icon for LINK */}
                      {sop.type === "LINK" && (
                        <div
                          className="aspect-video bg-linear-to-br from-green-500/10 to-teal-500/10 rounded-t-lg flex items-center justify-center cursor-pointer group-hover:from-green-500/20 group-hover:to-teal-500/20 transition-colors"
                          onClick={() => handleViewSop(sop)}
                        >
                          <LinkIcon className="h-16 w-16 text-green-500/70" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={`p-1.5 rounded ${status.bg}`}>
                              <TypeIcon className={`h-4 w-4 ${status.color.split(" ")[0]}`} />
                            </div>
                            <h3 className="font-medium text-foreground line-clamp-1">{sop.title}</h3>
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
                                    <Eye className="h-4 w-4 mr-2" />View
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => { setSelectedSop(sop); setIsDeleteOpen(true) }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>

                        {sop.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{sop.description}</p>
                        )}

                        {sop.tags && sop.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {sop.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                            {sop.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">+{sop.tags.length - 3}</Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={sop.createdBy?.avatar || ""} />
                              <AvatarFallback className="text-xs">
                                {sop.createdBy?.firstName?.[0]}{sop.createdBy?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {sop.createdBy?.firstName || "Unknown"} • {new Date(sop.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />{sop.viewCount}
                          </div>
                        </div>

                        {/* Admin Actions for Pending */}
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
                                <><CheckCircle2 className="h-4 w-4 mr-1" />Approve</>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => { setSelectedSop(sop); setIsRejectOpen(true) }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />Reject
                            </Button>
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {sop.status === "REJECTED" && sop.rejectionReason && (
                          <div className="mt-3 p-2 bg-red-500/10 rounded text-sm text-red-500">
                            <strong>Rejection reason:</strong> {sop.rejectionReason}
                          </div>
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
                {searchQuery ? "Try adjusting your search" : activeTab === "pending" ? "No pending SOPs to review" : "Get started by uploading your first SOP"}
              </p>
              {!searchQuery && activeTab !== "pending" && (
                <Button className="mt-4" onClick={() => setIsUploadOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />Upload SOP
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============================================ */}
      {/* VIEW SOP DIALOG - FIXED */}
      {/* ============================================ */}
      <Dialog open={isViewOpen} onOpenChange={(open) => {
        setIsViewOpen(open)
        if (!open) setSelectedSop(null)
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedSop ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const TypeIcon = typeIcons[selectedSop.type] || FileText
                    return <TypeIcon className="h-5 w-5" />
                  })()}
                  {selectedSop.title}
                </DialogTitle>
                {selectedSop.description && (
                  <DialogDescription>{selectedSop.description}</DialogDescription>
                )}
              </DialogHeader>

              <div className="space-y-4 pt-4">
                {/* VIDEO PLAYER */}
                {selectedSop.type === "VIDEO" && selectedSop.fileUrl && (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      key={selectedSop.fileUrl}
                      src={selectedSop.fileUrl}
                      controls
                      autoPlay={false}
                      className="w-full h-full"
                      poster={selectedSop.thumbnailUrl || undefined}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {/* IMAGE VIEWER */}
                {selectedSop.type === "IMAGE" && selectedSop.fileUrl && (
                  <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center p-4">
                    <img
                      key={selectedSop.fileUrl}
                      src={selectedSop.fileUrl}
                      alt={selectedSop.title}
                      className="max-w-full max-h-[60vh] object-contain rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg"
                      }}
                    />
                  </div>
                )}

                {/* PDF VIEWER */}
                {selectedSop.type === "PDF" && selectedSop.fileUrl && (
                  <div className="border rounded-lg overflow-hidden">
                    <iframe
                      key={selectedSop.fileUrl}
                      src={`${selectedSop.fileUrl}#toolbar=1&navpanes=0`}
                      className="w-full h-[60vh]"
                      title={selectedSop.title}
                    />
                  </div>
                )}

                {/* DOCUMENT */}
                {selectedSop.type === "DOCUMENT" && (
                  <div className="border rounded-lg p-8 text-center">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Document Preview Not Available</p>
                    <Button
                      className="mt-4"
                      onClick={() => window.open(selectedSop.fileUrl, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />Download Document
                    </Button>
                  </div>
                )}

                {/* LINK */}
                {selectedSop.type === "LINK" && (
                  <div className="border rounded-lg p-8 text-center">
                    <LinkIcon className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground break-all">{selectedSop.fileUrl}</p>
                    <Button
                      className="mt-4"
                      onClick={() => window.open(selectedSop.fileUrl, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />Open Link
                    </Button>
                  </div>
                )}

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-4">
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium">{selectedSop.type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant="outline" className={statusConfig[selectedSop.status]?.color}>
                      {selectedSop.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created by</p>
                    <p className="font-medium">
                      {selectedSop.createdBy?.firstName || "Unknown"} {selectedSop.createdBy?.lastName || ""}
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
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Open in New Tab Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(selectedSop.fileUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
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
                onClick={() => { setIsRejectOpen(false); setRejectionReason("") }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleRejectSop}
                disabled={rejectSop.isPending}
              >
                {rejectSop.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject SOP"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SOP?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "{selectedSop?.title}" and remove the file from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteSop}
            >
              {deleteSop.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}