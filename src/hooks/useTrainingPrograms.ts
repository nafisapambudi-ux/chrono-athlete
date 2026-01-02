import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProgramExercise {
  id?: string;
  program_id?: string;
  exercise_name: string;
  exercise_type: string;
  sets?: number;
  reps?: number;
  load_value?: string;
  order_index: number;
}

export interface TrainingProgram {
  id: string;
  athlete_id: string;
  program_date: string;
  program_type: string;
  warm_up?: string;
  cooling_down?: string;
  notes?: string;
  is_completed: boolean;
  completed_rpe?: number;
  completed_duration_minutes?: number;
  created_at: string;
  updated_at: string;
  program_exercises?: ProgramExercise[];
}

export interface TrainingProgramInput {
  athlete_id: string;
  program_date: string;
  program_type: string;
  warm_up?: string;
  cooling_down?: string;
  notes?: string;
  exercises: Omit<ProgramExercise, 'id' | 'program_id'>[];
}

export interface CompleteProgramInput {
  program_id: string;
  completed_rpe: number;
  completed_duration_minutes: number;
}

export const useTrainingPrograms = (athleteId?: string | null) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch programs for an athlete
  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["training-programs", athleteId],
    queryFn: async () => {
      if (!athleteId) return [];
      
      const { data, error } = await supabase
        .from("training_programs")
        .select(`
          *,
          program_exercises (*)
        `)
        .eq("athlete_id", athleteId)
        .order("program_date", { ascending: true });

      if (error) throw error;
      return data as TrainingProgram[];
    },
    enabled: !!athleteId,
  });

  // Create a new training program with exercises
  const createProgramMutation = useMutation({
    mutationFn: async (input: TrainingProgramInput) => {
      // First, create the program
      const { data: program, error: programError } = await supabase
        .from("training_programs")
        .insert({
          athlete_id: input.athlete_id,
          program_date: input.program_date,
          program_type: input.program_type,
          warm_up: input.warm_up,
          cooling_down: input.cooling_down,
          notes: input.notes,
        })
        .select()
        .single();

      if (programError) throw programError;

      // Then, create the exercises if any
      if (input.exercises && input.exercises.length > 0) {
        const exercisesWithProgramId = input.exercises.map((ex, index) => ({
          program_id: program.id,
          exercise_name: ex.exercise_name,
          exercise_type: ex.exercise_type,
          sets: ex.sets,
          reps: ex.reps,
          load_value: ex.load_value,
          order_index: index,
        }));

        const { error: exerciseError } = await supabase
          .from("program_exercises")
          .insert(exercisesWithProgramId);

        if (exerciseError) throw exerciseError;
      }

      return program;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      toast({ title: "Program latihan berhasil ditambahkan" });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({ title: "Program untuk tanggal ini sudah ada", variant: "destructive" });
      } else {
        toast({ title: "Gagal menambahkan program", description: error.message, variant: "destructive" });
      }
    },
  });

  // Update a training program
  const updateProgramMutation = useMutation({
    mutationFn: async ({ programId, input }: { programId: string; input: Partial<TrainingProgramInput> }) => {
      // Update the program
      const { error: programError } = await supabase
        .from("training_programs")
        .update({
          program_type: input.program_type,
          warm_up: input.warm_up,
          cooling_down: input.cooling_down,
          notes: input.notes,
        })
        .eq("id", programId);

      if (programError) throw programError;

      // If exercises are provided, delete old ones and insert new ones
      if (input.exercises) {
        await supabase.from("program_exercises").delete().eq("program_id", programId);

        if (input.exercises.length > 0) {
          const exercisesWithProgramId = input.exercises.map((ex, index) => ({
            program_id: programId,
            exercise_name: ex.exercise_name,
            exercise_type: ex.exercise_type,
            sets: ex.sets,
            reps: ex.reps,
            load_value: ex.load_value,
            order_index: index,
          }));

          const { error: exerciseError } = await supabase
            .from("program_exercises")
            .insert(exercisesWithProgramId);

          if (exerciseError) throw exerciseError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      toast({ title: "Program latihan berhasil diperbarui" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal memperbarui program", description: error.message, variant: "destructive" });
    },
  });

  // Complete a training program (athlete fills RPE and duration)
  const completeProgramMutation = useMutation({
    mutationFn: async (input: CompleteProgramInput) => {
      const { error } = await supabase
        .from("training_programs")
        .update({
          is_completed: true,
          completed_rpe: input.completed_rpe,
          completed_duration_minutes: input.completed_duration_minutes,
        })
        .eq("id", input.program_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      toast({ title: "Program latihan selesai!" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal menyelesaikan program", description: error.message, variant: "destructive" });
    },
  });

  // Delete a training program
  const deleteProgramMutation = useMutation({
    mutationFn: async (programId: string) => {
      const { error } = await supabase
        .from("training_programs")
        .delete()
        .eq("id", programId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      toast({ title: "Program latihan berhasil dihapus" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal menghapus program", description: error.message, variant: "destructive" });
    },
  });

  return {
    programs,
    isLoading,
    createProgram: createProgramMutation.mutate,
    updateProgram: updateProgramMutation.mutate,
    completeProgram: completeProgramMutation.mutate,
    deleteProgram: deleteProgramMutation.mutate,
  };
};
