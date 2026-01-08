import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Athlete } from "./useAthletes";

export function useLinkedAthlete() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["linked-athlete", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("athletes")
        .select("*")
        .eq("linked_user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Athlete | null;
    },
    enabled: !!user,
  });
}
