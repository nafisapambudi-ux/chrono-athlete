import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AthleteTest } from "@/hooks/useAthleteTests";

export function useMultipleAthleteTests(athleteIds: string[]) {
  const { data: allTests = {}, isLoading } = useQuery({
    queryKey: ["multiple_athlete_tests", athleteIds],
    queryFn: async () => {
      if (athleteIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from("athlete_tests")
        .select("*")
        .in("athlete_id", athleteIds)
        .order("test_date", { ascending: false });

      if (error) throw error;

      // Group by athlete_id
      const grouped: Record<string, AthleteTest[]> = {};
      (data as AthleteTest[]).forEach(test => {
        if (!grouped[test.athlete_id]) {
          grouped[test.athlete_id] = [];
        }
        grouped[test.athlete_id].push(test);
      });

      return grouped;
    },
    enabled: athleteIds.length > 0,
  });

  return {
    athleteTests: allTests,
    isLoading,
  };
}
