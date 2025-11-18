import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function useUserRole(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-roles", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;
      return data.map(r => r.role as AppRole);
    },
    enabled: !!userId,
  });
}

export function useHasRole(userId: string | undefined, role: AppRole) {
  const { data: roles, isLoading } = useUserRole(userId);
  return {
    hasRole: roles?.includes(role) ?? false,
    isLoading,
  };
}
