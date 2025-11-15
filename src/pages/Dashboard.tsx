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
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiClient.listProjects(),
    enabled: isAuthenticated,
    retry: false,
  });

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
    });
    setIsEditDialogOpen(true);
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
      },
    });
  };

  const activeProjects = projects.filter((p) => p.status !== "completed").length;
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
      case "In Progress":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "Review":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
      case "Completed":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
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
                  {projects.map((project) => (
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
                        {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
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
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this project?")) {
                                  deleteMutation.mutate(project.id);
                                }
                              }}
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
      </div>
    </DashboardLayout>
  );
}
