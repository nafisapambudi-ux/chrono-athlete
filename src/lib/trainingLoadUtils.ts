// TSS (Training Stress Score) calculation based on RPE
// Base values are for 60 minutes of training
export const RPE_BASE_LOAD: Record<number, number> = {
  1: 20,
  2: 30,
  3: 40,
  4: 50,
  5: 60,
  6: 70,
  7: 80,
  8: 100,
  9: 120,
  10: 140,
};

/**
 * Calculate training load based on RPE and duration
 * The base load values are for 60 minutes, and scale proportionally with duration
 */
export function calculateTrainingLoad(rpe: number, durationMinutes: number): number {
  const baseLoad = RPE_BASE_LOAD[rpe] || 0;
  // Scale proportionally: if 60 min = base load, then actual duration proportionally adjusts
  return Math.round((baseLoad * durationMinutes) / 60);
}

export const RPE_DESCRIPTIONS: Record<number, { label: string; color: string }> = {
  1: { label: "Sangat Ringan", color: "bg-green-500" },
  2: { label: "Ringan", color: "bg-green-500" },
  3: { label: "Sedang", color: "bg-lime-500" },
  4: { label: "Agak Berat", color: "bg-lime-500" },
  5: { label: "Berat", color: "bg-yellow-500" },
  6: { label: "Cukup Berat", color: "bg-yellow-500" },
  7: { label: "Sangat Berat", color: "bg-orange-500" },
  8: { label: "Sangat Berat Sekali", color: "bg-orange-500" },
  9: { label: "Hampir Maksimal", color: "bg-red-500" },
  10: { label: "Maksimal", color: "bg-red-600" },
};
