import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "moderator" | "user" | "viewer";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  avatar?: string;
}

export const useCurrentUser = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [role, setRole] = useState<UserRole>("viewer");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndRole = async () => {
      setIsLoading(true);
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Fetch role from database using the has_role function or direct query
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", authUser.id)
          .maybeSingle();
        
        const userRole = (roleData?.role as UserRole) || "viewer";
        setRole(userRole);
        
        // Fetch profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", authUser.id)
          .maybeSingle();
        
        const name = profile?.full_name || authUser.email?.split("@")[0] || "User";
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        
        setUser({
          id: authUser.id,
          name,
          email: authUser.email || "",
          role: userRole,
          initials,
          avatar: profile?.avatar_url || undefined,
        });
      } else {
        setUser(null);
        setRole("viewer");
      }
      
      setIsLoading(false);
    };

    fetchUserAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserAndRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = role === "admin";
  const isModerator = role === "moderator" || isAdmin;
  const canDeploy = isAdmin;
  
  // Governance permissions - show during loading to prevent flash, real check on page level
  // For now, show all governance sections to authenticated users (page-level protection is primary)
  const isAuthenticated = user !== null;
  const canViewIAM = isLoading || isAuthenticated;
  const canViewAudit = isLoading || isAuthenticated;
  const canViewSecurity = isLoading || isAuthenticated;
  const canViewCompliance = isLoading || isAuthenticated;

  return {
    user,
    role,
    isLoading,
    isAdmin,
    isModerator,
    canDeploy,
    canViewIAM,
    canViewAudit,
    canViewSecurity,
    canViewCompliance,
  };
};
