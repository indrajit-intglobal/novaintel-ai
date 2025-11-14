import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react";

export default function CaseStudies() {
  const caseStudies = [
    {
      title: "AI Claims Automation",
      industry: "Insurance",
      impact: "45% Faster Claims Processing",
      description: "Automated claims processing system for a leading insurance provider",
    },
    {
      title: "Retail Personalization Engine",
      industry: "Retail",
      impact: "25% Conversion Increase",
      description: "AI-powered personalization platform for omnichannel retail experience",
    },
    {
      title: "Banking Fraud Detection",
      industry: "BFSI",
      impact: "99.2% Accuracy Rate",
      description: "Real-time fraud detection system processing millions of transactions daily",
    },
    {
      title: "Healthcare Patient Portal",
      industry: "Healthcare",
      impact: "60% Reduction in Admin Time",
      description: "Comprehensive patient management and engagement platform",
    },
    {
      title: "Manufacturing IoT Platform",
      industry: "Manufacturing",
      impact: "35% Efficiency Gain",
      description: "Connected factory solution with predictive maintenance capabilities",
    },
    {
      title: "EdTech Learning Platform",
      industry: "Education",
      impact: "3M+ Active Users",
      description: "Adaptive learning platform with AI-driven personalization",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 font-heading text-3xl font-bold">Case Studies</h1>
            <p className="text-muted-foreground">Showcase your success stories and wins</p>
          </div>
          <Button className="bg-gradient-primary">
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
            />
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {caseStudies.map((study, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden border-border/40 bg-gradient-card backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-glass"
            >
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {study.industry}
                  </Badge>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <h3 className="mb-2 font-heading text-xl font-semibold">{study.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{study.description}</p>
                <div className="rounded-lg bg-primary/5 p-3">
                  <p className="text-sm font-semibold text-primary">{study.impact}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
