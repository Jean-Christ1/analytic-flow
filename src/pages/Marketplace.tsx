import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Download,
  Package,
  Database,
  Shield,
  Activity,
  BarChart3,
  Leaf,
  Code2,
  Play,
  Square,
  CheckCircle2,
  Clock,
  Box,
  Info,
  Star,
  Settings,
  Archive,
  Trash2,
  RefreshCw,
  MoreVertical,
  ExternalLink,
  GitBranch,
  Network,
  Server,
  Cpu,
  Zap,
  Eye,
  Upload,
  FileText,
  TrendingUp,
  Award,
  Sparkles,
  Heart,
  Terminal,
} from "lucide-react";
import HelmImportDialog from "@/components/marketplace/HelmImportDialog";
import { BackupRestoreDialog } from "@/components/marketplace/BackupRestoreDialog";
import DependencyGraph from "@/components/marketplace/DependencyGraph";
import { ResourceDashboard } from "@/components/marketplace/ResourceDashboard";
import { ApplicationDetailsDialog } from "@/components/marketplace/ApplicationDetailsDialog";
import { ApplicationLogsDialog } from "@/components/marketplace/ApplicationLogsDialog";
import { ApplicationConfigDialog } from "@/components/marketplace/ApplicationConfigDialog";
import { toast } from "sonner";

type AppStatus = "available" | "installed" | "running" | "stopped" | "updating";

interface Application {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  status: AppStatus;
  tags: string[];
  stars: string;
  downloads?: string;
  lastUpdated?: string;
  featured?: boolean;
  trending?: boolean;
  new?: boolean;
}

const applications: Application[] = [
  // MLOps
  { id: "mlflow", name: "MLflow", description: "ML lifecycle management platform for tracking experiments, packaging code, and deploying models", category: "MLOps", icon: "🚀", version: "2.10.0", status: "running", tags: ["Tracking", "Registry"], stars: "16.8K", downloads: "2.5M", lastUpdated: "2024-01-10", featured: true },
  { id: "kubeflow", name: "Kubeflow", description: "ML toolkit for Kubernetes with pipelines and notebooks", category: "MLOps", icon: "☸️", version: "1.8.0", status: "available", tags: ["Pipelines", "K8s"], stars: "13.2K", downloads: "1.8M", lastUpdated: "2024-01-08", trending: true },
  { id: "feast", name: "Feast", description: "Feature store for ML with offline and online serving", category: "MLOps", icon: "🍽️", version: "0.38.0", status: "installed", tags: ["Features", "Store"], stars: "5.2K", downloads: "890K", lastUpdated: "2024-01-12" },
  { id: "flyte", name: "Flyte", description: "Workflow automation platform for ML and data", category: "MLOps", icon: "🦅", version: "1.10.0", status: "available", tags: ["Workflows", "Pipelines"], stars: "4.8K", downloads: "650K", lastUpdated: "2024-01-05" },
  { id: "arize-phoenix", name: "Arize Phoenix", description: "ML observability and model evaluation", category: "MLOps", icon: "🔮", version: "3.0.0", status: "installed", tags: ["Observability", "Evaluation"], stars: "2.1K", downloads: "320K", lastUpdated: "2024-01-15", new: true },
  { id: "deepchecks", name: "Deepchecks", description: "Testing and monitoring for ML models", category: "MLOps", icon: "✅", version: "0.18.0", status: "available", tags: ["Testing", "Validation"], stars: "3.2K", downloads: "450K", lastUpdated: "2024-01-09" },
  { id: "bentoml", name: "BentoML", description: "Build production-ready ML services", category: "MLOps", icon: "🍱", version: "1.2.0", status: "available", tags: ["Serving", "Deployment"], stars: "6.1K", downloads: "720K", lastUpdated: "2024-01-11" },
  { id: "seldon", name: "Seldon Core", description: "ML deployment on Kubernetes", category: "MLOps", icon: "⚡", version: "1.17.0", status: "installed", tags: ["K8s", "Inference"], stars: "4.0K", downloads: "580K", lastUpdated: "2024-01-08" },
  
  // Data
  { id: "iceberg", name: "Apache Iceberg", description: "High-performance table format for huge analytic datasets", category: "Data", icon: "❄️", version: "1.4.2", status: "installed", tags: ["Data Lake", "Tables"], stars: "5.2K", downloads: "780K", lastUpdated: "2024-01-11" },
  { id: "datahub", name: "DataHub", description: "Modern data catalog with lineage and governance", category: "Data", icon: "📊", version: "0.12.1", status: "running", tags: ["Catalog", "Lineage"], stars: "8.9K", downloads: "1.2M", lastUpdated: "2024-01-14", featured: true },
  { id: "airbyte", name: "Airbyte", description: "Data integration platform with 300+ connectors", category: "Data", icon: "🔄", version: "0.50.0", status: "available", tags: ["ETL", "Connectors"], stars: "12.4K", downloads: "2.1M", lastUpdated: "2024-01-13", trending: true },
  { id: "great-expectations", name: "Great Expectations", description: "Data validation and documentation framework", category: "Data", icon: "📋", version: "0.17.0", status: "running", tags: ["Validation", "Quality"], stars: "9.1K", downloads: "1.5M", lastUpdated: "2024-01-07" },
  { id: "delta-lake", name: "Delta Lake", description: "ACID transactions for data lakes", category: "Data", icon: "🔺", version: "2.4.0", status: "installed", tags: ["ACID", "Lake"], stars: "6.7K", downloads: "980K", lastUpdated: "2024-01-06" },
  { id: "dbt", name: "dbt Core", description: "Data transformation workflow tool", category: "Data", icon: "🔧", version: "1.7.0", status: "running", tags: ["Transform", "SQL"], stars: "8.3K", downloads: "3.2M", lastUpdated: "2024-01-12" },
  { id: "apache-spark", name: "Apache Spark", description: "Unified analytics engine for big data", category: "Data", icon: "⚡", version: "3.5.0", status: "running", tags: ["Processing", "Analytics"], stars: "37.8K", downloads: "8.5M", lastUpdated: "2024-01-10" },
  { id: "trino", name: "Trino", description: "Fast distributed SQL query engine", category: "Data", icon: "🔍", version: "435", status: "available", tags: ["SQL", "Query"], stars: "9.2K", downloads: "1.8M", lastUpdated: "2024-01-14" },
  { id: "nifi", name: "Apache NiFi", description: "Data flow automation", category: "Data", icon: "🌊", version: "1.25.0", status: "available", tags: ["Flow", "Integration"], stars: "4.3K", downloads: "890K", lastUpdated: "2024-01-09" },
  
  // Observability
  { id: "prometheus", name: "Prometheus", description: "Time-series monitoring and alerting system", category: "Observability", icon: "🔥", version: "2.48.0", status: "running", tags: ["Metrics", "Alerting"], stars: "52.1K", downloads: "15M", lastUpdated: "2024-01-14", featured: true },
  { id: "grafana", name: "Grafana", description: "Analytics and interactive visualization platform", category: "Observability", icon: "📈", version: "10.3.0", status: "running", tags: ["Dashboards", "Visualization"], stars: "59.2K", downloads: "18M", lastUpdated: "2024-01-15" },
  { id: "opentelemetry", name: "OpenTelemetry", description: "Observability framework for traces, metrics, logs", category: "Observability", icon: "📡", version: "1.32.0", status: "running", tags: ["Tracing", "APM"], stars: "3.8K", downloads: "5.2M", lastUpdated: "2024-01-13" },
  { id: "loki", name: "Grafana Loki", description: "Log aggregation system like Prometheus", category: "Observability", icon: "📜", version: "2.9.0", status: "installed", tags: ["Logs", "Aggregation"], stars: "21.5K", downloads: "6.8M", lastUpdated: "2024-01-11" },
  { id: "jaeger", name: "Jaeger", description: "Distributed tracing system", category: "Observability", icon: "🔍", version: "1.52.0", status: "available", tags: ["Tracing", "Distributed"], stars: "19.2K", downloads: "4.5M", lastUpdated: "2024-01-09" },
  { id: "elk-stack", name: "ELK Stack", description: "Elasticsearch, Logstash, Kibana for log analytics", category: "Observability", icon: "🦌", version: "8.11.0", status: "available", tags: ["Logs", "Search"], stars: "67.3K", downloads: "25M", lastUpdated: "2024-01-08" },
  { id: "signoz", name: "SigNoz", description: "Open-source APM and observability platform", category: "Observability", icon: "📊", version: "0.38.0", status: "available", tags: ["APM", "OpenSource"], stars: "15.8K", downloads: "2.1M", lastUpdated: "2024-01-12", new: true },
  
  // Security
  { id: "vault", name: "HashiCorp Vault", description: "Secrets management and encryption as a service", category: "Security", icon: "🔐", version: "1.15.4", status: "running", tags: ["Secrets", "Encryption"], stars: "29.3K", downloads: "12M", lastUpdated: "2024-01-14", featured: true },
  { id: "trivy", name: "Trivy", description: "Container and filesystem vulnerability scanner", category: "Security", icon: "🔒", version: "0.49.0", status: "running", tags: ["Scanning", "CVE"], stars: "20.8K", downloads: "8.2M", lastUpdated: "2024-01-15" },
  { id: "opa", name: "Open Policy Agent", description: "Policy engine for unified policy enforcement", category: "Security", icon: "📜", version: "0.60.0", status: "installed", tags: ["Policy", "Authorization"], stars: "8.9K", downloads: "3.8M", lastUpdated: "2024-01-10" },
  { id: "kyverno", name: "Kyverno", description: "Kubernetes native policy management", category: "Security", icon: "🛡️", version: "1.11.0", status: "available", tags: ["K8s Policy", "Admission"], stars: "4.8K", downloads: "1.2M", lastUpdated: "2024-01-07" },
  { id: "checkov", name: "Checkov", description: "Infrastructure as code security scanning", category: "Security", icon: "✓", version: "3.1.0", status: "installed", tags: ["IaC", "Compliance"], stars: "6.3K", downloads: "2.5M", lastUpdated: "2024-01-12" },
  { id: "gitleaks", name: "Gitleaks", description: "Secret scanning for git repositories", category: "Security", icon: "🕵️", version: "8.18.0", status: "running", tags: ["Secrets", "Git"], stars: "14.7K", downloads: "5.6M", lastUpdated: "2024-01-13" },
  { id: "sonarqube", name: "SonarQube", description: "Code quality and security analysis platform", category: "Security", icon: "🔬", version: "10.3.0", status: "available", tags: ["SAST", "Quality"], stars: "8.4K", downloads: "4.2M", lastUpdated: "2024-01-06" },
  { id: "falco", name: "Falco", description: "Runtime security monitoring", category: "Security", icon: "🦅", version: "0.37.0", status: "available", tags: ["Runtime", "K8s"], stars: "6.8K", downloads: "1.9M", lastUpdated: "2024-01-11" },
  
  // FinOps
  { id: "kubecost", name: "Kubecost", description: "Kubernetes cost monitoring and optimization", category: "FinOps", icon: "💰", version: "2.0.0", status: "installed", tags: ["Cost", "K8s"], stars: "4.1K", downloads: "980K", lastUpdated: "2024-01-11" },
  { id: "opencost", name: "OpenCost", description: "Open source cost monitoring for Kubernetes", category: "FinOps", icon: "💵", version: "1.108.0", status: "running", tags: ["Cost", "CNCF"], stars: "4.5K", downloads: "1.1M", lastUpdated: "2024-01-14", trending: true },
  { id: "karpenter", name: "Karpenter", description: "Kubernetes node provisioning for cost efficiency", category: "FinOps", icon: "⚙️", version: "0.33.0", status: "installed", tags: ["Autoscaling", "Nodes"], stars: "5.7K", downloads: "1.5M", lastUpdated: "2024-01-09" },
  { id: "infracost", name: "Infracost", description: "Cloud cost estimates for Terraform", category: "FinOps", icon: "📊", version: "0.10.0", status: "available", tags: ["Terraform", "Estimates"], stars: "9.8K", downloads: "2.8M", lastUpdated: "2024-01-08" },
  { id: "vantage", name: "Vantage", description: "Cloud cost transparency platform", category: "FinOps", icon: "👁️", version: "1.5.0", status: "available", tags: ["Multi-cloud", "Reports"], stars: "1.2K", downloads: "320K", lastUpdated: "2024-01-10" },
  
  // GreenOps
  { id: "kepler", name: "Kepler", description: "Kubernetes-based power consumption monitoring", category: "GreenOps", icon: "🌱", version: "0.7.0", status: "available", tags: ["Energy", "Power"], stars: "1.2K", downloads: "180K", lastUpdated: "2024-01-10" },
  { id: "cloud-carbon", name: "Cloud Carbon Footprint", description: "Carbon emissions measurement for cloud", category: "GreenOps", icon: "🌍", version: "1.10.0", status: "installed", tags: ["Carbon", "Emissions"], stars: "0.8K", downloads: "120K", lastUpdated: "2024-01-07" },
  { id: "scaphandre", name: "Scaphandre", description: "Power consumption measurement agent", category: "GreenOps", icon: "⚡", version: "1.0.0", status: "available", tags: ["Power", "Metrics"], stars: "1.5K", downloads: "95K", lastUpdated: "2024-01-05" },
  { id: "codecarbon", name: "CodeCarbon", description: "Track carbon emissions from computing", category: "GreenOps", icon: "🌿", version: "2.3.0", status: "running", tags: ["Tracking", "ML"], stars: "1.0K", downloads: "250K", lastUpdated: "2024-01-12" },
  
  // Development
  { id: "jupyterhub", name: "JupyterHub", description: "Multi-user Jupyter notebook server", category: "Development", icon: "📓", version: "4.0.0", status: "running", tags: ["Notebooks", "Multi-user"], stars: "7.5K", downloads: "4.2M", lastUpdated: "2024-01-14" },
  { id: "vscode-server", name: "VS Code Server", description: "Run VS Code on any machine", category: "Development", icon: "💻", version: "4.19.0", status: "running", tags: ["IDE", "Remote"], stars: "63.2K", downloads: "28M", lastUpdated: "2024-01-15", featured: true },
  { id: "rstudio", name: "RStudio Server", description: "IDE for R programming", category: "Development", icon: "📊", version: "2023.12.0", status: "available", tags: ["R", "Statistics"], stars: "4.5K", downloads: "2.1M", lastUpdated: "2024-01-06" },
  { id: "gitpod", name: "Gitpod", description: "Cloud development environments", category: "Development", icon: "🍊", version: "2023.11.0", status: "available", tags: ["Cloud IDE", "DevEnv"], stars: "12.1K", downloads: "3.5M", lastUpdated: "2024-01-09" },
  { id: "coder", name: "Coder", description: "Remote development on your infrastructure", category: "Development", icon: "🖥️", version: "2.6.0", status: "available", tags: ["Remote", "Workspaces"], stars: "5.8K", downloads: "1.2M", lastUpdated: "2024-01-11", new: true },
  
  // CI/CD
  { id: "argocd", name: "Argo CD", description: "GitOps continuous delivery for Kubernetes", category: "CI/CD", icon: "🐙", version: "2.9.0", status: "running", tags: ["GitOps", "Delivery"], stars: "15.4K", downloads: "6.8M", lastUpdated: "2024-01-13" },
  { id: "tekton", name: "Tekton", description: "Kubernetes-native CI/CD pipelines", category: "CI/CD", icon: "🔗", version: "0.54.0", status: "installed", tags: ["Pipelines", "K8s"], stars: "8.1K", downloads: "2.9M", lastUpdated: "2024-01-10" },
  { id: "argo-workflows", name: "Argo Workflows", description: "Kubernetes workflow engine for orchestration", category: "CI/CD", icon: "🔄", version: "3.5.0", status: "running", tags: ["Workflows", "DAG"], stars: "13.8K", downloads: "4.5M", lastUpdated: "2024-01-11" },
  { id: "jenkins", name: "Jenkins", description: "Extensible automation server", category: "CI/CD", icon: "🎩", version: "2.426.0", status: "available", tags: ["Automation", "Build"], stars: "22.1K", downloads: "35M", lastUpdated: "2024-01-08" },
  { id: "flux", name: "Flux CD", description: "GitOps toolkit for Kubernetes", category: "CI/CD", icon: "🔀", version: "2.2.0", status: "available", tags: ["GitOps", "K8s"], stars: "5.9K", downloads: "2.1M", lastUpdated: "2024-01-12" },
  
  // Testing
  { id: "pytest", name: "Pytest", description: "Python testing framework", category: "Testing", icon: "🧪", version: "7.4.0", status: "running", tags: ["Python", "Unit"], stars: "11.2K", downloads: "45M", lastUpdated: "2024-01-12" },
  { id: "locust", name: "Locust", description: "Scalable load testing framework", category: "Testing", icon: "🦗", version: "2.20.0", status: "installed", tags: ["Load", "Performance"], stars: "23.1K", downloads: "8.5M", lastUpdated: "2024-01-09" },
  { id: "k6", name: "K6", description: "Modern load testing tool for developers", category: "Testing", icon: "⚡", version: "0.48.0", status: "available", tags: ["Load", "Performance"], stars: "22.8K", downloads: "7.2M", lastUpdated: "2024-01-14", trending: true },
  { id: "selenium", name: "Selenium Grid", description: "Browser automation testing at scale", category: "Testing", icon: "🌐", version: "4.15.0", status: "available", tags: ["Browser", "E2E"], stars: "28.5K", downloads: "52M", lastUpdated: "2024-01-07" },
  { id: "playwright", name: "Playwright", description: "End-to-end testing for modern web apps", category: "Testing", icon: "🎭", version: "1.41.0", status: "available", tags: ["E2E", "Browser"], stars: "57.2K", downloads: "12M", lastUpdated: "2024-01-14", new: true },
  
  // Infrastructure
  { id: "terraform", name: "Terraform", description: "Infrastructure as code tool", category: "Infrastructure", icon: "🏗️", version: "1.6.0", status: "running", tags: ["IaC", "Provisioning"], stars: "40.2K", downloads: "85M", lastUpdated: "2024-01-15" },
  { id: "ansible", name: "Ansible", description: "Automation and configuration management", category: "Infrastructure", icon: "🤖", version: "2.16.0", status: "installed", tags: ["Config", "Automation"], stars: "60.1K", downloads: "120M", lastUpdated: "2024-01-13" },
  { id: "pulumi", name: "Pulumi", description: "Infrastructure as code with real languages", category: "Infrastructure", icon: "🎯", version: "3.96.0", status: "available", tags: ["IaC", "Multi-cloud"], stars: "19.2K", downloads: "5.8M", lastUpdated: "2024-01-10" },
  { id: "crossplane", name: "Crossplane", description: "Kubernetes add-on for infrastructure management", category: "Infrastructure", icon: "✈️", version: "1.14.0", status: "available", tags: ["K8s", "Multi-cloud"], stars: "8.3K", downloads: "2.1M", lastUpdated: "2024-01-06" },
  { id: "minio", name: "MinIO", description: "High-performance object storage", category: "Infrastructure", icon: "📦", version: "2024.01.0", status: "running", tags: ["S3", "Storage"], stars: "42.1K", downloads: "18M", lastUpdated: "2024-01-14" },
  { id: "postgresql", name: "PostgreSQL", description: "Advanced open-source relational database", category: "Infrastructure", icon: "🐘", version: "16.1", status: "running", tags: ["Database", "SQL"], stars: "14.2K", downloads: "85M", lastUpdated: "2024-01-12" },
  { id: "redis", name: "Redis", description: "In-memory data structure store", category: "Infrastructure", icon: "⚡", version: "7.2.0", status: "running", tags: ["Cache", "NoSQL"], stars: "62.8K", downloads: "95M", lastUpdated: "2024-01-11" },
];

const categories = ["All", "MLOps", "Data", "Observability", "Security", "FinOps", "GreenOps", "Development", "CI/CD", "Testing", "Infrastructure"];
const ITEMS_PER_PAGE = 6;

const categoryIcons: Record<string, React.ReactNode> = {
  MLOps: <Zap className="h-4 w-4" />,
  Data: <Database className="h-4 w-4" />,
  Observability: <Activity className="h-4 w-4" />,
  Security: <Shield className="h-4 w-4" />,
  FinOps: <BarChart3 className="h-4 w-4" />,
  GreenOps: <Leaf className="h-4 w-4" />,
  Development: <Code2 className="h-4 w-4" />,
  "CI/CD": <GitBranch className="h-4 w-4" />,
  Testing: <CheckCircle2 className="h-4 w-4" />,
  Infrastructure: <Server className="h-4 w-4" />,
};

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMainTab, setActiveMainTab] = useState("applications");
  const [helmDialogOpen, setHelmDialogOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [selectedAppForBackup, setSelectedAppForBackup] = useState<string>("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const filteredApps = applications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredApps.length / ITEMS_PER_PAGE);
  const paginatedApps = filteredApps.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const featuredApps = applications.filter(app => app.featured);
  const trendingApps = applications.filter(app => app.trending);
  const newApps = applications.filter(app => app.new);

  const getStatusColor = (status: AppStatus) => {
    switch (status) {
      case "running": return "success";
      case "installed": return "info";
      case "stopped": return "warning";
      case "updating": return "secondary";
      default: return "secondary";
    }
  };

  const stats = {
    total: applications.length,
    running: applications.filter(a => a.status === "running").length,
    installed: applications.filter(a => a.status === "installed").length,
    available: applications.filter(a => a.status === "available").length,
  };

  const handleInstall = (app: Application) => {
    toast.success(`Installation de ${app.name} démarrée...`);
  };

  const handleStart = (app: Application) => {
    toast.success(`Démarrage de ${app.name}...`);
  };

  const handleStop = (app: Application) => {
    toast.success(`Arrêt de ${app.name}...`);
  };

  const handleUninstall = (app: Application) => {
    toast.success(`Désinstallation de ${app.name}...`);
  };

  const handleUpdate = (app: Application) => {
    toast.success(`Mise à jour de ${app.name} vers la dernière version...`);
  };

  const handleOpenBackup = (appName: string) => {
    setSelectedAppForBackup(appName);
    setBackupDialogOpen(true);
  };

  const handleOpenDetails = (app: Application) => {
    setSelectedApp(app);
    setDetailsDialogOpen(true);
  };

  const handleOpenLogs = (app: Application) => {
    setSelectedApp(app);
    setLogsDialogOpen(true);
  };

  const handleOpenConfig = (app: Application) => {
    setSelectedApp(app);
    setConfigDialogOpen(true);
  };

  const renderAppCard = (app: Application, compact = false) => (
    <Card key={app.id} className={`glass-card hover:border-primary/30 transition-colors group ${compact ? "h-full" : ""}`}>
      <CardHeader className="pb-1 pt-3 px-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{app.icon}</span>
            <div>
              <h3 className="font-semibold text-xs flex items-center gap-1.5">
                {app.name}
                {app.featured && <Award className="h-2.5 w-2.5 text-gold" />}
                {app.trending && <TrendingUp className="h-2.5 w-2.5 text-success" />}
                {app.new && <Sparkles className="h-2.5 w-2.5 text-info" />}
                <Tooltip>
                  <TooltipTrigger>
                    <ExternalLink 
                      className="h-2.5 w-2.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer" 
                      onClick={(e) => { e.stopPropagation(); handleOpenDetails(app); }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>View details</TooltipContent>
                </Tooltip>
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>v{app.version}</span>
                <span className="flex items-center gap-0.5">
                  <Star className="h-2.5 w-2.5 fill-gold text-gold" />
                  {app.stars}
                </span>
                {app.downloads && (
                  <span className="flex items-center gap-0.5">
                    <Download className="h-2.5 w-2.5" />
                    {app.downloads}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Badge variant={getStatusColor(app.status)} className="text-[9px] px-1.5 py-0">
              {app.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleOpenDetails(app)}>
                  <Eye className="h-3.5 w-3.5 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenConfig(app)}>
                  <Settings className="h-3.5 w-3.5 mr-2" />
                  Configure
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenBackup(app.name)}>
                  <Archive className="h-3.5 w-3.5 mr-2" />
                  Backup / Restore
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenLogs(app)}>
                  <Terminal className="h-3.5 w-3.5 mr-2" />
                  View Logs
                </DropdownMenuItem>
                {app.status !== "available" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleUpdate(app)}>
                      <RefreshCw className="h-3.5 w-3.5 mr-2" />
                      Update
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUninstall(app)} className="text-destructive">
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Uninstall
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 px-3">
        <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2">{app.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {app.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0">{tag}</Badge>
            ))}
          </div>
          {app.status === "available" ? (
            <Button size="sm" variant="premium" className="h-6 text-[10px] px-2" onClick={() => handleInstall(app)}>
              <Download className="h-2.5 w-2.5 mr-1" />
              Install
            </Button>
          ) : app.status === "running" ? (
            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleStop(app)}>
              <Square className="h-2.5 w-2.5 mr-1" />
              Stop
            </Button>
          ) : app.status === "installed" || app.status === "stopped" ? (
            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleStart(app)}>
              <Play className="h-2.5 w-2.5 mr-1" />
              Start
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" disabled>
              <RefreshCw className="h-2.5 w-2.5 mr-1 animate-spin" />
              Updating
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-3 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              Applications Marketplace
              <Tooltip>
                <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Deploy and manage open-source tools for your MLOps infrastructure. Browse, install, and configure applications with full lifecycle management.
                </TooltipContent>
              </Tooltip>
            </h1>
            <p className="text-xs text-muted-foreground">
              {stats.total} applications disponibles • {stats.running} en cours d'exécution
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success("Synchronisation du catalogue...")}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Sync
            </Button>
            <Button variant="premium" size="sm" onClick={() => setHelmDialogOpen(true)}>
              <Package className="h-3.5 w-3.5 mr-1" />
              Import Helm
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total Apps", value: stats.total, icon: Box, color: "text-primary" },
            { label: "Running", value: stats.running, icon: Play, color: "text-success" },
            { label: "Installed", value: stats.installed, icon: CheckCircle2, color: "text-info" },
            { label: "Available", value: stats.available, icon: Clock, color: "text-muted-foreground" },
          ].map((stat, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="py-2 px-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold font-display">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
          <TabsList className="bg-muted/50 p-1 h-8">
            <TabsTrigger value="applications" className="text-xs px-3 h-6">
              <Package className="h-3.5 w-3.5 mr-1.5" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="featured" className="text-xs px-3 h-6">
              <Award className="h-3.5 w-3.5 mr-1.5" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="text-xs px-3 h-6">
              <Network className="h-3.5 w-3.5 mr-1.5" />
              Dependencies
            </TabsTrigger>
            <TabsTrigger value="resources" className="text-xs px-3 h-6">
              <Cpu className="h-3.5 w-3.5 mr-1.5" />
              Resources
            </TabsTrigger>
          </TabsList>

          {/* Featured Tab */}
          <TabsContent value="featured" className="mt-4 space-y-6">
            {/* Featured Apps */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-gold" />
                <h2 className="text-sm font-semibold">Featured Applications</h2>
                <Badge variant="secondary" className="text-xs">{featuredApps.length}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {featuredApps.slice(0, 6).map(app => renderAppCard(app))}
              </div>
            </div>

            {/* Trending Apps */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-success" />
                <h2 className="text-sm font-semibold">Trending This Week</h2>
                <Badge variant="secondary" className="text-xs">{trendingApps.length}</Badge>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {trendingApps.map(app => (
                  <Card key={app.id} className="glass-card hover:border-primary/30 transition-colors cursor-pointer" onClick={() => handleOpenDetails(app)}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{app.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{app.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="h-3 w-3 fill-gold text-gold" />
                            {app.stars}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(app.status)} className="text-[10px]">{app.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* New Apps */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-info" />
                <h2 className="text-sm font-semibold">Recently Added</h2>
                <Badge variant="secondary" className="text-xs">{newApps.length}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {newApps.map(app => renderAppCard(app))}
              </div>
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="mt-3 space-y-2">
            {/* Search and Category Filter */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-9 h-8 bg-muted/50 text-xs"
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {filteredApps.length} résultats
              </span>
            </div>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}>
              <TabsList className="bg-muted/50 p-0.5 h-auto flex-wrap">
                {categories.map(cat => (
                  <TabsTrigger key={cat} value={cat} className="text-[10px] px-2 py-1 flex items-center gap-1">
                    {cat !== "All" && categoryIcons[cat]}
                    {cat}
                    <Badge variant="outline" className="text-[9px] ml-0.5 h-4 px-1">
                      {cat === "All" ? applications.length : applications.filter(a => a.category === cat).length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={selectedCategory} className="mt-2">
                {/* Applications Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {paginatedApps.map(app => renderAppCard(app))}
                </div>

                {/* Pagination - Same style as DataCatalog */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">
                      Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredApps.length)} of {filteredApps.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <Button 
                          key={i + 1} 
                          variant={currentPage === i + 1 ? "secondary" : "ghost"} 
                          size="icon" 
                          className="h-7 w-7 text-xs" 
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      ))}
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Dependencies Graph Tab */}
          <TabsContent value="dependencies" className="mt-4">
            <DependencyGraph />
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="mt-4">
            <ResourceDashboard />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <HelmImportDialog open={helmDialogOpen} onOpenChange={setHelmDialogOpen} />
      <BackupRestoreDialog 
        open={backupDialogOpen} 
        onOpenChange={setBackupDialogOpen} 
        appName={selectedAppForBackup} 
      />
      <ApplicationDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        app={selectedApp}
        onInstall={() => selectedApp && handleInstall(selectedApp)}
        onStart={() => selectedApp && handleStart(selectedApp)}
        onStop={() => selectedApp && handleStop(selectedApp)}
      />
      <ApplicationLogsDialog
        open={logsDialogOpen}
        onOpenChange={setLogsDialogOpen}
        appName={selectedApp?.name || ""}
      />
      <ApplicationConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        appName={selectedApp?.name || ""}
      />
    </DashboardLayout>
  );
};

export default Marketplace;
