import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Clock, Heart, TrendingUp, MoreVertical, Edit, Trash2, Eye } from "lucide-react";
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

export default function Dashboard() {
  const stats = [
    { title: "Active Projects", value: "14", icon: Briefcase, trend: "+12%" },
    { title: "Time Saved", value: "128 hrs", icon: Clock, trend: "+23%" },
    { title: "Client Satisfaction", value: "97%", icon: Heart, trend: "+5%" },
    { title: "Top Industry", value: "BFSI", icon: TrendingUp, trend: "45%" },
  ];

  const projects = [
    {
      name: "Enterprise CRM Implementation",
      client: "TechCorp Solutions",
      industry: "Technology",
      status: "In Progress",
      updated: "2 hours ago",
    },
    {
      name: "Cloud Migration Strategy",
      client: "Global Bank Inc",
      industry: "BFSI",
      status: "Review",
      updated: "5 hours ago",
    },
    {
      name: "AI Analytics Platform",
      client: "RetailMax",
      industry: "Retail",
      status: "Completed",
      updated: "1 day ago",
    },
    {
      name: "Digital Transformation",
      client: "HealthCare Plus",
      industry: "Healthcare",
      status: "In Progress",
      updated: "3 hours ago",
    },
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
              <Button className="bg-gradient-primary">New Project</Button>
            </div>
          </div>
          <div className="p-6">
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
                {projects.map((project, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.client}</TableCell>
                    <TableCell>{project.industry}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{project.updated}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
      </div>
    </DashboardLayout>
  );
}
