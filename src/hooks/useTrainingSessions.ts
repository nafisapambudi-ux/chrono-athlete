import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TrainingSession {
  id: string;
  athlete_id: string;
  session_date: string;
  duration_minutes: number;
  rpe: number;
  notes: string | null;
  created_at: string;
}

export interface TrainingSessionInput {
  athlete_id: string;
  session_date: string;
  duration_minutes: number;
  rpe: number;
  notes?: string;
}

export function useTrainingSessions(athleteId?: string) {
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["training_sessions", athleteId],
    queryFn: async () => {
      if (!athleteId) return [];
      const { data, error } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("session_date", { ascending: true });

      if (error) throw error;
      return data as TrainingSession[];
    },
    enabled: !!athleteId,
  });

  const createSession = useMutation({
    mutationFn: async (session: TrainingSessionInput) => {
      const { data, error } = await supabase
        .from("training_sessions")
        .insert(session)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training_sessions"] });
      toast.success("Sesi latihan berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan sesi latihan");
    },
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_sessions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training_sessions"] });
      toast.success("Sesi latihan berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus sesi latihan");
    },
  });

  return {
    sessions,
    isLoading,
    createSession: createSession.mutate,
    deleteSession: deleteSession.mutate,
  };
}
