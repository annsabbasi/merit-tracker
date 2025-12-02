"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { mockSOPs, mockUsers } from "@/lib/mock-data"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
} from "lucide-react"

export default function SOPsPage() {
  const { hasPermission } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const filteredSOPs = mockSOPs.filter((sop) => {
    const matchesSearch = sop.title.toLowerCase().includes(searchQuery.toLowerCase())
    if (activeTab === "all") return matchesSearch
    if (activeTab === "pending") return matchesSearch && sop.status === "pending"
    return matchesSearch && sop.type === activeTab
  })

  const typeIcons = {
    video: Video,
    pdf: FileText,
    link: LinkIcon,
    image: ImageIcon,
  }

  const statusConfig = {
    approved: { icon: CheckCircle2, color: "text-chart-2 border-chart-2", bg: "bg-chart-2/10" },
    pending: { icon: Clock, color: "text-chart-3 border-chart-3", bg: "bg-chart-3/10" },
    rejected: { icon: XCircle, color: "text-destructive border-destructive", bg: "bg-destructive/10" },
  }

  return (
    <div className="p-6 space-y-6">
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload New SOP</DialogTitle>
              <DialogDescription>
                Upload documentation for approval. Videos will be reviewed by QC Admin before publishing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="e.g., Employee Onboarding Guide" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Describe the SOP content..." rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>File / URL</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Drag and drop your file here, or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports: MP4, PDF, PNG, JPG (max 100MB)</p>
                </div>
              </div>
              <Button className="w-full">Submit for Approval</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All SOPs</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="pdf">Documents</TabsTrigger>
          <TabsTrigger value="link">Links</TabsTrigger>
          <TabsTrigger value="image">Images</TabsTrigger>
          {hasPermission(["company", "qc_admin"]) && (
            <TabsTrigger value="pending" className="text-chart-3">
              Pending ({mockSOPs.filter((s) => s.status === "pending").length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSOPs.map((sop) => {
              const TypeIcon = typeIcons[sop.type]
              const status = statusConfig[sop.status]
              const StatusIcon = status.icon
              const creator = mockUsers.find((u) => u.id === sop.createdBy)

              return (
                <Card key={sop.id} className="group hover:border-primary transition-colors">
                  <CardContent className="p-0">
                    {sop.type === "video" && sop.thumbnailUrl && (
                      <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                        <img
                          src={sop.thumbnailUrl || "/placeholder.svg"}
                          alt={sop.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="secondary" className="rounded-full">
                            <Play className="h-6 w-6" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {sop.type === "image" && (
                      <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                        <img
                          src={sop.url || "/placeholder.svg"}
                          alt={sop.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="secondary" className="rounded-full">
                            <Eye className="h-6 w-6" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded ${status.bg}`}>
                            <TypeIcon className={`h-4 w-4 ${status.color.split(" ")[0]}`} />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground line-clamp-1">{sop.title}</h3>
                            <p className="text-xs text-muted-foreground">{sop.category}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {sop.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{sop.description}</p>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          By {creator?.name} • {new Date(sop.createdAt).toLocaleDateString()}
                        </span>
                        {sop.type === "link" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                        )}
                      </div>
                      {sop.status === "pending" && hasPermission(["company", "qc_admin"]) && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="flex-1 bg-chart-2 hover:bg-chart-2/90">
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1">
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredSOPs.length === 0 && <div className="text-center py-12 text-muted-foreground">No SOPs found</div>}
        </TabsContent>
      </Tabs>
    </div>
  )
}
