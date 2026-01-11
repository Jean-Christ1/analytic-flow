import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Plus,
  Layout,
  FolderKanban,
  MoreHorizontal,
  Copy,
  Trash2,
  Eye,
  Edit,
  Sparkles,
  Box,
  FlaskConical,
  Rocket,
  Users,
  Clock,
  Tag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { projects, Project } from "@/data/platformData";
import { toast } from "sonner";

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  sourceProjectId: string;
  category: string;
  tags: string[];
  createdAt: string;
  usageCount: number;
  includesModels: boolean;
  includesDatasets: boolean;
  includesPipelines: boolean;
}

// Demo templates data
const demoTemplates: ProjectTemplate[] = [
  {
    id: "tpl-001",
    name: "Computer Vision Starter",
    description: "Pre-configured template for image classification projects with PyTorch and ResNet backbone.",
    sourceProjectId: "proj-001",
    category: "Computer Vision",
    tags: ["pytorch", "resnet", "classification"],
    createdAt: "2025-11-15",
    usageCount: 24,
    includesModels: true,
    includesDatasets: false,
    includesPipelines: true,
  },
  {
    id: "tpl-002",
    name: "NLP Text Analysis",
    description: "Template for sentiment analysis and text classification using transformers.",
    sourceProjectId: "proj-002",
    category: "NLP",
    tags: ["transformers", "bert", "sentiment"],
    createdAt: "2025-10-20",
    usageCount: 18,
    includesModels: true,
    includesDatasets: true,
    includesPipelines: true,
  },
  {
    id: "tpl-003",
    name: "Fraud Detection",
    description: "Real-time fraud detection template with ensemble models and feature engineering pipelines.",
    sourceProjectId: "proj-003",
    category: "Anomaly Detection",
    tags: ["xgboost", "real-time", "ensemble"],
    createdAt: "2025-09-10",
    usageCount: 12,
    includesModels: true,
    includesDatasets: false,
    includesPipelines: true,
  },
  {
    id: "tpl-004",
    name: "Time Series Forecasting",
    description: "Demand forecasting template with LSTM and Prophet integrations.",
    sourceProjectId: "proj-004",
    category: "Forecasting",
    tags: ["lstm", "prophet", "time-series"],
    createdAt: "2025-11-01",
    usageCount: 8,
    includesModels: true,
    includesDatasets: true,
    includesPipelines: false,
  },
];

const categories = ["All", "Computer Vision", "NLP", "Anomaly Detection", "Forecasting", "Recommendation"];

const ProjectTemplates = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [templates, setTemplates] = useState<ProjectTemplate[]>(demoTemplates);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    sourceProjectId: "",
    category: "",
    includesModels: true,
    includesDatasets: true,
    includesPipelines: true,
  });

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.sourceProjectId) {
      toast.error("Please fill in all required fields");
      return;
    }

    const sourceProject = projects.find(p => p.id === newTemplate.sourceProjectId);
    if (!sourceProject) {
      toast.error("Source project not found");
      return;
    }

    const template: ProjectTemplate = {
      id: `tpl-${Date.now()}`,
      name: newTemplate.name,
      description: newTemplate.description || sourceProject.description,
      sourceProjectId: newTemplate.sourceProjectId,
      category: newTemplate.category || "Other",
      tags: sourceProject.tags,
      createdAt: new Date().toISOString().split("T")[0],
      usageCount: 0,
      includesModels: newTemplate.includesModels,
      includesDatasets: newTemplate.includesDatasets,
      includesPipelines: newTemplate.includesPipelines,
    };

    setTemplates([template, ...templates]);
    setCreateDialogOpen(false);
    setNewTemplate({
      name: "",
      description: "",
      sourceProjectId: "",
      category: "",
      includesModels: true,
      includesDatasets: true,
      includesPipelines: true,
    });
    toast.success(`Template "${template.name}" created successfully`);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    toast.success("Template deleted");
  };

  const handleUseTemplate = (template: ProjectTemplate) => {
    toast.success(`Creating new project from template "${template.name}"...`);
  };

  const getSourceProject = (projectId: string): Project | undefined => {
    return projects.find(p => p.id === projectId);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Project Templates</h1>
            <p className="text-sm text-muted-foreground">Create and manage reusable project templates</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="premium" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Template from Project</DialogTitle>
                <DialogDescription>
                  Create a reusable template from an existing project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="source-project">Source Project *</Label>
                  <Select
                    value={newTemplate.sourceProjectId}
                    onValueChange={(value) => {
                      const project = projects.find(p => p.id === value);
                      setNewTemplate({
                        ...newTemplate,
                        sourceProjectId: value,
                        name: project ? `${project.name} Template` : "",
                        description: project?.description || "",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name *</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="My Template"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Template description..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newTemplate.category}
                    onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c !== "All").map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Include in Template</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={newTemplate.includesModels ? "secondary" : "outline"}
                      onClick={() => setNewTemplate({ ...newTemplate, includesModels: !newTemplate.includesModels })}
                    >
                      <Box className="h-3.5 w-3.5 mr-1.5" />
                      Models
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={newTemplate.includesDatasets ? "secondary" : "outline"}
                      onClick={() => setNewTemplate({ ...newTemplate, includesDatasets: !newTemplate.includesDatasets })}
                    >
                      <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
                      Datasets
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={newTemplate.includesPipelines ? "secondary" : "outline"}
                      onClick={() => setNewTemplate({ ...newTemplate, includesPipelines: !newTemplate.includesPipelines })}
                    >
                      <Rocket className="h-3.5 w-3.5 mr-1.5" />
                      Pipelines
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="premium" onClick={handleCreateTemplate}>
                  Create Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Templates</p>
                  <p className="text-xl font-bold">{templates.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Layout className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Usage</p>
                  <p className="text-xl font-bold text-success">
                    {templates.reduce((sum, t) => sum + t.usageCount, 0)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-success/10">
                  <Sparkles className="h-4 w-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Categories</p>
                  <p className="text-xl font-bold">
                    {new Set(templates.map(t => t.category)).size}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-info/10">
                  <Tag className="h-4 w-4 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">This Month</p>
                  <p className="text-xl font-bold">
                    {templates.filter(t => {
                      const templateDate = new Date(t.createdAt);
                      const now = new Date();
                      return templateDate.getMonth() === now.getMonth() && 
                             templateDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-4 w-4 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-muted/50"
            />
          </div>
          <div className="flex gap-1.5">
            {categories.map((category) => (
              <Button
                key={category}
                variant={categoryFilter === category ? "secondary" : "ghost"}
                size="sm"
                className="text-xs"
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const sourceProject = getSourceProject(template.sourceProjectId);
            return (
              <Card key={template.id} className="glass-card hover:border-primary/30 transition-all group">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                        <Layout className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                          {template.name}
                        </h3>
                        <Badge variant="outline" className="text-[10px] h-4 mt-0.5">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUseTemplate(template)}>
                          <Copy className="h-3.5 w-3.5 mr-2" />
                          Use Template
                        </DropdownMenuItem>
                        {sourceProject && (
                          <DropdownMenuItem asChild>
                            <Link to={`/projects/${sourceProject.id}`}>
                              <Eye className="h-3.5 w-3.5 mr-2" />
                              View Source Project
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Edit className="h-3.5 w-3.5 mr-2" />
                          Edit Template
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] h-4">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="secondary" className="text-[10px] h-4">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Includes */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {template.includesModels && (
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1">
                          <Box className="h-3 w-3" />
                          <span>Models</span>
                        </TooltipTrigger>
                        <TooltipContent>Includes model configurations</TooltipContent>
                      </Tooltip>
                    )}
                    {template.includesDatasets && (
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1">
                          <FlaskConical className="h-3 w-3" />
                          <span>Datasets</span>
                        </TooltipTrigger>
                        <TooltipContent>Includes dataset schemas</TooltipContent>
                      </Tooltip>
                    )}
                    {template.includesPipelines && (
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1">
                          <Rocket className="h-3 w-3" />
                          <span>Pipelines</span>
                        </TooltipTrigger>
                        <TooltipContent>Includes pipeline definitions</TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{template.usageCount} uses</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Copy className="h-3 w-3 mr-1.5" />
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Layout className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No templates found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== "All" 
                  ? "Try adjusting your filters or search query."
                  : "Create your first template from an existing project."}
              </p>
              <Button variant="premium" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectTemplates;
