import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { athleteReadinessSchema } from "@/lib/validationSchemas";

export interface AthleteReadiness {
  id: string;
  athlete_id: string;
  readiness_date: string;
  resting_heart_rate: number;
  vertical_jump: number;
  readiness_score: number | null;
  vo2max: number | null;
  power: number | null;
  created_at: string;
}

export interface AthleteReadinessInput {
  athlete_id: string;
  readiness_date: string;
  resting_heart_rate: number;
  vertical_jump: number;
}

// Calculate VO2max from RHR using a simplified formula
// VO2max = 15.3 × (HRmax / HRrest)
// Assuming HRmax = 220 - age (using 25 as default age)
function calculateVO2max(rhr: number): number {
  const assumedAge = 25;
  const hrMax = 220 - assumedAge;
  return parseFloat((15.3 * (hrMax / rhr)).toFixed(2));
}

// Calculate power from vertical jump
// Power (watts) = 60.7 × jump height (cm) + 45.3 × body mass (kg) - 2055
// Using simplified formula: Power = 2.5 × VJ (assuming average mass)
function calculatePower(vj: number): number {
  return parseFloat((2.5 * vj).toFixed(2));
}

// Calculate readiness score (VJ 60%, RHR 40%)
// Normalized to 0-100 scale
function calculateReadinessScore(vj: number, rhr: number, baselineVJ: number = 50, baselineRHR: number = 60): number {
  const vjScore = (vj / baselineVJ) * 100 * 0.6;
  const rhrScore = (baselineRHR / rhr) * 100 * 0.4;
  return parseFloat((vjScore + rhrScore).toFixed(2));
}

export function useAthleteReadiness(athleteId?: string) {
  const queryClient = useQueryClient();

  const { data: readinessData = [], isLoading } = useQuery({
    queryKey: ["athlete_readiness", athleteId],
    queryFn: async () => {
      let query = supabase
        .from("athlete_readiness")
        .select("*")
        .order("readiness_date", { ascending: false });
      
      if (athleteId) {
        query = query.eq("athlete_id", athleteId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AthleteReadiness[];
    },
  });

  const createReadiness = useMutation({
    mutationFn: async (readiness: AthleteReadinessInput) => {
      // Validate input
      const validatedData = athleteReadinessSchema.parse(readiness);
      
      const vo2max = calculateVO2max(validatedData.resting_heart_rate);
      const power = calculatePower(validatedData.vertical_jump);
      const readinessScore = calculateReadinessScore(
        validatedData.vertical_jump,
        validatedData.resting_heart_rate
      );

      const { data, error } = await supabase
        .from("athlete_readiness")
        .insert({
          athlete_id: validatedData.athlete_id,
          readiness_date: validatedData.readiness_date,
          resting_heart_rate: validatedData.resting_heart_rate,
          vertical_jump: validatedData.vertical_jump,
          vo2max,
          power,
          readiness_score: readinessScore,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete_readiness"] });
      toast.success("Data kesiapan berhasil ditambahkan");
    },
    onError: (error: any) => {
      if (error.name === "ZodError") {
        toast.error(error.errors[0]?.message || "Data tidak valid");
      } else {
        toast.error("Gagal menambahkan data kesiapan");
      }
    },
  });

  const deleteReadiness = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("athlete_readiness")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete_readiness"] });
      toast.success("Data kesiapan berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error("Gagal menghapus data kesiapan");
    },
  });

  return {
    readinessData,
    isLoading,
    createReadiness: createReadiness.mutate,
    deleteReadiness: deleteReadiness.mutate,
  };
}
