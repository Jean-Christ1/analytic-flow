// Hierarchical Data Model for Enterprise MLOps Platform
// Structure: Project (Group) > Approach (Sub-group) > Repositories

export type Environment = "development" | "staging" | "production" | "sandbox";
export type AIActRiskCategory = "minimal" | "limited" | "high" | "unacceptable";
export type DataClassification = "public" | "internal" | "confidential" | "personal" | "restricted";
export type RepositoryType = "ml-core" | "ml-training" | "ml-inference" | "ml-monitoring" | "ci-cd-shared" | "docs";
export type IDEType = "vscode" | "jupyter" | "rstudio";

export interface Repository {
  id: string;
  name: string;
  type: RepositoryType;
  description: string;
  gitUrl: string;
  branch: string;
  lastCommit: string;
  lastCommitAuthor: string;
  lastCommitDate: string;
  status: "active" | "archived" | "draft";
  structure: {
    folders: string[];
    files: string[];
  };
}

export interface Approach {
  id: string;
  name: string;
  description: string;
  projectId: string;
  status: "active" | "paused" | "completed" | "archived";
  repositories: Repository[];
  experiments: string[];
  models: string[];
  datasets: string[];
  pipelines: string[];
  team: string[];
  createdAt: string;
  updatedAt: string;
  environment: Environment;
}

export interface HierarchicalProject {
  id: string;
  name: string;
  code: string;
  description: string;
  businessObjectives: string;
  status: "active" | "paused" | "completed" | "archived";
  
  // Organizational
  owner: {
    id: string;
    name: string;
    role: string;
    email: string;
  };
  team: ProjectTeamMember[];
  department: string;
  domain: string;
  subdomain: string;
  priority: "critical" | "high" | "medium" | "low";
  sla: string;
  tags: string[];
  
  // IDE Configuration
  preferredIDE: IDEType;
  
  // Compliance & Governance
  aiActRiskCategory: AIActRiskCategory;
  complianceRequirements: string[];
  dataClassification: DataClassification;
  gdprApplicable: boolean;
  hipaaApplicable: boolean;
  anonymizationRequired: boolean;
  retentionPolicy: string;
  
  // Structure
  approaches: Approach[];
  sharedRepository: Repository;
  docsRepository: Repository;
  
  // Environments
  environments: EnvironmentConfig[];
  sandboxEnabled: boolean;
  sandboxJustification?: string;
  sandboxExpiry?: string;
  
  // Resources
  resources: {
    cpu: number;
    memory: number;
    gpu: number;
    storage: number;
    monthlyCost: number;
    carbonEmissions: number;
  };
  
  // Dates
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
}

export interface EnvironmentConfig {
  name: Environment;
  status: "active" | "inactive" | "provisioning";
  resources: {
    cpu: number;
    memory: number;
    gpu: number;
    storage: number;
  };
  pythonVersion: string;
  rVersion?: string;
  packages: string[];
  runType: "interactive" | "batch" | "api";
  accessControl: {
    roles: string[];
    users: string[];
  };
}

export interface ProjectTeamMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: ProjectRole;
  avatar?: string;
}

export type ProjectRole = 
  | "project-owner"
  | "lead-data-scientist"
  | "data-scientist"
  | "ml-engineer"
  | "mlops-engineer"
  | "data-engineer"
  | "software-engineer"
  | "qa-engineer"
  | "product-owner"
  | "tech-lead"
  | "stakeholder"
  | "viewer";

export const projectRoleLabels: Record<ProjectRole, string> = {
  "project-owner": "Project Owner",
  "lead-data-scientist": "Lead Data Scientist",
  "data-scientist": "Data Scientist",
  "ml-engineer": "ML Engineer",
  "mlops-engineer": "MLOps Engineer",
  "data-engineer": "Data Engineer",
  "software-engineer": "Software Engineer",
  "qa-engineer": "QA Engineer",
  "product-owner": "Product Owner",
  "tech-lead": "Tech Lead",
  "stakeholder": "Stakeholder",
  "viewer": "Viewer",
};

export const aiActRiskLabels: Record<AIActRiskCategory, { label: string; description: string; color: string }> = {
  minimal: {
    label: "Minimal Risk",
    description: "AI systems with minimal or no risk to individuals",
    color: "success",
  },
  limited: {
    label: "Limited Risk",
    description: "AI systems with specific transparency obligations",
    color: "info",
  },
  high: {
    label: "High Risk",
    description: "AI systems subject to strict requirements before market placement",
    color: "warning",
  },
  unacceptable: {
    label: "Unacceptable Risk",
    description: "AI systems that are prohibited",
    color: "destructive",
  },
};

export const dataClassificationLabels: Record<DataClassification, { label: string; description: string; color: string }> = {
  public: {
    label: "Public",
    description: "Data freely available without restrictions",
    color: "success",
  },
  internal: {
    label: "Internal",
    description: "Data for internal use only",
    color: "info",
  },
  confidential: {
    label: "Confidential",
    description: "Sensitive business data requiring protection",
    color: "warning",
  },
  personal: {
    label: "Personal Data",
    description: "Personal identifiable information (PII)",
    color: "warning",
  },
  restricted: {
    label: "Restricted",
    description: "Highly sensitive data with strict access controls",
    color: "destructive",
  },
};

export const repositoryDescriptions: Record<RepositoryType, { name: string; description: string; folders: string[] }> = {
  "ml-core": {
    name: "ML Core Library",
    description: "Shared ML logic: feature engineering, preprocessing, postprocessing, schemas, scoring utilities",
    folders: ["src/features/", "src/preprocessing/", "src/postprocessing/", "src/schemas/", "src/utils/", "tests/", "docker/"],
  },
  "ml-training": {
    name: "ML Training Pipeline",
    description: "Model training: data ingestion, training, evaluation, hyperparameter tuning, model registry",
    folders: ["src/data_ingestion/", "src/train.py", "src/evaluate.py", "src/tuning.py", "configs/", "tests/", "docker/"],
  },
  "ml-inference": {
    name: "ML Inference Pipeline",
    description: "Production inference: model loading, API/batch predictions, post-processing, serving",
    folders: ["src/api/", "src/batch/", "src/load_model.py", "src/predict.py", "configs/", "tests/", "docker/"],
  },
  "ml-monitoring": {
    name: "ML Monitoring",
    description: "Production monitoring: data validation, drift detection, model comparison, alerting",
    folders: ["src/data_validation/", "src/drift_detection/", "src/model_comparison/", "src/metrics/", "src/alerting/", "dashboards/", "tests/"],
  },
  "ci-cd-shared": {
    name: "CI/CD & Shared Templates",
    description: "Shared CI/CD pipelines, deployment templates, ArgoCD manifests, build scripts",
    folders: ["templates/", "scripts/", "argocd/", "helm/"],
  },
  "docs": {
    name: "Documentation",
    description: "Project documentation: architecture, governance, onboarding, policies",
    folders: ["architecture/", "governance/", "api-reference/", "onboarding/"],
  },
};

// Helper function to create standard repositories for an approach
const createApproachRepositories = (projectCode: string, approachName: string, approachId: string): Repository[] => {
  const slug = approachName.toLowerCase().replace(/\s+/g, '-');
  return [
    {
      id: `repo-${approachId}-core`,
      name: "ml-core",
      type: "ml-core",
      description: `Shared feature engineering and preprocessing for ${approachName}`,
      gitUrl: `gitlab.com/${projectCode.toLowerCase()}/${slug}/ml-core`,
      branch: "main",
      lastCommit: "Initial commit",
      lastCommitAuthor: "System",
      lastCommitDate: "Just now",
      status: "active",
      structure: { folders: ["src/", "tests/", "docker/"], files: ["pyproject.toml", ".gitlab-ci.yml"] },
    },
    {
      id: `repo-${approachId}-training`,
      name: "ml-training",
      type: "ml-training",
      description: `Training pipeline for ${approachName}`,
      gitUrl: `gitlab.com/${projectCode.toLowerCase()}/${slug}/ml-training`,
      branch: "main",
      lastCommit: "Initial commit",
      lastCommitAuthor: "System",
      lastCommitDate: "Just now",
      status: "active",
      structure: { folders: ["src/", "configs/", "tests/"], files: ["train.py", ".gitlab-ci.yml"] },
    },
    {
      id: `repo-${approachId}-inference`,
      name: "ml-inference",
      type: "ml-inference",
      description: `Inference API for ${approachName}`,
      gitUrl: `gitlab.com/${projectCode.toLowerCase()}/${slug}/ml-inference`,
      branch: "main",
      lastCommit: "Initial commit",
      lastCommitAuthor: "System",
      lastCommitDate: "Just now",
      status: "active",
      structure: { folders: ["src/api/", "src/batch/", "tests/"], files: ["app.py", ".gitlab-ci.yml"] },
    },
    {
      id: `repo-${approachId}-monitoring`,
      name: "ml-monitoring",
      type: "ml-monitoring",
      description: `Monitoring and drift detection for ${approachName}`,
      gitUrl: `gitlab.com/${projectCode.toLowerCase()}/${slug}/ml-monitoring`,
      branch: "main",
      lastCommit: "Initial commit",
      lastCommitAuthor: "System",
      lastCommitDate: "Just now",
      status: "active",
      structure: { folders: ["src/", "dashboards/", "tests/"], files: ["monitor.py", ".gitlab-ci.yml"] },
    },
  ];
};

// Mock hierarchical projects - Synchronized with platformData.ts
export const hierarchicalProjects: HierarchicalProject[] = [
  // Project 1: Tire Regulation Analysis
  {
    id: "proj-006",
    name: "Tire Regulation Analysis",
    code: "TRA",
    description: "Comprehensive tire regulation analysis system with multiple approaches for wheel classification and DOT identification",
    businessObjectives: "Automate tire compliance verification and improve quality control efficiency by 80%",
    status: "active",
    preferredIDE: "vscode",
    owner: {
      id: "user-001",
      name: "Sarah Chen",
      role: "Lead Data Scientist",
      email: "sarah.chen@company.com",
    },
    team: [
      { id: "user-001", name: "Sarah Chen", initials: "SC", email: "sarah.chen@company.com", role: "project-owner" },
      { id: "user-002", name: "John Doe", initials: "JD", email: "john.doe@company.com", role: "lead-data-scientist" },
      { id: "user-003", name: "Maria Kim", initials: "MK", email: "maria.kim@company.com", role: "data-engineer" },
      { id: "user-004", name: "Alex Lee", initials: "AL", email: "alex.lee@company.com", role: "mlops-engineer" },
    ],
    department: "Quality Control",
    domain: "Manufacturing",
    subdomain: "Tire Production",
    priority: "high",
    sla: "99.5%",
    tags: ["computer-vision", "ocr", "manufacturing", "compliance"],
    aiActRiskCategory: "limited",
    complianceRequirements: ["ISO27001", "GDPR"],
    dataClassification: "confidential",
    gdprApplicable: false,
    hipaaApplicable: false,
    anonymizationRequired: false,
    retentionPolicy: "5 years",
    approaches: [
      {
        id: "approach-001",
        name: "Wheel Color Classification",
        description: "Image classification of wheel rims by color and design patterns using CNN",
        projectId: "proj-006",
        status: "active",
        repositories: createApproachRepositories("TRA", "Wheel Color Classification", "wcc"),
        experiments: ["exp-009", "exp-010"],
        models: ["model-007"],
        datasets: ["dataset-008"],
        pipelines: ["pipeline-007"],
        team: ["user-001", "user-002"],
        createdAt: "2025-09-15",
        updatedAt: "2025-12-10",
        environment: "production",
      },
      {
        id: "approach-002",
        name: "DOT Number OCR",
        description: "OCR-based identification of DOT numbers using R-CNN for tire compliance verification",
        projectId: "proj-006",
        status: "active",
        repositories: createApproachRepositories("TRA", "DOT Number OCR", "dot-ocr"),
        experiments: ["exp-011"],
        models: ["model-008"],
        datasets: ["dataset-009"],
        pipelines: ["pipeline-008"],
        team: ["user-001", "user-003", "user-004"],
        createdAt: "2025-10-01",
        updatedAt: "2025-12-09",
        environment: "staging",
      },
    ],
    sharedRepository: {
      id: "repo-shared-001",
      name: "ci-cd-shared",
      type: "ci-cd-shared",
      description: "Shared CI/CD templates and ArgoCD manifests for tire regulation project",
      gitUrl: "gitlab.com/tire-regulation/ci-cd-shared",
      branch: "main",
      lastCommit: "chore: update deployment templates",
      lastCommitAuthor: "Alex Lee",
      lastCommitDate: "6 hours ago",
      status: "active",
      structure: { folders: ["templates/", "scripts/", "argocd/"], files: ["README.md"] },
    },
    docsRepository: {
      id: "repo-docs-001",
      name: "docs",
      type: "docs",
      description: "Project documentation, architecture, and governance policies",
      gitUrl: "gitlab.com/tire-regulation/docs",
      branch: "main",
      lastCommit: "docs: update onboarding guide",
      lastCommitAuthor: "Sarah Chen",
      lastCommitDate: "2 days ago",
      status: "active",
      structure: { folders: ["architecture/", "governance/", "onboarding/"], files: ["README.md"] },
    },
    environments: [
      {
        name: "development",
        status: "active",
        resources: { cpu: 8, memory: 32, gpu: 1, storage: 100 },
        pythonVersion: "3.11",
        packages: ["torch", "torchvision", "opencv-python"],
        runType: "interactive",
        accessControl: { roles: ["data-scientist", "ml-engineer"], users: [] },
      },
      {
        name: "staging",
        status: "active",
        resources: { cpu: 16, memory: 64, gpu: 2, storage: 250 },
        pythonVersion: "3.11",
        packages: ["torch", "torchvision", "opencv-python", "fastapi"],
        runType: "api",
        accessControl: { roles: ["mlops-engineer", "qa-engineer"], users: [] },
      },
      {
        name: "production",
        status: "active",
        resources: { cpu: 32, memory: 128, gpu: 4, storage: 500 },
        pythonVersion: "3.11",
        packages: ["torch", "torchvision", "opencv-python", "fastapi"],
        runType: "api",
        accessControl: { roles: ["mlops-engineer"], users: [] },
      },
    ],
    sandboxEnabled: false,
    resources: {
      cpu: 56,
      memory: 224,
      gpu: 7,
      storage: 850,
      monthlyCost: 12500,
      carbonEmissions: 520,
    },
    createdAt: "2025-09-01",
    updatedAt: "2025-12-10",
    lastActivity: "2 hours ago",
  },
  
  // Project 2: Computer Vision Pipeline
  {
    id: "proj-001",
    name: "Computer Vision Pipeline",
    code: "CVP",
    description: "Image classification and object detection models for retail analytics. Advanced CV models for automated product recognition, inventory management, and customer behavior analysis.",
    businessObjectives: "Automate product recognition and improve inventory accuracy by 95%",
    status: "active",
    preferredIDE: "vscode",
    owner: {
      id: "user-001",
      name: "Sarah Chen",
      role: "Lead Data Scientist",
      email: "sarah.chen@company.com",
    },
    team: [
      { id: "user-001", name: "Sarah Chen", initials: "SC", email: "sarah.chen@company.com", role: "project-owner" },
      { id: "user-002", name: "John Doe", initials: "JD", email: "john.doe@company.com", role: "ml-engineer" },
      { id: "user-003", name: "Maria Kim", initials: "MK", email: "maria.kim@company.com", role: "data-engineer" },
      { id: "user-004", name: "Alex Lee", initials: "AL", email: "alex.lee@company.com", role: "mlops-engineer" },
    ],
    department: "Data Analytics",
    domain: "Retail",
    subdomain: "Product Recognition",
    priority: "high",
    sla: "99.9%",
    tags: ["computer-vision", "retail", "production"],
    aiActRiskCategory: "minimal",
    complianceRequirements: ["SOC2", "GDPR"],
    dataClassification: "internal",
    gdprApplicable: true,
    hipaaApplicable: false,
    anonymizationRequired: true,
    retentionPolicy: "3 years",
    approaches: [
      {
        id: "approach-cvp-001",
        name: "Product Classification",
        description: "ResNet-50 based product classification for retail shelves",
        projectId: "proj-001",
        status: "active",
        repositories: createApproachRepositories("CVP", "Product Classification", "product-class"),
        experiments: ["exp-001"],
        models: ["model-001"],
        datasets: ["dataset-001"],
        pipelines: ["pipeline-001"],
        team: ["user-001", "user-002"],
        createdAt: "2025-09-15",
        updatedAt: "2025-12-10",
        environment: "production",
      },
      {
        id: "approach-cvp-002",
        name: "Object Detection",
        description: "YOLO-based object detection for inventory tracking",
        projectId: "proj-001",
        status: "active",
        repositories: createApproachRepositories("CVP", "Object Detection", "obj-detect"),
        experiments: ["exp-005"],
        models: ["model-006"],
        datasets: ["dataset-004"],
        pipelines: ["pipeline-004"],
        team: ["user-001", "user-003"],
        createdAt: "2025-10-01",
        updatedAt: "2025-12-08",
        environment: "development",
      },
    ],
    sharedRepository: {
      id: "repo-shared-cvp",
      name: "ci-cd-shared",
      type: "ci-cd-shared",
      description: "Shared CI/CD templates for CV pipeline",
      gitUrl: "github.com/fed-analytics/cv-pipeline/ci-cd-shared",
      branch: "main",
      lastCommit: "feat: add GPU deployment config",
      lastCommitAuthor: "Alex Lee",
      lastCommitDate: "4 hours ago",
      status: "active",
      structure: { folders: ["templates/", "scripts/"], files: ["README.md"] },
    },
    docsRepository: {
      id: "repo-docs-cvp",
      name: "docs",
      type: "docs",
      description: "CV Pipeline documentation",
      gitUrl: "github.com/fed-analytics/cv-pipeline/docs",
      branch: "main",
      lastCommit: "docs: add model card template",
      lastCommitAuthor: "Sarah Chen",
      lastCommitDate: "1 day ago",
      status: "active",
      structure: { folders: ["architecture/", "model-cards/"], files: ["README.md"] },
    },
    environments: [
      {
        name: "development",
        status: "active",
        resources: { cpu: 16, memory: 64, gpu: 2, storage: 500 },
        pythonVersion: "3.11",
        packages: ["torch", "torchvision", "ultralytics"],
        runType: "interactive",
        accessControl: { roles: ["data-scientist", "ml-engineer"], users: [] },
      },
      {
        name: "staging",
        status: "active",
        resources: { cpu: 32, memory: 128, gpu: 4, storage: 1000 },
        pythonVersion: "3.11",
        packages: ["torch", "torchvision", "fastapi"],
        runType: "api",
        accessControl: { roles: ["mlops-engineer"], users: [] },
      },
      {
        name: "production",
        status: "active",
        resources: { cpu: 48, memory: 256, gpu: 8, storage: 2500 },
        pythonVersion: "3.11",
        packages: ["torch", "torchvision", "fastapi"],
        runType: "api",
        accessControl: { roles: ["mlops-engineer"], users: [] },
      },
    ],
    sandboxEnabled: false,
    resources: {
      cpu: 48,
      memory: 256,
      gpu: 8,
      storage: 2500,
      monthlyCost: 8900,
      carbonEmissions: 450,
    },
    createdAt: "2025-09-15",
    updatedAt: "2025-12-10",
    lastActivity: "2 hours ago",
  },

  // Project 3: NLP Sentiment Analysis
  {
    id: "proj-002",
    name: "NLP Sentiment Analysis",
    code: "NSA",
    description: "Multi-language sentiment analysis for customer feedback processing. Supports 12 languages with real-time inference capabilities.",
    businessObjectives: "Analyze customer sentiment in real-time across all support channels",
    status: "active",
    preferredIDE: "jupyter",
    owner: {
      id: "user-005",
      name: "Tom Wilson",
      role: "ML Engineer",
      email: "tom.wilson@company.com",
    },
    team: [
      { id: "user-005", name: "Tom Wilson", initials: "TW", email: "tom.wilson@company.com", role: "project-owner" },
      { id: "user-006", name: "Rachel Brown", initials: "RB", email: "rachel.brown@company.com", role: "data-scientist" },
    ],
    department: "Customer Experience",
    domain: "Technology",
    subdomain: "NLP",
    priority: "high",
    sla: "99.5%",
    tags: ["nlp", "sentiment", "multi-language"],
    aiActRiskCategory: "minimal",
    complianceRequirements: ["GDPR", "CCPA"],
    dataClassification: "personal",
    gdprApplicable: true,
    hipaaApplicable: false,
    anonymizationRequired: true,
    retentionPolicy: "2 years",
    approaches: [
      {
        id: "approach-nsa-001",
        name: "BERT Multilingual",
        description: "Fine-tuned BERT model for multilingual sentiment classification",
        projectId: "proj-002",
        status: "active",
        repositories: createApproachRepositories("NSA", "BERT Multilingual", "bert-multi"),
        experiments: ["exp-002", "exp-007", "exp-008"],
        models: ["model-002"],
        datasets: ["dataset-002"],
        pipelines: ["pipeline-002"],
        team: ["user-005", "user-006"],
        createdAt: "2025-08-20",
        updatedAt: "2025-12-10",
        environment: "production",
      },
    ],
    sharedRepository: {
      id: "repo-shared-nsa",
      name: "ci-cd-shared",
      type: "ci-cd-shared",
      description: "Shared CI/CD for NLP pipelines",
      gitUrl: "github.com/fed-analytics/nlp-sentiment/ci-cd-shared",
      branch: "main",
      lastCommit: "feat: add language detection step",
      lastCommitAuthor: "Tom Wilson",
      lastCommitDate: "1 day ago",
      status: "active",
      structure: { folders: ["templates/", "scripts/"], files: ["README.md"] },
    },
    docsRepository: {
      id: "repo-docs-nsa",
      name: "docs",
      type: "docs",
      description: "NLP Sentiment documentation",
      gitUrl: "github.com/fed-analytics/nlp-sentiment/docs",
      branch: "main",
      lastCommit: "docs: add language support matrix",
      lastCommitAuthor: "Rachel Brown",
      lastCommitDate: "3 days ago",
      status: "active",
      structure: { folders: ["architecture/", "languages/"], files: ["README.md"] },
    },
    environments: [
      {
        name: "development",
        status: "active",
        resources: { cpu: 8, memory: 32, gpu: 1, storage: 200 },
        pythonVersion: "3.11",
        packages: ["transformers", "torch", "datasets"],
        runType: "interactive",
        accessControl: { roles: ["data-scientist"], users: [] },
      },
      {
        name: "staging",
        status: "active",
        resources: { cpu: 16, memory: 64, gpu: 2, storage: 400 },
        pythonVersion: "3.11",
        packages: ["transformers", "torch", "fastapi"],
        runType: "api",
        accessControl: { roles: ["mlops-engineer"], users: [] },
      },
      {
        name: "production",
        status: "active",
        resources: { cpu: 32, memory: 128, gpu: 4, storage: 800 },
        pythonVersion: "3.11",
        packages: ["transformers", "torch", "fastapi"],
        runType: "api",
        accessControl: { roles: ["mlops-engineer"], users: [] },
      },
    ],
    sandboxEnabled: false,
    resources: {
      cpu: 32,
      memory: 128,
      gpu: 4,
      storage: 800,
      monthlyCost: 6200,
      carbonEmissions: 280,
    },
    createdAt: "2025-08-20",
    updatedAt: "2025-12-10",
    lastActivity: "4 hours ago",
  },

  // Project 4: Fraud Detection System
  {
    id: "proj-003",
    name: "Fraud Detection System",
    code: "FDS",
    description: "Real-time transaction fraud detection using ensemble methods. Processes 5M+ transactions daily with sub-10ms latency.",
    businessObjectives: "Reduce fraud losses by 85% while maintaining low false positive rates",
    status: "active",
    preferredIDE: "vscode",
    owner: {
      id: "user-001",
      name: "Sarah Chen",
      role: "Lead Data Scientist",
      email: "sarah.chen@company.com",
    },
    team: [
      { id: "user-001", name: "Sarah Chen", initials: "SC", email: "sarah.chen@company.com", role: "project-owner" },
      { id: "user-003", name: "Maria Kim", initials: "MK", email: "maria.kim@company.com", role: "lead-data-scientist" },
      { id: "user-007", name: "Peter Li", initials: "PL", email: "peter.li@company.com", role: "software-engineer" },
      { id: "user-002", name: "John Doe", initials: "JD", email: "john.doe@company.com", role: "ml-engineer" },
      { id: "user-004", name: "Alex Lee", initials: "AL", email: "alex.lee@company.com", role: "mlops-engineer" },
    ],
    department: "Risk Management",
    domain: "Finance",
    subdomain: "Fraud Prevention",
    priority: "critical",
    sla: "99.99%",
    tags: ["fraud", "real-time", "financial"],
    aiActRiskCategory: "high",
    complianceRequirements: ["SOC2", "PCI-DSS", "GDPR"],
    dataClassification: "restricted",
    gdprApplicable: true,
    hipaaApplicable: false,
    anonymizationRequired: true,
    retentionPolicy: "7 years",
    approaches: [
      {
        id: "approach-fds-001",
        name: "XGBoost Ensemble",
        description: "Gradient boosting ensemble for real-time fraud scoring",
        projectId: "proj-003",
        status: "active",
        repositories: createApproachRepositories("FDS", "XGBoost Ensemble", "xgb-ensemble"),
        experiments: ["exp-003"],
        models: ["model-003"],
        datasets: ["dataset-003", "dataset-005"],
        pipelines: ["pipeline-003"],
        team: ["user-001", "user-003"],
        createdAt: "2025-06-10",
        updatedAt: "2025-12-10",
        environment: "production",
      },
    ],
    sharedRepository: {
      id: "repo-shared-fds",
      name: "ci-cd-shared",
      type: "ci-cd-shared",
      description: "Shared CI/CD for fraud detection",
      gitUrl: "github.com/fed-analytics/fraud-detection/ci-cd-shared",
      branch: "main",
      lastCommit: "security: add model signing",
      lastCommitAuthor: "Alex Lee",
      lastCommitDate: "2 hours ago",
      status: "active",
      structure: { folders: ["templates/", "security/"], files: ["README.md"] },
    },
    docsRepository: {
      id: "repo-docs-fds",
      name: "docs",
      type: "docs",
      description: "Fraud Detection documentation",
      gitUrl: "github.com/fed-analytics/fraud-detection/docs",
      branch: "main",
      lastCommit: "docs: update compliance checklist",
      lastCommitAuthor: "Maria Kim",
      lastCommitDate: "1 day ago",
      status: "active",
      structure: { folders: ["architecture/", "compliance/"], files: ["README.md"] },
    },
    environments: [
      {
        name: "development",
        status: "active",
        resources: { cpu: 16, memory: 64, gpu: 2, storage: 500 },
        pythonVersion: "3.11",
        packages: ["xgboost", "scikit-learn", "pandas"],
        runType: "interactive",
        accessControl: { roles: ["data-scientist"], users: [] },
      },
      {
        name: "staging",
        status: "active",
        resources: { cpu: 32, memory: 256, gpu: 8, storage: 2000 },
        pythonVersion: "3.11",
        packages: ["xgboost", "fastapi", "redis"],
        runType: "api",
        accessControl: { roles: ["mlops-engineer"], users: [] },
      },
      {
        name: "production",
        status: "active",
        resources: { cpu: 64, memory: 512, gpu: 16, storage: 5000 },
        pythonVersion: "3.11",
        packages: ["xgboost", "fastapi", "redis"],
        runType: "api",
        accessControl: { roles: ["mlops-engineer"], users: [] },
      },
    ],
    sandboxEnabled: false,
    resources: {
      cpu: 64,
      memory: 512,
      gpu: 16,
      storage: 5000,
      monthlyCost: 12500,
      carbonEmissions: 680,
    },
    createdAt: "2025-06-10",
    updatedAt: "2025-12-10",
    lastActivity: "1 hour ago",
  },

  // Project 5: Time Series Forecasting
  {
    id: "proj-004",
    name: "Time Series Forecasting",
    code: "TSF",
    description: "Demand forecasting models for supply chain optimization. Predicts inventory needs across 500+ SKUs.",
    businessObjectives: "Reduce inventory costs by 30% through accurate demand prediction",
    status: "paused",
    preferredIDE: "jupyter",
    owner: {
      id: "user-006",
      name: "Rachel Brown",
      role: "Data Scientist",
      email: "rachel.brown@company.com",
    },
    team: [
      { id: "user-006", name: "Rachel Brown", initials: "RB", email: "rachel.brown@company.com", role: "project-owner" },
      { id: "user-005", name: "Tom Wilson", initials: "TW", email: "tom.wilson@company.com", role: "ml-engineer" },
    ],
    department: "Supply Chain",
    domain: "Manufacturing",
    subdomain: "Demand Planning",
    priority: "medium",
    sla: "99%",
    tags: ["time-series", "forecasting", "supply-chain"],
    aiActRiskCategory: "minimal",
    complianceRequirements: ["SOC2"],
    dataClassification: "internal",
    gdprApplicable: false,
    hipaaApplicable: false,
    anonymizationRequired: false,
    retentionPolicy: "3 years",
    approaches: [
      {
        id: "approach-tsf-001",
        name: "Prophet Forecasting",
        description: "Facebook Prophet for additive regression forecasting",
        projectId: "proj-004",
        status: "paused",
        repositories: createApproachRepositories("TSF", "Prophet Forecasting", "prophet"),
        experiments: ["exp-006"],
        models: ["model-004"],
        datasets: ["dataset-006"],
        pipelines: ["pipeline-005"],
        team: ["user-006", "user-005"],
        createdAt: "2025-10-01",
        updatedAt: "2025-12-07",
        environment: "staging",
      },
    ],
    sharedRepository: {
      id: "repo-shared-tsf",
      name: "ci-cd-shared",
      type: "ci-cd-shared",
      description: "Shared CI/CD for time series",
      gitUrl: "github.com/fed-analytics/time-series/ci-cd-shared",
      branch: "main",
      lastCommit: "feat: add backtesting pipeline",
      lastCommitAuthor: "Rachel Brown",
      lastCommitDate: "5 days ago",
      status: "active",
      structure: { folders: ["templates/"], files: ["README.md"] },
    },
    docsRepository: {
      id: "repo-docs-tsf",
      name: "docs",
      type: "docs",
      description: "Time Series documentation",
      gitUrl: "github.com/fed-analytics/time-series/docs",
      branch: "main",
      lastCommit: "docs: add seasonality guide",
      lastCommitAuthor: "Tom Wilson",
      lastCommitDate: "1 week ago",
      status: "active",
      structure: { folders: ["architecture/"], files: ["README.md"] },
    },
    environments: [
      {
        name: "development",
        status: "active",
        resources: { cpu: 8, memory: 32, gpu: 0, storage: 200 },
        pythonVersion: "3.11",
        packages: ["prophet", "pandas", "plotly"],
        runType: "interactive",
        accessControl: { roles: ["data-scientist"], users: [] },
      },
      {
        name: "staging",
        status: "active",
        resources: { cpu: 16, memory: 64, gpu: 2, storage: 400 },
        pythonVersion: "3.11",
        packages: ["prophet", "fastapi"],
        runType: "api",
        accessControl: { roles: ["mlops-engineer"], users: [] },
      },
      {
        name: "production",
        status: "inactive",
        resources: { cpu: 16, memory: 64, gpu: 2, storage: 400 },
        pythonVersion: "3.11",
        packages: ["prophet", "fastapi"],
        runType: "api",
        accessControl: { roles: ["mlops-engineer"], users: [] },
      },
    ],
    sandboxEnabled: false,
    resources: {
      cpu: 16,
      memory: 64,
      gpu: 2,
      storage: 400,
      monthlyCost: 2800,
      carbonEmissions: 120,
    },
    createdAt: "2025-10-01",
    updatedAt: "2025-12-07",
    lastActivity: "3 days ago",
  },

  // Project 6: Recommendation Engine
  {
    id: "proj-005",
    name: "Recommendation Engine",
    code: "REC",
    description: "Personalized product recommendations using collaborative filtering. Serves 10M+ users with personalized suggestions.",
    businessObjectives: "Increase conversion rate by 25% through personalized recommendations",
    status: "active",
    preferredIDE: "vscode",
    owner: {
      id: "user-004",
      name: "Alex Lee",
      role: "MLOps Engineer",
      email: "alex.lee@company.com",
    },
    team: [
      { id: "user-004", name: "Alex Lee", initials: "AL", email: "alex.lee@company.com", role: "project-owner" },
      { id: "user-001", name: "Sarah Chen", initials: "SC", email: "sarah.chen@company.com", role: "lead-data-scientist" },
      { id: "user-002", name: "John Doe", initials: "JD", email: "john.doe@company.com", role: "ml-engineer" },
    ],
    department: "E-Commerce",
    domain: "Retail",
    subdomain: "Personalization",
    priority: "high",
    sla: "99.5%",
    tags: ["recommendation", "personalization", "e-commerce"],
    aiActRiskCategory: "minimal",
    complianceRequirements: ["GDPR", "CCPA"],
    dataClassification: "personal",
    gdprApplicable: true,
    hipaaApplicable: false,
    anonymizationRequired: true,
    retentionPolicy: "2 years",
    approaches: [
      {
        id: "approach-rec-001",
        name: "Neural Collaborative Filtering",
        description: "Deep learning based collaborative filtering for recommendations",
        projectId: "proj-005",
        status: "active",
        repositories: createApproachRepositories("REC", "Neural Collaborative Filtering", "ncf"),
        experiments: ["exp-004"],
        models: ["model-005"],
        datasets: ["dataset-007"],
        pipelines: ["pipeline-006"],
        team: ["user-004", "user-001", "user-002"],
        createdAt: "2025-07-15",
        updatedAt: "2025-12-10",
        environment: "staging",
      },
    ],
    sharedRepository: {
      id: "repo-shared-rec",
      name: "ci-cd-shared",
      type: "ci-cd-shared",
      description: "Shared CI/CD for recommender",
      gitUrl: "github.com/fed-analytics/recommender/ci-cd-shared",
      branch: "main",
      lastCommit: "feat: add A/B testing pipeline",
      lastCommitAuthor: "Alex Lee",
      lastCommitDate: "8 hours ago",
      status: "active",
      structure: { folders: ["templates/", "ab-testing/"], files: ["README.md"] },
    },
    docsRepository: {
      id: "repo-docs-rec",
      name: "docs",
      type: "docs",
      description: "Recommender documentation",
      gitUrl: "github.com/fed-analytics/recommender/docs",
      branch: "main",
      lastCommit: "docs: add cold start strategy",
      lastCommitAuthor: "John Doe",
      lastCommitDate: "2 days ago",
      status: "active",
      structure: { folders: ["architecture/", "strategies/"], files: ["README.md"] },
    },
    environments: [
      {
        name: "development",
        status: "active",
        resources: { cpu: 8, memory: 32, gpu: 2, storage: 400 },
        pythonVersion: "3.11",
        packages: ["tensorflow", "numpy", "pandas"],
        runType: "interactive",
        accessControl: { roles: ["data-scientist"], users: [] },
      },
      {
        name: "staging",
        status: "active",
        resources: { cpu: 24, memory: 96, gpu: 4, storage: 1200 },
        pythonVersion: "3.11",
        packages: ["tensorflow", "fastapi", "redis"],
        runType: "api",
        accessControl: { roles: ["mlops-engineer"], users: [] },
      },
      {
        name: "production",
        status: "inactive",
        resources: { cpu: 24, memory: 96, gpu: 4, storage: 1200 },
        pythonVersion: "3.11",
        packages: ["tensorflow", "fastapi", "redis"],
        runType: "api",
        accessControl: { roles: ["mlops-engineer"], users: [] },
      },
    ],
    sandboxEnabled: false,
    resources: {
      cpu: 24,
      memory: 96,
      gpu: 4,
      storage: 1200,
      monthlyCost: 4100,
      carbonEmissions: 200,
    },
    createdAt: "2025-07-15",
    updatedAt: "2025-12-10",
    lastActivity: "6 hours ago",
  },
];

// Helper functions
export const getHierarchicalProjectById = (id: string) => hierarchicalProjects.find(p => p.id === id);
export const getApproachById = (projectId: string, approachId: string) => {
  const project = getHierarchicalProjectById(projectId);
  return project?.approaches.find(a => a.id === approachId);
};
export const getAllApproaches = () => hierarchicalProjects.flatMap(p => p.approaches);
export const getTotalRepositories = () => hierarchicalProjects.reduce((acc, p) => 
  acc + p.approaches.reduce((a, app) => a + app.repositories.length, 0) + 2, 0); // +2 for shared and docs repos
