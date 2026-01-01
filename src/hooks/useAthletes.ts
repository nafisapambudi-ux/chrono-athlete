import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { athleteSchema } from "@/lib/validationSchemas";

export interface Athlete {
  id: string;
  user_id: string;
  name: string;
  mass: number | null;
  body_height: number | null;
  vertical_jump: number | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AthleteInput {
  name: string;
  mass?: number;
  body_height?: number;
  vertical_jump?: number;
  avatar_url?: string;
}

export function useAthletes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: athletes = [], isLoading } = useQuery({
    queryKey: ["athletes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("athletes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Athlete[];
    },
    enabled: !!user,
  });

  const createAthlete = useMutation({
    mutationFn: async (athlete: AthleteInput) => {
      if (!user) throw new Error("User not authenticated");
      
      // Validate input
      const validatedData = athleteSchema.parse(athlete);
      
      const { data, error } = await supabase
        .from("athletes")
        .insert({
          name: validatedData.name,
          mass: validatedData.mass,
          body_height: validatedData.body_height,
          vertical_jump: validatedData.vertical_jump,
          avatar_url: athlete.avatar_url,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
      toast.success("Atlet berhasil ditambahkan");
    },
    onError: (error: any) => {
      if (error.name === "ZodError") {
        toast.error(error.errors[0]?.message || "Data tidak valid");
      } else {
        toast.error("Gagal menambahkan atlet");
      }
    },
  });

  const updateAthlete = useMutation({
    mutationFn: async ({ id, ...athlete }: Partial<Athlete> & { id: string }) => {
      // Validate input (partial validation for updates)
      const validatedData = athleteSchema.partial().parse(athlete);
      
      const { data, error } = await supabase
        .from("athletes")
        .update({
          ...validatedData,
          avatar_url: athlete.avatar_url, // Include avatar_url explicitly
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
    },
    onError: (error: any) => {
      if (error.name === "ZodError") {
        toast.error(error.errors[0]?.message || "Data tidak valid");
      } else {
        toast.error("Gagal memperbarui atlet");
      }
    },
  });

  const deleteAthlete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("athletes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
      toast.success("Atlet berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error("Gagal menghapus atlet");
    },
  });

  return {
    athletes,
    isLoading,
    createAthlete: createAthlete.mutate,
    updateAthlete: updateAthlete.mutate,
    deleteAthlete: deleteAthlete.mutate,
  };
}
