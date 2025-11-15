import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Download, FileText, MessageSquare, Send, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";

export default function Insights() {
  const [searchParams] = useSearchParams();
  const projectId = parseInt(searchParams.get("project_id") || "0");
  const navigate = useNavigate();
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [isSending, setIsSending] = useState(false);

  const { data: insights, isLoading, error, refetch } = useQuery({
    queryKey: ["insights", projectId],
    queryFn: async () => {
      try {
        return await apiClient.getInsights(projectId);
      } catch (err: any) {
        // If 404, insights are not ready yet - this is expected
        if (err?.response?.status === 404 || err?.status === 404) {
          return null; // Return null instead of throwing
        }
        throw err; // Re-throw other errors
      }
    },
    enabled: !!projectId,
    retry: false,
    refetchInterval: (query) => {
      // Poll every 3 seconds if insights don't exist yet
      const data = query.state.data;
      if (!data || !data.executive_summary) {
        return 3000; // Poll every 3 seconds
      }
      return false; // Stop polling once we have data
    },
  });

  // Track if we're waiting for analysis
  const isAnalyzing = !!projectId && (!insights || !insights.executive_summary);
  
  // Check for workflow errors
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  
  // If we've been loading for more than 5 minutes, show an error
  const [loadStartTime] = useState(Date.now());
  const loadDuration = Date.now() - loadStartTime;
  const isStuck = isAnalyzing && loadDuration > 5 * 60 * 1000; // 5 minutes

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !projectId || isSending) return;

    const userMessage = chatMessage.trim();
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: "user", content: userMessage }]);
    setIsSending(true);

    try {
      const response = await apiClient.chatWithRFP(projectId, userMessage, chatHistory);
      const assistantMessage = response.response || response.answer || "Sorry, I couldn't process that request.";
      // console.log(response);
      setChatHistory(prev => [...prev, { role: "assistant", content: assistantMessage }]);
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
      setChatHistory(prev => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  if (!projectId) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <Card className="p-6">
            <p className="text-muted-foreground">No project selected. Please select a project from the dashboard.</p>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              Go to Dashboard
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Show analyzing loader if insights are being generated
  if (isAnalyzing) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center p-6">
          <Card className="border-border/40 bg-gradient-card p-8 backdrop-blur-sm w-full max-w-2xl">
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Animated Sparkles Icon */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary shadow-glass">
                  <Sparkles className="h-10 w-10 text-primary-foreground animate-pulse" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-2">
                <h2 className="font-heading text-2xl font-bold">Analyzing Your RFP</h2>
                <p className="text-muted-foreground">
                  Our AI is extracting insights, identifying challenges, and generating recommendations...
                </p>
              </div>

              {/* Progress Steps */}
              <div className="w-full space-y-4">
                <AnalysisStep 
                  label="Analyzing RFP Document" 
                  isActive={true}
                  isComplete={false}
                />
                <AnalysisStep 
                  label="Extracting Business Challenges" 
                  isActive={false}
                  isComplete={false}
                />
                <AnalysisStep 
                  label="Generating Value Propositions" 
                  isActive={false}
                  isComplete={false}
                />
                <AnalysisStep 
                  label="Creating Discovery Questions" 
                  isActive={false}
                  isComplete={false}
                />
                <AnalysisStep 
                  label="Matching Case Studies" 
                  isActive={false}
                  isComplete={false}
                />
              </div>

              {/* Loading Indicator */}
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>This may take 2-3 minutes</span>
                </div>
                {isStuck && (
                  <div className="mt-4 w-full rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 text-center space-y-3">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      Analysis is taking longer than expected. The workflow might not have started or encountered an error.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={async () => {
                          toast.info("Checking status...");
                          await refetch();
                        }}
                      >
                        Check Status
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={async () => {
                          try {
                            toast.info("Please check the browser console and backend logs for errors");
                            console.log("Project ID:", projectId);
                            console.log("Check backend console for workflow execution logs");
                          } catch (err) {
                            console.error("Error:", err);
                          }
                        }}
                      >
                        View Logs
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!insights && !isAnalyzing) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center p-6">
          <Card className="border-border/40 bg-gradient-card p-8 backdrop-blur-sm max-w-md">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold mb-2">No Insights Found</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Insights haven't been generated for this project yet. The workflow might not have started or may have failed.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => navigate("/new-project")} 
                  className="bg-gradient-primary"
                >
                  Create New Project
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    console.log("Project ID:", projectId);
                    console.log("Check backend console for workflow execution logs");
                    toast.info("Check the browser console and backend logs");
                  }}
                >
                  Check Logs
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const challenges = insights.challenges || [];
  const valueProps = insights.value_propositions || [];
  const discoveryQuestions = insights.discovery_questions || {};
  const matchingCaseStudies = insights.matching_case_studies || [];
  const rfpSummary = insights.rfp_summary || "";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 font-heading text-3xl font-bold">AI Insights</h1>
            <p className="text-muted-foreground">Project ID: {projectId}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="bg-gradient-primary" onClick={() => navigate(`/proposal?project_id=${projectId}`)}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Proposal
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="challenges">Challenges</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
                <TabsTrigger value="cases">Case Studies</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-6">
                <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="font-heading text-xl font-semibold">Executive Summary</h2>
                  </div>
                  <div className="space-y-4 text-muted-foreground">
                    {rfpSummary ? (
                      <p>{typeof rfpSummary === 'string' ? rfpSummary : JSON.stringify(rfpSummary)}</p>
                    ) : (
                      <p>No summary available yet. Run analysis to generate insights.</p>
                    )}
                  </div>
                </Card>

                <Card className="mt-6 border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
                  <h2 className="mb-4 font-heading text-xl font-semibold">Value Propositions</h2>
                  <div className="space-y-3">
                    {valueProps.length > 0 ? (
                      valueProps.map((prop: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 rounded-lg bg-background/30 p-4">
                          <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                          <p className="flex-1 text-sm">{typeof prop === 'string' ? prop : prop.text || JSON.stringify(prop)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No value propositions identified yet.</p>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="challenges" className="mt-6">
                <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
                  <h2 className="mb-4 font-heading text-xl font-semibold">Business Challenges Identified</h2>
                  <div className="space-y-4">
                    {challenges.length > 0 ? (
                      challenges.map((challenge: any, index: number) => (
                        <div key={index} className="flex gap-4 rounded-lg bg-background/30 p-4">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{typeof challenge === 'string' ? challenge : challenge.text || challenge.challenge || JSON.stringify(challenge)}</p>
                            {typeof challenge === 'object' && challenge.recommendation && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                AI Recommendation: {challenge.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No challenges identified yet.</p>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="questions" className="mt-6">
                <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
                  <h2 className="mb-4 font-heading text-xl font-semibold">Discovery Questions</h2>
                  {typeof discoveryQuestions === 'object' && Object.keys(discoveryQuestions).length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {Object.entries(discoveryQuestions).map(([category, questions]: [string, any], index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <span className="font-semibold">{category}</span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-2">
                              {(Array.isArray(questions) ? questions : []).map((question: any, qIndex: number) => (
                                <li key={qIndex} className="flex items-start gap-2 text-sm">
                                  <span className="text-primary">•</span>
                                  <span>{typeof question === 'string' ? question : question.text || JSON.stringify(question)}</span>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <p className="text-sm text-muted-foreground">No discovery questions generated yet.</p>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="cases" className="mt-6">
                <div className="space-y-4">
                  {matchingCaseStudies.length > 0 ? (
                    matchingCaseStudies.map((caseStudy: any, index: number) => (
                      <Card key={index} className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-glass">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="mb-2 font-heading text-lg font-semibold">
                              {caseStudy.title || caseStudy.name || `Case Study ${index + 1}`}
                            </h3>
                            {caseStudy.industry && (
                              <Badge variant="secondary" className="mb-4">{caseStudy.industry}</Badge>
                            )}
                            {caseStudy.impact && (
                              <p className="text-sm text-muted-foreground">Impact: {caseStudy.impact}</p>
                            )}
                          </div>
                          <Button variant="outline" size="sm">View Details</Button>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No matching case studies found yet.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Chat Panel */}
          <div>
            <Card className="border-border/40 bg-gradient-card backdrop-blur-sm sticky top-6">
              <div className="border-b border-border/40 p-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="font-heading font-semibold">Chat with RFP</h3>
                </div>
              </div>
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {chatHistory.length === 0 && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 rounded-lg bg-background/50 p-3 text-sm">
                        Hi! I can help you understand the RFP better. Ask me anything about requirements, timeline, or client needs.
                      </div>
                    </div>
                  )}
                  {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      {msg.role === 'assistant' && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className={`flex-1 rounded-lg p-3 text-sm ${msg.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-background/50'}`}>
                        {msg.content}
                      </div>
                      {msg.role === 'user' && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <span className="text-xs">You</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      </div>
                      <div className="flex-1 rounded-lg bg-background/50 p-3 text-sm">
                        Thinking...
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="border-t border-border/40 p-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ask a question..." 
                    className="bg-background/50" 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isSending}
                  />
                  <Button 
                    size="icon" 
                    className="bg-gradient-primary shrink-0"
                    onClick={handleSendMessage}
                    disabled={isSending || !chatMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Analysis Step Component
function AnalysisStep({ 
  label, 
  isActive, 
  isComplete 
}: { 
  label: string; 
  isActive: boolean; 
  isComplete: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
        {isComplete ? (
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        ) : isActive ? (
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        ) : (
          <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
        )}
      </div>
      <span className={`text-sm ${isActive ? 'text-foreground font-medium' : isComplete ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
        {label}
      </span>
    </div>
  );
}