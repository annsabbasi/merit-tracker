// app/dashboard/settings/company/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
    useMyCompany,
    useUpdateCompany,
    useUpdateCompanyName,
    useUploadCompanyLogo,
    useRemoveCompanyLogo,
} from "@/lib/hooks/use-companies"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageUpload } from "@/components/ui/image-upload"
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
    Building2,
    Save,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Info,
    Upload,
    Trash2,
    Edit,
} from "lucide-react"
import { toast } from "sonner"

export default function CompanySettingsPage() {
    const { user } = useAuthStore()
    const isCompanyAdmin = user?.role === "COMPANY"

    // Fetch company data
    const { data: company, isLoading } = useMyCompany()

    // Mutations
    const updateCompany = useUpdateCompany()
    const updateCompanyName = useUpdateCompanyName()
    const uploadLogo = useUploadCompanyLogo()
    const removeLogo = useRemoveCompanyLogo()

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        website: "",
    })

    // Dialog states
    const [isNameChangeOpen, setIsNameChangeOpen] = useState(false)
    const [newName, setNewName] = useState("")
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [isRemoveLogoOpen, setIsRemoveLogoOpen] = useState(false)

    // Initialize form when company loads
    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name || "",
                address: company.address || "",
                phone: company.phone || "",
                website: company.website || "",
            })
            setNewName(company.name || "")
        }
    }, [company])

    // Handle general update (without name)
    const handleUpdateCompany = async () => {
        if (!company) return

        try {
            await updateCompany.mutateAsync({
                id: company.id,
                data: {
                    address: formData.address || undefined,
                    phone: formData.phone || undefined,
                    website: formData.website || undefined,
                },
            })
            toast.success("Company details updated!")
        } catch (error: any) {
            toast.error(error.message || "Failed to update company")
        }
    }

    // Handle name change (one-time only)
    const handleNameChange = async () => {
        if (!company || !newName.trim()) return

        if (newName === company.name) {
            toast.error("New name is the same as current name")
            return
        }

        try {
            await updateCompanyName.mutateAsync({
                id: company.id,
                name: newName.trim(),
            })
            toast.success("Company name updated! Note: This was your one-time name change.")
            setIsNameChangeOpen(false)
        } catch (error: any) {
            toast.error(error.message || "Failed to update company name")
        }
    }

    // Handle logo upload
    const handleLogoUpload = async (file: File | null) => {
        if (!company || !file) return

        setLogoFile(file)

        try {
            await uploadLogo.mutateAsync({
                id: company.id,
                file,
            })
            toast.success("Logo uploaded successfully!")
            setLogoFile(null)
        } catch (error: any) {
            toast.error(error.message || "Failed to upload logo")
            setLogoFile(null)
        }
    }

    // Handle logo removal
    const handleRemoveLogo = async () => {
        if (!company) return

        try {
            await removeLogo.mutateAsync(company.id)
            toast.success("Logo removed!")
            setIsRemoveLogoOpen(false)
        } catch (error: any) {
            toast.error(error.message || "Failed to remove logo")
        }
    }

    // Check if user can change name
    const canChangeName = company?.canChangeName ?? company?.nameChangedAt === null

    if (!isCompanyAdmin) {
        return (
            <div className="p-6">
                <Card className="p-8 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Access Denied</h3>
                    <p className="mt-2 text-muted-foreground">
                        Only company administrators can access company settings.
                    </p>
                </Card>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Company Settings</h1>
                <p className="text-muted-foreground">Manage your company profile and branding</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Company Logo */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Company Logo
                        </CardTitle>
                        <CardDescription>
                            Upload your company logo. This will be displayed across the platform.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-6">
                            <ImageUpload
                                value={company?.logo}
                                onChange={handleLogoUpload}
                                onRemove={() => setIsRemoveLogoOpen(true)}
                                isUploading={uploadLogo.isPending}
                                fallback={company?.name?.substring(0, 2).toUpperCase() || "CO"}
                                shape="square"
                                size="lg"
                                className="opacity-[100] logo-company"
                            />
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Current Logo</p>
                                <p className="text-xs text-muted-foreground">
                                    Recommended: 256x256px or larger, PNG or SVG format
                                </p>
                                {company?.logo && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsRemoveLogoOpen(true)}
                                        disabled={removeLogo.isPending}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Remove Logo
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Company Name */}
                <Card className={!canChangeName ? "border-yellow-500/50" : ""}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Company Name
                            </CardTitle>
                            {!canChangeName && (
                                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Name Already Set
                                </Badge>
                            )}
                        </div>
                        <CardDescription>
                            {canChangeName
                                ? "You can change your company name once. Choose carefully!"
                                : `Company name was set on ${company?.nameChangedAt ? new Date(company.nameChangedAt).toLocaleDateString() : 'registration'}`
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <Label className="text-sm font-medium">Current Name</Label>
                                <p className="text-lg font-semibold mt-1">{company?.name}</p>
                            </div>
                            {canChangeName && (
                                <Button
                                    variant="outline"
                                    onClick={() => setIsNameChangeOpen(true)}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Change Name
                                </Button>
                            )}
                        </div>

                        {canChangeName && (
                            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-yellow-600">One-time change</p>
                                        <p className="text-muted-foreground">
                                            You can only change your company name once. After changing,
                                            you won't be able to change it again.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Other Company Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Company Details</CardTitle>
                    <CardDescription>
                        Update your company contact information
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                placeholder="123 Business St, City, Country"
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                placeholder="+1 (555) 123-4567"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                type="url"
                                placeholder="https://www.yourcompany.com"
                                value={formData.website}
                                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                            />
                        </div>
                    </div>
                    <Button
                        onClick={handleUpdateCompany}
                        disabled={updateCompany.isPending}
                        className="border cursor-pointer hover:!bg-gray-600/20 focus:text-accent-foreground"
                    >
                        {updateCompany.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Company Info (Read-only) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Company Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <Label className="text-muted-foreground">Company Code</Label>
                            <p className="font-mono text-lg">{company?.companyCode}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Subscription Status</Label>
                            <Badge
                                variant={company?.subscriptionStatus === "ACTIVE" ? "default" : "secondary"}
                                className="mt-1"
                            >
                                {company?.subscriptionStatus}
                            </Badge>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Member Since</Label>
                            <p>{company?.createdAt ? new Date(company.createdAt).toLocaleDateString() : '-'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Name Change Dialog */}
            <AlertDialog open={isNameChangeOpen} onOpenChange={setIsNameChangeOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Change Company Name
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This is a one-time change. After changing your company name,
                            you won't be able to change it again. Please make sure the new name is correct.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Current Name</Label>
                            <p className="text-lg font-medium text-muted-foreground">{company?.name}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-name">New Name</Label>
                            <Input
                                id="new-name"
                                placeholder="Enter new company name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleNameChange}
                            disabled={updateCompanyName.isPending || !newName.trim() || newName === company?.name}
                            className="bg-yellow-500 hover:bg-yellow-600"
                        >
                            {updateCompanyName.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Change Name (One-time)"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Remove Logo Dialog */}
            <AlertDialog open={isRemoveLogoOpen} onOpenChange={setIsRemoveLogoOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Company Logo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove the company logo?
                            You can always upload a new one later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveLogo}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {removeLogo.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Remove Logo"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}