import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, Sparkles } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export default function NewProject() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [clientName, setClientName] = useState("");
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("");
  const [projectType, setProjectType] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTasks, setSelectedTasks] = useState({
    challenges: true,
    questions: true,
    cases: true,
    proposal: true,
  });
  const [projectId, setProjectId] = useState<number | null>(null);

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId as keyof typeof prev]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!clientName || !industry || !region || !projectType) {
        throw new Error("Please fill in all required fields");
      }
      
      // Normalize project_type value (handle legacy "new_business" value)
      const normalizedProjectType = projectType === "new_business" ? "new" : projectType;
      
      const project = await apiClient.createProject({
        name: `${clientName} - ${projectType}`,
        client_name: clientName,
        industry,
        region,
        project_type: normalizedProjectType,
        description: description || undefined,
      });
      
      setProjectId(project.id);
      return project;
    },
    onSuccess: async (project) => {
      toast.success("Project created successfully!");
      
      // If file is selected, upload it
      if (selectedFile && project.id) {
        try {
          const uploadResult = await apiClient.uploadRFP(project.id, selectedFile);
          toast.success("RFP uploaded successfully!");
          
          // Build index
          try {
            await apiClient.buildIndex(uploadResult.rfp_document_id);
            toast.success("Index built successfully!");
            
            // Run workflow if tasks are selected
            if (selectedTasks.challenges || selectedTasks.questions || selectedTasks.cases || selectedTasks.proposal) {
              try {
                console.log(`Starting workflow for project ${project.id}, RFP document ${uploadResult.rfp_document_id}`);
                const workflowResult = await apiClient.runWorkflow(project.id, uploadResult.rfp_document_id);
                console.log("Workflow result:", workflowResult);
                
                if (workflowResult.success) {
                  toast.success("Analysis started! This may take a few minutes.");
                } else {
                  toast.error(`Workflow failed: ${workflowResult.error || 'Unknown error'}`);
                  console.error("Workflow failed:", workflowResult);
                }
              } catch (error: any) {
                const errorMessage = error.message || error.detail || 'Unknown error';
                toast.error(`Failed to start analysis: ${errorMessage}`);
                console.error("Workflow error:", error);
                // Still navigate to insights page so user can see the error
              }
            } else {
              console.log("No tasks selected, skipping workflow");
            }
          } catch (error: any) {
            toast.error(`Failed to build index: ${error.message}`);
          }
          
          // Navigate to insights page
          navigate(`/insights?project_id=${project.id}`);
        } catch (error: any) {
          toast.error(`Failed to upload RFP: ${error.message}`);
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        navigate("/dashboard");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create project");
    },
  });

  const handleAnalyze = async () => {
    if (!projectId || !selectedFile) {
      // Create project first
      createProjectMutation.mutate();
      return;
    }

    try {
      // Upload file if not already uploaded
      const uploadResult = await apiClient.uploadRFP(projectId, selectedFile);
      
      // Build index
      await apiClient.buildIndex(uploadResult.rfp_document_id);
      
      // Run workflow if tasks are selected
      if (selectedTasks.challenges || selectedTasks.questions || selectedTasks.cases || selectedTasks.proposal) {
        await apiClient.runWorkflow(projectId, uploadResult.rfp_document_id);
        toast.success("Analysis started! This may take a few minutes.");
        navigate(`/insights?project_id=${projectId}`);
      } else {
        navigate(`/insights?project_id=${projectId}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Analysis failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="mb-2 font-heading text-3xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground">
            Upload your RFP and let AI extract insights to jumpstart your presales process
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
              <h2 className="mb-6 font-heading text-xl font-semibold">Client Information</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input 
                    id="clientName" 
                    placeholder="Enter client name" 
                    className="bg-background/50"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BFSI">BFSI</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="North America">North America</SelectItem>
                      <SelectItem value="Europe">Europe</SelectItem>
                      <SelectItem value="APAC">APAC</SelectItem>
                      <SelectItem value="LATAM">LATAM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectType">Project Type</Label>
                  <Select value={projectType} onValueChange={setProjectType}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New Business</SelectItem>
                      <SelectItem value="expansion">Expansion</SelectItem>
                      <SelectItem value="renewal">Renewal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <Label htmlFor="description">Project Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief overview of the opportunity..."
                  className="bg-background/50"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </Card>

            {/* Upload RFP */}
            <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
              <h2 className="mb-6 font-heading text-xl font-semibold">Upload RFP Document</h2>
              <div
                className="flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-background/30 p-12 transition-colors hover:border-primary/50 cursor-pointer"
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="text-center">
                  <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-2 font-medium">
                    {selectedFile ? (
                      <span className="text-primary">{selectedFile.name}</span>
                    ) : (
                      <>
                        Drag and drop your RFP file here, or{" "}
                        <button 
                          type="button"
                          className="text-primary hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          browse
                        </button>
                      </>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Supports PDF, DOCX (Max 20MB)</p>
                </div>
              </div>
            </Card>

            {/* AI Tasks */}
            <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
              <h2 className="mb-6 font-heading text-xl font-semibold">Select AI Analysis Tasks</h2>
              <div className="space-y-4">
                {[
                  { id: "challenges", label: "Extract Business Challenges", description: "Identify key pain points and requirements" },
                  { id: "questions", label: "Generate Discovery Questions", description: "Create tailored questionnaires" },
                  { id: "cases", label: "Recommend Case Studies", description: "Match relevant success stories" },
                  { id: "proposal", label: "Draft Initial Proposal", description: "Generate proposal outline" },
                ].map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between gap-4 rounded-xl border-2 border-border/50 bg-background/80 p-5 transition-all hover:border-primary/40 hover:bg-background hover:shadow-md"
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="font-semibold text-foreground">{task.label}</div>
                      <p className="text-sm text-muted-foreground/80">{task.description}</p>
                    </div>
                    <Switch 
                      checked={selectedTasks[task.id as keyof typeof selectedTasks]}
                      onCheckedChange={() => handleTaskToggle(task.id)}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            <Card className="border-border/40 bg-gradient-primary p-6 text-primary-foreground shadow-glass">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-heading text-xl font-semibold">AI-Powered Analysis</h3>
              <p className="mb-6 text-sm opacity-90">
                Our AI will analyze your RFP and extract key insights, generate discovery questions, and recommend relevant case studies.
              </p>
              <div className="space-y-3">
                <Button 
                  className="w-full bg-white text-primary hover:bg-white/90 shadow-sm" 
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={createProjectMutation.isPending || !clientName || !industry || !region || !projectType}
                >
                  {createProjectMutation.isPending ? "Creating..." : "Analyze RFP"}
                </Button>
                <Button 
                  className="w-full border-2 border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:border-white/50" 
                  size="lg"
                  onClick={() => {
                    if (!projectId) {
                      createProjectMutation.mutate();
                    } else {
                      queryClient.invalidateQueries({ queryKey: ["projects"] });
                      navigate("/dashboard");
                    }
                  }}
                  disabled={createProjectMutation.isPending}
                >
                  Save Draft
                </Button>
              </div>
            </Card>

            <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
              <h3 className="mb-4 font-semibold">Quick Tips</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Upload clear, text-based RFP documents for best results</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Select all relevant AI tasks to get comprehensive insights</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Analysis typically takes 2-3 minutes</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
