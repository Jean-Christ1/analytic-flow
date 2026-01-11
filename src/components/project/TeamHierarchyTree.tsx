import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronRight, 
  Crown, 
  Users, 
  Brain, 
  Cog, 
  Server, 
  Database, 
  Code, 
  TestTube,
  Briefcase,
  Eye,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectTeamMember, ProjectRole, projectRoleLabels } from "@/data/hierarchicalModel";

interface TeamHierarchyTreeProps {
  team: ProjectTeamMember[];
  className?: string;
}

interface RoleConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  level: number;
  bgColor: string;
}

const roleConfig: Record<ProjectRole, RoleConfig> = {
  "project-owner": { 
    icon: Crown, 
    color: "text-gold", 
    bgColor: "bg-gold/10 border-gold/30",
    level: 1 
  },
  "lead-data-scientist": { 
    icon: Brain, 
    color: "text-primary", 
    bgColor: "bg-primary/10 border-primary/30",
    level: 2 
  },
  "tech-lead": { 
    icon: Code, 
    color: "text-primary", 
    bgColor: "bg-primary/10 border-primary/30",
    level: 2 
  },
  "product-owner": { 
    icon: Briefcase, 
    color: "text-info", 
    bgColor: "bg-info/10 border-info/30",
    level: 2 
  },
  "data-scientist": { 
    icon: Brain, 
    color: "text-purple-400", 
    bgColor: "bg-purple-500/10 border-purple-500/30",
    level: 3 
  },
  "ml-engineer": { 
    icon: Cog, 
    color: "text-blue-400", 
    bgColor: "bg-blue-500/10 border-blue-500/30",
    level: 3 
  },
  "mlops-engineer": { 
    icon: Server, 
    color: "text-orange-400", 
    bgColor: "bg-orange-500/10 border-orange-500/30",
    level: 3 
  },
  "data-engineer": { 
    icon: Database, 
    color: "text-green-400", 
    bgColor: "bg-green-500/10 border-green-500/30",
    level: 3 
  },
  "software-engineer": { 
    icon: Code, 
    color: "text-cyan-400", 
    bgColor: "bg-cyan-500/10 border-cyan-500/30",
    level: 3 
  },
  "qa-engineer": { 
    icon: TestTube, 
    color: "text-pink-400", 
    bgColor: "bg-pink-500/10 border-pink-500/30",
    level: 3 
  },
  "stakeholder": { 
    icon: Briefcase, 
    color: "text-muted-foreground", 
    bgColor: "bg-muted/30 border-border",
    level: 4 
  },
  "viewer": { 
    icon: Eye, 
    color: "text-muted-foreground", 
    bgColor: "bg-muted/30 border-border",
    level: 4 
  },
};

interface TeamMemberNodeProps {
  member: ProjectTeamMember;
  children?: ProjectTeamMember[];
  isExpanded?: boolean;
  onToggle?: () => void;
  depth?: number;
}

const TeamMemberNode = ({ 
  member, 
  children = [], 
  isExpanded = true, 
  onToggle,
  depth = 0 
}: TeamMemberNodeProps) => {
  const config = roleConfig[member.role];
  const Icon = config.icon;
  const hasChildren = children.length > 0;

  return (
    <div className="relative">
      {/* Connection line */}
      {depth > 0 && (
        <div 
          className="absolute left-0 top-0 w-6 border-l-2 border-b-2 border-border/50 rounded-bl-lg"
          style={{ 
            height: "24px",
            marginLeft: `${(depth - 1) * 32 + 12}px`
          }}
        />
      )}
      
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer",
          config.bgColor
        )}
        style={{ marginLeft: `${depth * 32}px` }}
        onClick={onToggle}
      >
        {hasChildren && (
          <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}
        
        <Avatar className="h-10 w-10 border-2 border-background">
          <AvatarImage src={member.avatar} />
          <AvatarFallback className="bg-muted text-foreground font-medium">
            {member.initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{member.name}</span>
            <Icon className={cn("h-4 w-4 shrink-0", config.color)} />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge 
              variant="outline" 
              className={cn("text-xs font-normal", config.color)}
            >
              {projectRoleLabels[member.role]}
            </Badge>
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            window.open(`mailto:${member.email}`);
          }}
        >
          <Mail className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {children.map((child) => (
            <TeamMemberNode 
              key={child.id} 
              member={child} 
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TeamHierarchyTree = ({ team, className }: TeamHierarchyTreeProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["all"]));

  // Group team members by role level
  const groupedByLevel = team.reduce((acc, member) => {
    const level = roleConfig[member.role].level;
    if (!acc[level]) acc[level] = [];
    acc[level].push(member);
    return acc;
  }, {} as Record<number, ProjectTeamMember[]>);

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Build hierarchy: Level 1 -> Level 2 -> Level 3 -> Level 4
  const level1 = groupedByLevel[1] || [];
  const level2 = groupedByLevel[2] || [];
  const level3 = groupedByLevel[3] || [];
  const level4 = groupedByLevel[4] || [];

  return (
    <Card className={cn("glass-card", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Team Hierarchy
          <Badge variant="secondary" className="ml-auto">
            {team.length} members
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Level 1: Project Owner */}
        {level1.map((owner) => (
          <div key={owner.id} className="space-y-2">
            <TeamMemberNode
              member={owner}
              children={level2}
              isExpanded={expandedNodes.has("all") || expandedNodes.has(owner.id)}
              onToggle={() => toggleNode(owner.id)}
              depth={0}
            />
            
            {/* Level 2: Leads */}
            {(expandedNodes.has("all") || expandedNodes.has(owner.id)) && (
              <div className="space-y-2">
                {level2.map((lead) => (
                  <div key={lead.id}>
                    <TeamMemberNode
                      member={lead}
                      children={level3.filter(() => true)} // All level 3 report to leads
                      isExpanded={expandedNodes.has("all") || expandedNodes.has(lead.id)}
                      onToggle={() => toggleNode(lead.id)}
                      depth={1}
                    />
                    
                    {/* Level 3: Engineers */}
                    {(expandedNodes.has("all") || expandedNodes.has(lead.id)) && (
                      <div className="space-y-2 mt-2">
                        {level3.map((engineer) => (
                          <TeamMemberNode
                            key={engineer.id}
                            member={engineer}
                            children={[]}
                            depth={2}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Level 4: Stakeholders & Viewers (separate section) */}
        {level4.length > 0 && (
          <div className="pt-4 mt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Stakeholders & Viewers
            </p>
            <div className="grid grid-cols-2 gap-2">
              {level4.map((member) => {
                const config = roleConfig[member.role];
                const Icon = config.icon;
                return (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border",
                      config.bgColor
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted text-foreground text-xs">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                        {projectRoleLabels[member.role]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {team.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No team members assigned</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
