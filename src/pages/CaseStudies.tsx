import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";

export default function CaseStudies() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    industry: "",
    impact: "",
    description: "",
  });
  const queryClient = useQueryClient();

  const { data: caseStudies = [], isLoading } = useQuery({
    queryKey: ["caseStudies"],
    queryFn: () => apiClient.listCaseStudies(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; industry: string; impact: string; description?: string }) =>
      apiClient.createCaseStudy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caseStudies"] });
      toast.success("Case study created successfully");
      setIsCreateOpen(false);
      setFormData({ title: "", industry: "", impact: "", description: "" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create case study");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { title?: string; industry?: string; impact?: string; description?: string } }) =>
      apiClient.updateCaseStudy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caseStudies"] });
      toast.success("Case study updated successfully");
      setIsEditOpen(false);
      setSelectedCaseStudy(null);
      setFormData({ title: "", industry: "", impact: "", description: "" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update case study");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (caseStudyId: number) => apiClient.deleteCaseStudy(caseStudyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caseStudies"] });
      toast.success("Case study deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete case study");
    },
  });

  const { data: caseStudyDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["caseStudy", selectedCaseStudy?.id],
    queryFn: () => apiClient.getCaseStudy(selectedCaseStudy.id),
    enabled: isViewOpen && !!selectedCaseStudy?.id,
  });

  const handleCreate = () => {
    if (!formData.title || !formData.industry || !formData.impact) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate({
      title: formData.title,
      industry: formData.industry,
      impact: formData.impact,
      description: formData.description || undefined,
    });
  };

  const handleEdit = () => {
    if (!selectedCaseStudy) return;
    if (!formData.title || !formData.industry || !formData.impact) {
      toast.error("Please fill in all required fields");
      return;
    }
    updateMutation.mutate({
      id: selectedCaseStudy.id,
      data: {
        title: formData.title,
        industry: formData.industry,
        impact: formData.impact,
        description: formData.description || undefined,
      },
    });
  };

  const handleOpenEdit = (study: any) => {
    setSelectedCaseStudy(study);
    setFormData({
      title: study.title || "",
      industry: study.industry || "",
      impact: study.impact || "",
      description: study.description || "",
    });
    setIsEditOpen(true);
  };

  const handleOpenView = (study: any) => {
    setSelectedCaseStudy(study);
    setIsViewOpen(true);
  };

  const handleOpenCreate = () => {
    setFormData({ title: "", industry: "", impact: "", description: "" });
    setIsCreateOpen(true);
  };

  const filteredCaseStudies = caseStudies.filter((study: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      study.title?.toLowerCase().includes(query) ||
      study.industry?.toLowerCase().includes(query) ||
      study.impact?.toLowerCase().includes(query) ||
      study.description?.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 font-heading text-3xl font-bold">Case Studies</h1>
            <p className="text-muted-foreground">Showcase your success stories and wins</p>
          </div>
          <Button className="bg-gradient-primary" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Case Study
          </Button>
        </div>

        <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by keyword, impact, industry..."
              className="bg-background/50 pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading case studies...</div>
        ) : filteredCaseStudies.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {searchQuery ? "No case studies match your search." : "No case studies available."}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCaseStudies.map((study: any) => (
              <Card
                key={study.id}
                className="group relative overflow-hidden border-border/40 bg-gradient-card backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-glass"
              >
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    {study.industry && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {study.industry}
                      </Badge>
                    )}
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleOpenView(study)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(study)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this case study?")) {
                            deleteMutation.mutate(study.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="mb-2 font-heading text-xl font-semibold">{study.title || study.name}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{study.description || study.summary}</p>
                  {study.impact && (
                    <div className="rounded-lg bg-primary/5 p-3">
                      <p className="text-sm font-semibold text-primary">{study.impact}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Case Study Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Case Study</DialogTitle>
              <DialogDescription>
                Add a new success story to showcase your wins and impact.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Digital Transformation for Bank XYZ"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
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
                <Label htmlFor="impact">Impact *</Label>
                <Input
                  id="impact"
                  placeholder="e.g., 40% cost reduction, 2x productivity increase"
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about the project, challenges, solution, and results..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-background/50 min-h-[120px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-gradient-primary"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Case Study"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Case Study Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Case Study</DialogTitle>
              <DialogDescription>
                Update the case study information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  placeholder="e.g., Digital Transformation for Bank XYZ"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-industry">Industry *</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
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
                <Label htmlFor="edit-impact">Impact *</Label>
                <Input
                  id="edit-impact"
                  placeholder="e.g., 40% cost reduction, 2x productivity increase"
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Provide details about the project, challenges, solution, and results..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-background/50 min-h-[120px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-gradient-primary"
                onClick={handleEdit}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update Case Study"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Case Study Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Case Study Details</DialogTitle>
              <DialogDescription>
                View complete information about this case study.
              </DialogDescription>
            </DialogHeader>
            {isLoadingDetail ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-4 py-4">
                {caseStudyDetail && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Title</Label>
                      <p className="text-sm">{caseStudyDetail.title || selectedCaseStudy?.title}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Industry</Label>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {caseStudyDetail.industry || selectedCaseStudy?.industry}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Impact</Label>
                      <div className="rounded-lg bg-primary/5 p-3">
                        <p className="text-sm font-semibold text-primary">
                          {caseStudyDetail.impact || selectedCaseStudy?.impact}
                        </p>
                      </div>
                    </div>
                    {caseStudyDetail.description || selectedCaseStudy?.description ? (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Description</Label>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {caseStudyDetail.description || selectedCaseStudy?.description}
                        </p>
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Created</Label>
                      <p className="text-sm text-muted-foreground">
                        {caseStudyDetail.created_at
                          ? new Date(caseStudyDetail.created_at).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                Close
              </Button>
              {selectedCaseStudy && (
                <Button
                  className="bg-gradient-primary"
                  onClick={() => {
                    setIsViewOpen(false);
                    handleOpenEdit(selectedCaseStudy);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
