import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, Sparkles } from "lucide-react";
import { useState } from "react";

export default function NewProject() {
  const [selectedTasks, setSelectedTasks] = useState({
    challenges: true,
    questions: true,
    cases: true,
    proposal: true,
  });

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId as keyof typeof prev]
    }));
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
                  <Input id="clientName" placeholder="Enter client name" className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bfsi">BFSI</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="north-america">North America</SelectItem>
                      <SelectItem value="europe">Europe</SelectItem>
                      <SelectItem value="apac">APAC</SelectItem>
                      <SelectItem value="latam">LATAM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectType">Project Type</Label>
                  <Select>
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
                />
              </div>
            </Card>

            {/* Upload RFP */}
            <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
              <h2 className="mb-6 font-heading text-xl font-semibold">Upload RFP Document</h2>
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-background/30 p-12 transition-colors hover:border-primary/50">
                <div className="text-center">
                  <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-2 font-medium">
                    Drag and drop your RFP file here, or{" "}
                    <button className="text-primary hover:underline">browse</button>
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
                <Button className="w-full bg-white text-primary hover:bg-white/90 shadow-sm" size="lg">
                  Analyze RFP
                </Button>
                <Button className="w-full border-2 border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:border-white/50" size="lg">
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
