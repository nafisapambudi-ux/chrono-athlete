import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface RequireRoleProps {
  allowed: AppRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireRole({ allowed, children, fallback }: RequireRoleProps) {
  const { user, loading: authLoading } = useAuth();
  const { data: roles, isLoading: rolesLoading } = useUserRole(user?.id);

  if (authLoading || rolesLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!user) {
    return fallback ?? <div className="p-4">Please log in to access this page.</div>;
  }

  const hasAccess = roles?.some(role => allowed.includes(role));

  if (!hasAccess) {
    return fallback ?? <div className="p-4">Access denied. You don't have the required role.</div>;
  }

  return <>{children}</>;
}
