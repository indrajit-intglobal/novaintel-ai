import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Plus, Trash2, Sparkles } from "lucide-react";

export default function ProposalBuilder() {
  const sections = [
    { id: 1, title: "Executive Summary", content: "Brief overview of the proposal..." },
    { id: 2, title: "Client Challenges", content: "Key pain points identified..." },
    { id: 3, title: "Proposed Solution", content: "Our recommended approach..." },
    { id: 4, title: "Benefits & ROI", content: "Expected business outcomes..." },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 font-heading text-3xl font-bold">Proposal Builder</h1>
            <p className="text-muted-foreground">Create winning proposals with AI-powered content</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button className="bg-gradient-primary">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-heading text-xl font-semibold">Proposal Sections</h2>
                <Button size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Section
                </Button>
              </div>

              <div className="space-y-4">
                {sections.map((section) => (
                  <Card key={section.id} className="border-border/40 bg-background/30 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <Input
                        defaultValue={section.title}
                        className="max-w-md border-none bg-transparent p-0 font-semibold"
                      />
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" title="Regenerate content">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Delete section">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <textarea
                      defaultValue={section.content}
                      className="min-h-[100px] w-full resize-none rounded-lg border border-border/40 bg-background/50 p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </Card>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
              <h3 className="mb-4 font-heading text-lg font-semibold">Template Options</h3>
              <Tabs defaultValue="full" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="exec">Executive</TabsTrigger>
                  <TabsTrigger value="full">Full</TabsTrigger>
                  <TabsTrigger value="one">One-Page</TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="mt-4 text-sm text-muted-foreground">
                Choose a template that best fits your client's needs
              </p>
            </Card>

            <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
              <h3 className="mb-4 font-heading text-lg font-semibold">Export Options</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Export as DOCX
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Deck
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
