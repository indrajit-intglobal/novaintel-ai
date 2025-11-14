import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Download, FileText, MessageSquare, Send, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Insights() {
  const challenges = [
    "Legacy system integration with modern cloud infrastructure",
    "Real-time data synchronization across 15+ global locations",
    "Compliance with GDPR and regional data privacy regulations",
    "Scalability to support 10x user growth over 3 years",
  ];

  const valueProps = [
    "45% reduction in operational costs through AI automation",
    "99.9% uptime SLA with multi-region redundancy",
    "Zero-downtime migration strategy",
    "Built-in compliance framework for global regulations",
  ];

  const discoveryQuestions = [
    { category: "Business", questions: ["What are your primary business objectives for this project?", "How do you measure success for digital initiatives?"] },
    { category: "Technology", questions: ["What is your current technology stack?", "What are your infrastructure requirements?"] },
    { category: "KPIs", questions: ["What key metrics do you track?", "What are your performance benchmarks?"] },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 font-heading text-3xl font-bold">AI Insights</h1>
            <p className="text-muted-foreground">Enterprise CRM Implementation for TechCorp Solutions</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="bg-gradient-primary">
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
                    <p>
                      TechCorp Solutions is seeking a comprehensive Enterprise CRM implementation to modernize their customer management infrastructure.
                      The project scope includes migration from legacy systems, integration with existing tools, and deployment across 15+ global locations.
                    </p>
                    <p>
                      Key focus areas include real-time data synchronization, compliance with international data privacy regulations, and scalability to
                      support projected 10x user growth over the next three years.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">Digital Transformation</Badge>
                      <Badge variant="secondary" className="bg-accent/10 text-accent">Cloud Migration</Badge>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">Global Deployment</Badge>
                    </div>
                  </div>
                </Card>

                <Card className="mt-6 border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
                  <h2 className="mb-4 font-heading text-xl font-semibold">Value Propositions</h2>
                  <div className="space-y-3">
                    {valueProps.map((prop, index) => (
                      <div key={index} className="flex items-start gap-3 rounded-lg bg-background/30 p-4">
                        <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                        <p className="flex-1 text-sm">{prop}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="challenges" className="mt-6">
                <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
                  <h2 className="mb-4 font-heading text-xl font-semibold">Business Challenges Identified</h2>
                  <div className="space-y-4">
                    {challenges.map((challenge, index) => (
                      <div key={index} className="flex gap-4 rounded-lg bg-background/30 p-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{challenge}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            AI Recommendation: Address through phased implementation approach
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="questions" className="mt-6">
                <Card className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm">
                  <h2 className="mb-4 font-heading text-xl font-semibold">Discovery Questions</h2>
                  <Accordion type="single" collapsible className="w-full">
                    {discoveryQuestions.map((category, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <span className="font-semibold">{category.category}</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2">
                            {category.questions.map((question, qIndex) => (
                              <li key={qIndex} className="flex items-start gap-2 text-sm">
                                <span className="text-primary">•</span>
                                <span>{question}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              </TabsContent>

              <TabsContent value="cases" className="mt-6">
                <div className="space-y-4">
                  {[
                    { title: "Global Bank CRM Transformation", industry: "BFSI", impact: "60% faster" },
                    { title: "Retail Chain Customer 360", industry: "Retail", impact: "45% increase" },
                  ].map((caseStudy, index) => (
                    <Card key={index} className="border-border/40 bg-gradient-card p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-glass">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="mb-2 font-heading text-lg font-semibold">{caseStudy.title}</h3>
                          <Badge variant="secondary" className="mb-4">{caseStudy.industry}</Badge>
                          <p className="text-sm text-muted-foreground">Impact: {caseStudy.impact}</p>
                        </div>
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    </Card>
                  ))}
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
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 rounded-lg bg-background/50 p-3 text-sm">
                      Hi! I can help you understand the RFP better. Ask me anything about requirements, timeline, or client needs.
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <div className="border-t border-border/40 p-4">
                <div className="flex gap-2">
                  <Input placeholder="Ask a question..." className="bg-background/50" />
                  <Button size="icon" className="bg-gradient-primary shrink-0">
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
