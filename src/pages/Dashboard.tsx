import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, Clock, Heart, TrendingUp, MoreVertical, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, Project } from "@/lib/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { formatIST } from "@/utils/timezone";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    client_name: "",
    industry: "",
    region: "",
    project_type: "",
    description: "",
    status: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const itemsPerPage = 5;

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiClient.listProjects(),
    enabled: isAuthenticated,
    retry: false,
  });

  // Pagination logic
  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = projects.slice(startIndex, endIndex);

  const deleteMutation = useMutation({
    mutationFn: (projectId: number) => apiClient.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete project");
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Project> }) =>
      apiClient.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated successfully");
      setIsEditDialogOpen(false);
      setEditingProject(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update project");
    },
  });

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setEditFormData({
      name: project.name || "",
      client_name: project.client_name || "",
      industry: project.industry || "",
      region: project.region || "",
      project_type: project.project_type || "",
      description: project.description || "",
      status: project.status || "Draft",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      deleteMutation.mutate(projectToDelete.id);
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleSaveEdit = () => {
    if (!editingProject) return;
    
    if (!editFormData.client_name || !editFormData.industry || !editFormData.region || !editFormData.project_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    updateProjectMutation.mutate({
      id: editingProject.id,
      data: {
        name: editFormData.name || `${editFormData.client_name} - ${editFormData.project_type}`,
        client_name: editFormData.client_name,
        industry: editFormData.industry,
        region: editFormData.region,
        project_type: editFormData.project_type,
        description: editFormData.description || undefined,
        status: editFormData.status || "Draft",
      },
    });
  };

  const activeProjects = projects.filter((p) => p.status === "Active" || p.status === "Submitted").length;
  const topIndustry = projects.reduce((acc: Record<string, number>, project) => {
    acc[project.industry] = (acc[project.industry] || 0) + 1;
    return acc;
  }, {});
  const topIndustryName = Object.keys(topIndustry).reduce((a, b) =>
    topIndustry[a] > topIndustry[b] ? a : b,
    "N/A"
  );

  const stats = [
    { title: "Active Projects", value: activeProjects.toString(), icon: Briefcase, trend: "+12%" },
    { title: "Time Saved", value: "128 hrs", icon: Clock, trend: "+23%" },
    { title: "Client Satisfaction", value: "97%", icon: Heart, trend: "+5%" },
    { title: "Top Industry", value: topIndustryName, icon: TrendingUp, trend: `${topIndustry[topIndustryName] || 0} projects` },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      case "Active":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "Submitted":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
      case "Won":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "Lost":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      case "Archived":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="mb-2 font-heading text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your presales activities.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden border-border/40 bg-gradient-card p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-glass"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mb-2 font-heading text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm font-medium text-green-600">{stat.trend} from last month</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Projects Table */}
        <Card className="border-border/40 bg-gradient-card backdrop-blur-sm">
          <div className="border-b border-border/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-2xl font-semibold">Recent Projects</h2>
                <p className="text-sm text-muted-foreground">Track and manage your ongoing proposals</p>
              </div>
              <Button className="bg-gradient-primary" onClick={() => navigate("/new-project")}>
                New Project
              </Button>
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No projects yet. Create your first project to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.client_name}</TableCell>
                      <TableCell>{project.industry}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatIST(project.updated_at, "datetime")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/insights?project_id=${project.id}`)}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(project)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClick(project)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {/* Pagination Controls */}
            {projects.length > itemsPerPage && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, projects.length)} of {projects.length} projects
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* AI Trends Widget */}
        <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
          <h2 className="mb-4 font-heading text-2xl font-semibold">AI Trends & Insights</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-primary/5 p-4">
              <p className="mb-1 text-sm font-medium text-muted-foreground">Most Common Challenge</p>
              <p className="font-semibold">Digital Transformation</p>
            </div>
            <div className="rounded-lg bg-accent/5 p-4">
              <p className="mb-1 text-sm font-medium text-muted-foreground">Winning Strategy</p>
              <p className="font-semibold">ROI-Focused Proposals</p>
            </div>
            <div className="rounded-lg bg-primary/5 p-4">
              <p className="mb-1 text-sm font-medium text-muted-foreground">Top Value Prop</p>
              <p className="font-semibold">Cost Reduction</p>
            </div>
          </div>
        </Card>

        {/* Edit Project Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update project information and details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-client-name">Client Name *</Label>
                <Input
                  id="edit-client-name"
                  value={editFormData.client_name}
                  onChange={(e) => setEditFormData({ ...editFormData, client_name: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-industry">Industry *</Label>
                  <Select
                    value={editFormData.industry}
                    onValueChange={(value) => setEditFormData({ ...editFormData, industry: value })}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BFSI">BFSI</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Government">Government</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-region">Region *</Label>
                  <Select
                    value={editFormData.region}
                    onValueChange={(value) => setEditFormData({ ...editFormData, region: value })}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="North America">North America</SelectItem>
                      <SelectItem value="South America">South America</SelectItem>
                      <SelectItem value="Europe">Europe</SelectItem>
                      <SelectItem value="Asia Pacific">Asia Pacific</SelectItem>
                      <SelectItem value="Middle East">Middle East</SelectItem>
                      <SelectItem value="Africa">Africa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-project-type">Project Type *</Label>
                <Select
                  value={editFormData.project_type}
                  onValueChange={(value) => setEditFormData({ ...editFormData, project_type: value })}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Business</SelectItem>
                    <SelectItem value="expansion">Expansion</SelectItem>
                    <SelectItem value="renewal">Renewal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Won">Won</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Optional project description..."
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="bg-background/50 min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-gradient-primary"
                onClick={handleSaveEdit}
                disabled={updateProjectMutation.isPending}
              >
                {updateProjectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Project"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Project</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
