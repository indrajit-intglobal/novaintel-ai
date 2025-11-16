import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  FileText, 
  Plus, 
  Trash2, 
  Sparkles, 
  Save, 
  ArrowUp, 
  ArrowDown,
  GripVertical,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { MarkdownText } from "@/components/ui/markdown-text";

interface ProposalSection {
  id: number;
  title: string;
  content: string;
  order?: number;
  required?: boolean;
}

interface Proposal {
  id: number;
  project_id: number;
  title: string;
  sections: ProposalSection[];
  template_type: string;
  created_at?: string;
  updated_at?: string;
}

export default function ProposalBuilder() {
  const [searchParams] = useSearchParams();
  const projectId = parseInt(searchParams.get("project_id") || "0");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("Proposal");
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [templateType, setTemplateType] = useState<string>("full");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  // Load project info
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => apiClient.getProject(projectId),
    enabled: !!projectId,
  });

  // Load existing proposal
  const { data: proposal, isLoading: isLoadingProposal, refetch: refetchProposal } = useQuery({
    queryKey: ["proposal", projectId],
    queryFn: async () => {
      // Try to find existing proposal for this project
      // First check if there's a proposal_id in URL
      const proposalIdParam = searchParams.get("proposal_id");
      if (proposalIdParam) {
        return await apiClient.getProposal(parseInt(proposalIdParam));
      }
      // Otherwise, try to find by project
      return await apiClient.getProposalByProject(projectId);
    },
    enabled: !!projectId,
    retry: false,
  });

  // Load insights/workflow results for AI generation
  const { data: insights } = useQuery({
    queryKey: ["insights", projectId],
    queryFn: () => apiClient.getInsights(projectId),
    enabled: !!projectId,
    retry: false,
  });

  // Initialize sections from proposal
  useEffect(() => {
    if (proposal) {
      setTitle(proposal.title || "Proposal");
      setSections(proposal.sections || []);
      setTemplateType(proposal.template_type || "full");
      setLastSaved(new Date(proposal.updated_at || proposal.created_at || Date.now()));
    }
  }, [proposal]);

  // Get selected case study IDs from URL params (passed from Insights page)
  const selectedCaseStudyIdsParam = searchParams.get("selected_case_study_ids");
  const selectedCaseStudyIds = selectedCaseStudyIdsParam 
    ? selectedCaseStudyIdsParam.split(",").map(id => parseInt(id)).filter(id => !isNaN(id))
    : undefined;

  // Generate proposal mutation
  const generateMutation = useMutation({
    mutationFn: async ({ templateType, useInsights }: { templateType: string; useInsights: boolean }) => {
      return await apiClient.generateProposal(projectId, templateType, useInsights, selectedCaseStudyIds);
    },
    onSuccess: (data) => {
      setSections(data.sections || []);
      setTitle(data.title || "Proposal");
      setTemplateType(data.template_type || templateType);
      queryClient.invalidateQueries({ queryKey: ["proposal", projectId] });
      toast.success("Proposal generated successfully with AI-powered content!");
      setIsGenerating(false);
      // Refetch proposal to get the latest data
      refetchProposal();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate proposal");
      setIsGenerating(false);
    },
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (sectionsToSave: ProposalSection[]) => {
      if (!proposal?.id) {
        // Create new proposal
        return await apiClient.saveProposal({
          project_id: projectId,
          title,
          sections: sectionsToSave,
          template_type: templateType,
        });
      } else {
        // Update existing proposal
        return await apiClient.saveProposalDraft(proposal.id, sectionsToSave, title);
      }
    },
    onSuccess: (data) => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ["proposal", projectId] });
      setIsSaving(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save proposal");
      setIsSaving(false);
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async (format: 'pdf' | 'docx' | 'pptx') => {
      if (!proposal?.id) {
        throw new Error("Please save the proposal before exporting");
      }
      setExportingFormat(format);
      const blob = await apiClient.exportProposal(proposal.id, format);
      return { blob, format };
    },
    onSuccess: ({ blob, format }) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Exported as ${format.toUpperCase()}`);
      setExportingFormat(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Export failed");
      setExportingFormat(null);
    },
  });

  // Manual save function (autosave disabled)
  const autosave = useCallback(() => {
    if (sections.length === 0) return;
    
    setIsSaving(true);
    saveDraftMutation.mutate(sections);
  }, [sections, title, saveDraftMutation]);

  // Manual save
  const handleSave = () => {
    if (sections.length === 0) {
      toast.error("Please add at least one section");
      return;
    }
    autosave();
  };

  // Generate proposal from AI
  const handleGenerate = async (useInsights: boolean = true) => {
    if (!projectId) {
      toast.error("Project ID is required");
      return;
    }

    setIsGenerating(true);
    generateMutation.mutate({ templateType, useInsights });
  };

  // Add new section
  const handleAddSection = () => {
    const newSection: ProposalSection = {
      id: Date.now(),
      title: "New Section",
      content: "",
      order: sections.length,
    };
    setSections([...sections, newSection]);
    setSelectedSectionId(newSection.id);
  };

  // Delete section
  const handleDeleteSection = (sectionId: number) => {
    if (sections.find(s => s.id === sectionId)?.required) {
      toast.error("Cannot delete required section");
      return;
    }
    setSections(sections.filter(s => s.id !== sectionId));
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
  };

  // Update section
  const handleUpdateSection = (sectionId: number, field: 'title' | 'content', value: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, [field]: value } : s
    ));
  };

  // Reorder sections
  const handleMoveSection = (sectionId: number, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === sectionId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setSections(newSections);
  };

  // Regenerate section mutation
  const regenerateSectionMutation = useMutation({
    mutationFn: async ({ sectionId, sectionTitle }: { sectionId: number; sectionTitle: string }) => {
      if (!proposal?.id) {
        throw new Error("Please save the proposal first");
      }
      return await apiClient.regenerateSection(proposal.id, sectionId, sectionTitle);
    },
    onSuccess: (data) => {
      // Update the section content
      handleUpdateSection(data.section_id, 'content', data.content);
      queryClient.invalidateQueries({ queryKey: ["proposal", projectId] });
      toast.success("Section regenerated with AI!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to regenerate section");
    },
  });

  // Regenerate section content with AI
  const handleRegenerateSection = async (sectionId: number) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    if (!proposal?.id) {
      toast.error("Please save the proposal first before regenerating sections");
      return;
    }

    if (!insights) {
      toast.error("No insights available. Please run the workflow first.");
      return;
    }

    regenerateSectionMutation.mutate({
      sectionId: section.id,
      sectionTitle: section.title
    });
  };

  if (!projectId) {
    return (
      <DashboardLayout>
        <Card className="p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
            <p className="text-muted-foreground mb-4">
              Please select a project to build a proposal
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  if (isLoadingProposal) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-heading text-3xl font-bold">Proposal Builder</h1>
              {project && (
                <Badge variant="outline">{project.client_name}</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {proposal ? "Edit your proposal" : "Create a winning proposal with AI-powered content"}
            </p>
          </div>
          <div className="flex gap-3">
            {lastSaved && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            )}
            {proposal && insights && (
              <Button 
                variant="outline" 
                onClick={() => handleGenerate(true)}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Regenerate All
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleSave}
              disabled={isSaving || sections.length === 0}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
            <Button 
              onClick={() => setPreviewMode(!previewMode)}
              variant={previewMode ? "default" : "outline"}
            >
              <Eye className="mr-2 h-4 w-4" />
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <Select value={templateType} onValueChange={setTemplateType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Proposal</SelectItem>
                <SelectItem value="executive">Executive Summary</SelectItem>
                <SelectItem value="exclusive">Exclusive</SelectItem>
                <SelectItem value="short-pitch">Short Pitch</SelectItem>
                <SelectItem value="executive-summary">Executive Summary (Detailed)</SelectItem>
                <SelectItem value="one-page">One-Page</SelectItem>
                <SelectItem value="technical-appendix">Technical Appendix</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generate/Regenerate Proposal Card - Show when no sections or when user wants to regenerate */}
        {sections.length === 0 && (
          <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-semibold mb-2">
                  {proposal ? "Regenerate Proposal" : "Generate AI-Powered Proposal"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {insights 
                    ? proposal
                      ? "Regenerate the entire proposal with fresh AI-generated content based on your insights"
                      : "Generate a complete proposal with AI-generated content based on your RFP analysis insights"
                    : "Run the workflow first to generate insights, or create a proposal from scratch"}
                </p>
                {insights && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {insights.challenges?.length || 0} Challenges
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {insights.value_propositions?.length || 0} Value Props
                    </Badge>
                    {insights.matching_case_studies && (
                      <Badge variant="outline" className="text-xs">
                        {insights.matching_case_studies.length} Case Studies
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {insights && (
                  <Button
                    onClick={() => handleGenerate(true)}
                    disabled={isGenerating}
                    className="bg-gradient-primary"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {proposal ? "Regenerating..." : "Generating..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {proposal ? "Regenerate Best Proposal" : "Generate Best Proposal"}
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => handleGenerate(false)}
                  disabled={isGenerating}
                  variant="outline"
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Generate Template
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Input */}
            <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
              <Label htmlFor="proposal-title" className="mb-2 block font-semibold">
                Proposal Title
              </Label>
              <Input
                id="proposal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold"
                placeholder="Enter proposal title..."
              />
            </Card>

            {/* Sections */}
            <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-heading text-xl font-semibold">Proposal Sections</h2>
                <Button size="sm" variant="outline" onClick={handleAddSection}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Section
                </Button>
              </div>

              {sections.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No sections yet. Add a section or generate from template.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <Card 
                      key={section.id} 
                      className={`border-border/40 bg-background/30 p-4 transition-all ${
                        selectedSectionId === section.id ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <button
                          className="mt-2 text-muted-foreground hover:text-foreground"
                          title="Drag to reorder"
                        >
                          <GripVertical className="h-5 w-5" />
                        </button>
                        <div className="flex-1">
                          {previewMode ? (
                            <h3 className="font-semibold text-lg mb-2">{section.title}</h3>
                          ) : (
                            <Input
                              value={section.title}
                              onChange={(e) => handleUpdateSection(section.id, 'title', e.target.value)}
                              className="mb-2 border-none bg-transparent p-0 font-semibold text-lg focus-visible:ring-0"
                              placeholder="Section title..."
                              onClick={() => setSelectedSectionId(section.id)}
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Move up"
                            onClick={() => handleMoveSection(section.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Move down"
                            onClick={() => handleMoveSection(section.id, 'down')}
                            disabled={index === sections.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Regenerate with AI"
                            onClick={() => handleRegenerateSection(section.id)}
                            disabled={regenerateSectionMutation.isPending || !proposal?.id || !insights}
                          >
                            {regenerateSectionMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-primary" />
                            )}
                          </Button>
                          {!section.required && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete section"
                              onClick={() => handleDeleteSection(section.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {previewMode ? (
                        <div className="prose prose-sm max-w-none text-foreground">
                          {section.content ? (
                            <MarkdownText 
                              content={section.content} 
                              className="text-foreground"
                            />
                          ) : (
                            <span className="text-muted-foreground italic">No content</span>
                          )}
                        </div>
                      ) : (
                        <Textarea
                          value={section.content}
                          onChange={(e) => handleUpdateSection(section.id, 'content', e.target.value)}
                          className="min-h-[150px] w-full resize-none rounded-lg border border-border/40 bg-background/50 p-3 text-sm focus:ring-2 focus:ring-primary"
                          placeholder="Enter section content..."
                          onClick={() => setSelectedSectionId(section.id)}
                        />
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Template Info */}
            <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
              <h3 className="mb-4 font-heading text-lg font-semibold">Template</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">{templateType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sections:</span>
                  <span className="font-medium">{sections.length}</span>
                </div>
                {proposal && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">
                      {new Date(proposal.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Export Options */}
            <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
              <h3 className="mb-4 font-heading text-lg font-semibold">Export</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => exportMutation.mutate('pdf')}
                  disabled={!proposal?.id || (exportMutation.isPending && exportingFormat !== 'pdf')}
                >
                  {exportMutation.isPending && exportingFormat === 'pdf' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Export as PDF
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => exportMutation.mutate('docx')}
                  disabled={!proposal?.id || (exportMutation.isPending && exportingFormat !== 'docx')}
                >
                  {exportMutation.isPending && exportingFormat === 'docx' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Export as DOCX
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => toast.info("PPTX export coming soon!")}
                  disabled={true}
                  title="Coming Soon"
                >
                  <Download className="mr-2 h-4 w-4 opacity-50" />
                  Export as PPTX (Coming Soon)
                </Button>
              </div>
            </Card>

            {/* Quick Actions */}
            {insights && (
              <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
                <h3 className="mb-4 font-heading text-lg font-semibold">AI Insights</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ RFP Analysis Complete</p>
                  <p>✓ Challenges Identified</p>
                  <p>✓ Value Propositions Ready</p>
                  {insights.proposal_draft && (
                    <p>✓ Proposal Draft Available</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate(`/insights?project_id=${projectId}`)}
                >
                  View Insights
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
