import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TrainingStats {
  totalWeightLifted: number; // kg
  totalSprintDistance: number; // meters
  totalEnduranceDistance: number; // meters
  totalTechniqueReps: number;
  totalTacticsReps: number;
  completedPrograms: number;
}

export interface AthleteTrainingStats extends TrainingStats {
  athleteId: string;
  athleteName: string;
}

export const useTrainingStats = (athleteId?: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["training-stats", athleteId, user?.id],
    queryFn: async (): Promise<TrainingStats> => {
      let query = supabase
        .from("training_programs")
        .select(`
          id,
          athlete_id,
          is_completed,
          program_exercises (
            exercise_type,
            sets,
            reps,
            load_value
          )
        `)
        .eq("is_completed", true);

      if (athleteId) {
        query = query.eq("athlete_id", athleteId);
      }

      const { data, error } = await query;

      if (error) throw error;

      let totalWeightLifted = 0;
      let totalSprintDistance = 0;
      let totalEnduranceDistance = 0;
      let totalTechniqueReps = 0;
      let totalTacticsReps = 0;

      (data || []).forEach((program: any) => {
        (program.program_exercises || []).forEach((exercise: any) => {
          const sets = exercise.sets || 1;
          const reps = exercise.reps || 1;
          const loadValue = exercise.load_value || "";

          switch (exercise.exercise_type) {
            case "strength":
              // Parse weight from load_value (e.g., "50 kg", "50kg", "50")
              const weightMatch = loadValue.match(/(\d+(?:\.\d+)?)/);
              if (weightMatch) {
                totalWeightLifted += parseFloat(weightMatch[1]) * sets * reps;
              }
              break;
            case "speed":
              // Parse distance from load_value (e.g., "100m", "100 meter", "100")
              const sprintMatch = loadValue.match(/(\d+(?:\.\d+)?)/);
              if (sprintMatch) {
                totalSprintDistance += parseFloat(sprintMatch[1]) * sets * reps;
              }
              break;
            case "endurance":
              // Parse distance from load_value (e.g., "5km", "5000m", "5 km")
              const enduranceMatch = loadValue.match(/(\d+(?:\.\d+)?)\s*(km|m)?/i);
              if (enduranceMatch) {
                let distance = parseFloat(enduranceMatch[1]);
                const unit = enduranceMatch[2]?.toLowerCase();
                if (unit === "km") {
                  distance *= 1000; // Convert km to meters
                }
                totalEnduranceDistance += distance * sets * reps;
              }
              break;
            case "technique":
              totalTechniqueReps += sets * reps;
              break;
            case "tactics":
              totalTacticsReps += sets * reps;
              break;
          }
        });
      });

      return {
        totalWeightLifted,
        totalSprintDistance,
        totalEnduranceDistance,
        totalTechniqueReps,
        totalTacticsReps,
        completedPrograms: data?.length || 0,
      };
    },
    enabled: !!user,
  });
};

export const useAllAthletesStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-athletes-training-stats", user?.id],
    queryFn: async (): Promise<AthleteTrainingStats[]> => {
      // First get all athletes
      const { data: athletes, error: athletesError } = await supabase
        .from("athletes")
        .select("id, name");

      if (athletesError) throw athletesError;

      // Then get all completed programs with exercises
      const { data: programs, error: programsError } = await supabase
        .from("training_programs")
        .select(`
          id,
          athlete_id,
          is_completed,
          program_exercises (
            exercise_type,
            sets,
            reps,
            load_value
          )
        `)
        .eq("is_completed", true);

      if (programsError) throw programsError;

      // Calculate stats per athlete
      return (athletes || []).map((athlete) => {
        const athletePrograms = (programs || []).filter(
          (p: any) => p.athlete_id === athlete.id
        );

        let totalWeightLifted = 0;
        let totalSprintDistance = 0;
        let totalEnduranceDistance = 0;
        let totalTechniqueReps = 0;
        let totalTacticsReps = 0;

        athletePrograms.forEach((program: any) => {
          (program.program_exercises || []).forEach((exercise: any) => {
            const sets = exercise.sets || 1;
            const reps = exercise.reps || 1;
            const loadValue = exercise.load_value || "";

            switch (exercise.exercise_type) {
              case "strength":
                const weightMatch = loadValue.match(/(\d+(?:\.\d+)?)/);
                if (weightMatch) {
                  totalWeightLifted += parseFloat(weightMatch[1]) * sets * reps;
                }
                break;
              case "speed":
                const sprintMatch = loadValue.match(/(\d+(?:\.\d+)?)/);
                if (sprintMatch) {
                  totalSprintDistance += parseFloat(sprintMatch[1]) * sets * reps;
                }
                break;
              case "endurance":
                const enduranceMatch = loadValue.match(/(\d+(?:\.\d+)?)\s*(km|m)?/i);
                if (enduranceMatch) {
                  let distance = parseFloat(enduranceMatch[1]);
                  const unit = enduranceMatch[2]?.toLowerCase();
                  if (unit === "km") {
                    distance *= 1000;
                  }
                  totalEnduranceDistance += distance * sets * reps;
                }
                break;
              case "technique":
                totalTechniqueReps += sets * reps;
                break;
              case "tactics":
                totalTacticsReps += sets * reps;
                break;
            }
          });
        });

        return {
          athleteId: athlete.id,
          athleteName: athlete.name,
          totalWeightLifted,
          totalSprintDistance,
          totalEnduranceDistance,
          totalTechniqueReps,
          totalTacticsReps,
          completedPrograms: athletePrograms.length,
        };
      });
    },
    enabled: !!user,
  });
};
