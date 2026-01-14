// Norma tes bimotor berdasarkan jenis kelamin dan usia
// Kategori: Sangat Kurang, Kurang, Cukup, Baik, Sangat Baik

export type TestCategory = 'strength' | 'speed' | 'endurance' | 'flexibility' | 'power' | 'agility';
export type Gender = 'male' | 'female';
export type NormLevel = 'sangat_kurang' | 'kurang' | 'cukup' | 'baik' | 'sangat_baik';

export interface TestItem {
  id: string;
  name: string;
  unit: string;
  description: string;
  higherIsBetter: boolean; // true = semakin tinggi semakin baik, false = semakin rendah semakin baik
  isRelativeToBodyWeight?: boolean; // untuk tes 1RM
  isDynamometer?: boolean; // untuk dynamometer tests
}

export interface NormRange {
  sangat_kurang: [number, number];
  kurang: [number, number];
  cukup: [number, number];
  baik: [number, number];
  sangat_baik: [number, number];
}

// Kelompok usia: remaja (13-17), dewasa_muda (18-25), dewasa (26-35), dewasa_akhir (36+)
export type AgeGroup = 'remaja' | 'dewasa_muda' | 'dewasa' | 'dewasa_akhir';

export function getAgeGroup(age: number): AgeGroup {
  if (age < 18) return 'remaja';
  if (age <= 25) return 'dewasa_muda';
  if (age <= 35) return 'dewasa';
  return 'dewasa_akhir';
}

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// ============= STRENGTH TESTS (12 items) =============
export const strengthTests: TestItem[] = [
  // 1RM Tests (relative to body weight)
  { id: 'squat_1rm', name: 'Squat 1RM', unit: 'x BW', description: 'Back Squat 1 Rep Max relatif terhadap berat badan', higherIsBetter: true, isRelativeToBodyWeight: true },
  { id: 'deadlift_1rm', name: 'Deadlift 1RM', unit: 'x BW', description: 'Deadlift 1 Rep Max relatif terhadap berat badan', higherIsBetter: true, isRelativeToBodyWeight: true },
  { id: 'bench_press_1rm', name: 'Bench Press 1RM', unit: 'x BW', description: 'Bench Press 1 Rep Max relatif terhadap berat badan', higherIsBetter: true, isRelativeToBodyWeight: true },
  { id: 'overhead_press_1rm', name: 'Overhead Press 1RM', unit: 'x BW', description: 'Overhead Press 1 Rep Max relatif terhadap berat badan', higherIsBetter: true, isRelativeToBodyWeight: true },
  { id: 'power_clean_1rm', name: 'Power Clean 1RM', unit: 'x BW', description: 'Power Clean 1 Rep Max relatif terhadap berat badan', higherIsBetter: true, isRelativeToBodyWeight: true },
  
  // Dynamometer Tests
  { id: 'grip_right', name: 'Grip Dynamometer (Kanan)', unit: 'kg', description: 'Kekuatan genggaman tangan kanan', higherIsBetter: true, isDynamometer: true },
  { id: 'grip_left', name: 'Grip Dynamometer (Kiri)', unit: 'kg', description: 'Kekuatan genggaman tangan kiri', higherIsBetter: true, isDynamometer: true },
  { id: 'back_dynamometer', name: 'Back Dynamometer', unit: 'kg', description: 'Kekuatan otot punggung', higherIsBetter: true, isDynamometer: true },
  { id: 'leg_dynamometer', name: 'Leg Dynamometer', unit: 'kg', description: 'Kekuatan otot kaki', higherIsBetter: true, isDynamometer: true },
  
  // Bodyweight Tests
  { id: 'push_up', name: 'Push Up', unit: 'reps', description: 'Jumlah push up dalam 1 menit', higherIsBetter: true },
  { id: 'pull_up', name: 'Pull Up', unit: 'reps', description: 'Jumlah pull up maksimal', higherIsBetter: true },
  { id: 'sit_up', name: 'Sit Up', unit: 'reps', description: 'Jumlah sit up dalam 1 menit', higherIsBetter: true },
];

// ============= SPEED TESTS (10 items) =============
export const speedTests: TestItem[] = [
  { id: 'sprint_10m', name: 'Sprint 10m', unit: 'detik', description: 'Waktu sprint 10 meter', higherIsBetter: false },
  { id: 'sprint_20m', name: 'Sprint 20m', unit: 'detik', description: 'Waktu sprint 20 meter', higherIsBetter: false },
  { id: 'sprint_30m', name: 'Sprint 30m', unit: 'detik', description: 'Waktu sprint 30 meter', higherIsBetter: false },
  { id: 'sprint_40m', name: 'Sprint 40m', unit: 'detik', description: 'Waktu sprint 40 meter', higherIsBetter: false },
  { id: 'sprint_50m', name: 'Sprint 50m', unit: 'detik', description: 'Waktu sprint 50 meter', higherIsBetter: false },
  { id: 'sprint_60m', name: 'Sprint 60m', unit: 'detik', description: 'Waktu sprint 60 meter', higherIsBetter: false },
  { id: 'sprint_100m', name: 'Sprint 100m', unit: 'detik', description: 'Waktu sprint 100 meter', higherIsBetter: false },
  { id: 'flying_30m', name: 'Flying 30m', unit: 'detik', description: 'Waktu flying sprint 30 meter (dengan awalan)', higherIsBetter: false },
  { id: 'reaction_time', name: 'Reaction Time', unit: 'ms', description: 'Waktu reaksi', higherIsBetter: false },
  { id: 'tapping_speed', name: 'Tapping Speed', unit: 'reps/10s', description: 'Kecepatan tapping kaki dalam 10 detik', higherIsBetter: true },
];

// ============= ENDURANCE TESTS (10 items) =============
export const enduranceTests: TestItem[] = [
  { id: 'cooper_12min', name: 'Cooper Test (12 menit)', unit: 'm', description: 'Jarak tempuh dalam 12 menit', higherIsBetter: true },
  { id: 'beep_test', name: 'Beep Test (MFT)', unit: 'level', description: 'Level Multi-Stage Fitness Test', higherIsBetter: true },
  { id: 'yo_yo_ir1', name: 'Yo-Yo IR1', unit: 'm', description: 'Jarak Yo-Yo Intermittent Recovery Level 1', higherIsBetter: true },
  { id: 'yo_yo_ir2', name: 'Yo-Yo IR2', unit: 'm', description: 'Jarak Yo-Yo Intermittent Recovery Level 2', higherIsBetter: true },
  { id: 'run_1600m', name: 'Lari 1600m', unit: 'menit:detik', description: 'Waktu tempuh 1600 meter', higherIsBetter: false },
  { id: 'run_2400m', name: 'Lari 2400m', unit: 'menit:detik', description: 'Waktu tempuh 2400 meter', higherIsBetter: false },
  { id: 'run_3000m', name: 'Lari 3000m', unit: 'menit:detik', description: 'Waktu tempuh 3000 meter', higherIsBetter: false },
  { id: 'harvard_step', name: 'Harvard Step Test', unit: 'index', description: 'Indeks Harvard Step Test', higherIsBetter: true },
  { id: 'resting_hr', name: 'Resting Heart Rate', unit: 'bpm', description: 'Denyut jantung istirahat', higherIsBetter: false },
  { id: 'vo2max_estimated', name: 'VO2max (Estimasi)', unit: 'ml/kg/min', description: 'Estimasi VO2max', higherIsBetter: true },
];

// ============= FLEXIBILITY TESTS (10 items) =============
export const flexibilityTests: TestItem[] = [
  { id: 'sit_and_reach', name: 'Sit and Reach', unit: 'cm', description: 'Jarak raihan duduk', higherIsBetter: true },
  { id: 'shoulder_flexibility_right', name: 'Shoulder Flexibility (Kanan)', unit: 'cm', description: 'Fleksibilitas bahu kanan', higherIsBetter: true },
  { id: 'shoulder_flexibility_left', name: 'Shoulder Flexibility (Kiri)', unit: 'cm', description: 'Fleksibilitas bahu kiri', higherIsBetter: true },
  { id: 'trunk_rotation_right', name: 'Trunk Rotation (Kanan)', unit: 'derajat', description: 'Rotasi batang tubuh ke kanan', higherIsBetter: true },
  { id: 'trunk_rotation_left', name: 'Trunk Rotation (Kiri)', unit: 'derajat', description: 'Rotasi batang tubuh ke kiri', higherIsBetter: true },
  { id: 'hip_flexion', name: 'Hip Flexion', unit: 'derajat', description: 'Fleksi panggul', higherIsBetter: true },
  { id: 'ankle_dorsiflexion', name: 'Ankle Dorsiflexion', unit: 'derajat', description: 'Dorsifleksi pergelangan kaki', higherIsBetter: true },
  { id: 'hamstring_flexibility', name: 'Hamstring Flexibility', unit: 'derajat', description: 'Fleksibilitas hamstring (SLR test)', higherIsBetter: true },
  { id: 'quadriceps_flexibility', name: 'Quadriceps Flexibility', unit: 'cm', description: 'Fleksibilitas quadriceps', higherIsBetter: true },
  { id: 'thomas_test', name: 'Thomas Test', unit: 'derajat', description: 'Tes fleksibilitas hip flexor', higherIsBetter: true },
];

// ============= POWER TESTS (10 items) =============
export const powerTests: TestItem[] = [
  { id: 'vertical_jump', name: 'Vertical Jump', unit: 'cm', description: 'Tinggi lompatan vertikal', higherIsBetter: true },
  { id: 'broad_jump', name: 'Standing Broad Jump', unit: 'cm', description: 'Jarak lompatan jauh tanpa awalan', higherIsBetter: true },
  { id: 'triple_hop', name: 'Triple Hop', unit: 'cm', description: 'Jarak triple hop test', higherIsBetter: true },
  { id: 'squat_jump', name: 'Squat Jump', unit: 'cm', description: 'Tinggi squat jump', higherIsBetter: true },
  { id: 'cmj', name: 'Counter Movement Jump', unit: 'cm', description: 'Tinggi counter movement jump', higherIsBetter: true },
  { id: 'drop_jump', name: 'Drop Jump', unit: 'cm', description: 'Tinggi drop jump dari 30cm', higherIsBetter: true },
  { id: 'medicine_ball_throw', name: 'Medicine Ball Throw', unit: 'm', description: 'Jarak lempar bola medicine (3kg)', higherIsBetter: true },
  { id: 'shot_put', name: 'Shot Put', unit: 'm', description: 'Jarak tolak peluru', higherIsBetter: true },
  { id: 'reactive_strength_index', name: 'Reactive Strength Index', unit: 'index', description: 'RSI (tinggi/waktu kontak)', higherIsBetter: true },
  { id: 'peak_power', name: 'Peak Power (Wingate)', unit: 'W/kg', description: 'Peak power dari Wingate test', higherIsBetter: true },
];

// ============= AGILITY TESTS (10 items) =============
export const agilityTests: TestItem[] = [
  { id: 'illinois_agility', name: 'Illinois Agility Test', unit: 'detik', description: 'Waktu Illinois Agility Test', higherIsBetter: false },
  { id: 't_test', name: 'T-Test', unit: 'detik', description: 'Waktu T-Test agility', higherIsBetter: false },
  { id: 'shuttle_run_4x10', name: 'Shuttle Run 4x10m', unit: 'detik', description: 'Waktu shuttle run 4x10 meter', higherIsBetter: false },
  { id: 'shuttle_run_5x10', name: 'Shuttle Run 5x10m', unit: 'detik', description: 'Waktu shuttle run 5x10 meter', higherIsBetter: false },
  { id: 'hexagon', name: 'Hexagon Test', unit: 'detik', description: 'Waktu hexagon agility test', higherIsBetter: false },
  { id: 'pro_agility', name: 'Pro Agility (5-10-5)', unit: 'detik', description: 'Waktu pro agility test', higherIsBetter: false },
  { id: 'arrowhead', name: 'Arrowhead Agility', unit: 'detik', description: 'Waktu arrowhead agility test', higherIsBetter: false },
  { id: 'l_run', name: 'L-Run (3-Cone)', unit: 'detik', description: 'Waktu L-run/3-cone drill', higherIsBetter: false },
  { id: 'zig_zag', name: 'Zig-Zag Run', unit: 'detik', description: 'Waktu zig-zag run', higherIsBetter: false },
  { id: 'reactive_agility', name: 'Reactive Agility Test', unit: 'detik', description: 'Waktu reactive agility test', higherIsBetter: false },
];

export const testCategories: Record<TestCategory, { name: string; tests: TestItem[]; icon: string }> = {
  strength: { name: 'Kekuatan', tests: strengthTests, icon: 'Dumbbell' },
  speed: { name: 'Kecepatan', tests: speedTests, icon: 'Zap' },
  endurance: { name: 'Daya Tahan', tests: enduranceTests, icon: 'Heart' },
  flexibility: { name: 'Fleksibilitas', tests: flexibilityTests, icon: 'StretchVertical' },
  power: { name: 'Power', tests: powerTests, icon: 'Flame' },
  agility: { name: 'Kelincahan', tests: agilityTests, icon: 'Wind' },
};

// ============= NORMA TES =============
// Format: [min, max] untuk setiap kategori
// Norma berdasarkan gender dan age group

interface NormData {
  male: Record<AgeGroup, NormRange>;
  female: Record<AgeGroup, NormRange>;
}

// Helper untuk menghasilkan norma dengan adjustment
function generateNorms(
  baseMale: NormRange,
  baseFemale: NormRange,
  ageAdjustments: Record<AgeGroup, number> = { remaja: 0.9, dewasa_muda: 1, dewasa: 0.95, dewasa_akhir: 0.85 }
): NormData {
  const adjustRange = (range: NormRange, factor: number): NormRange => ({
    sangat_kurang: [range.sangat_kurang[0] * factor, range.sangat_kurang[1] * factor],
    kurang: [range.kurang[0] * factor, range.kurang[1] * factor],
    cukup: [range.cukup[0] * factor, range.cukup[1] * factor],
    baik: [range.baik[0] * factor, range.baik[1] * factor],
    sangat_baik: [range.sangat_baik[0] * factor, range.sangat_baik[1] * factor],
  });

  return {
    male: {
      remaja: adjustRange(baseMale, ageAdjustments.remaja),
      dewasa_muda: baseMale,
      dewasa: adjustRange(baseMale, ageAdjustments.dewasa),
      dewasa_akhir: adjustRange(baseMale, ageAdjustments.dewasa_akhir),
    },
    female: {
      remaja: adjustRange(baseFemale, ageAdjustments.remaja),
      dewasa_muda: baseFemale,
      dewasa: adjustRange(baseFemale, ageAdjustments.dewasa),
      dewasa_akhir: adjustRange(baseFemale, ageAdjustments.dewasa_akhir),
    },
  };
}

// Norma untuk setiap tes
export const testNorms: Record<string, NormData> = {
  // STRENGTH - 1RM (relative to body weight)
  squat_1rm: generateNorms(
    { sangat_kurang: [0, 0.75], kurang: [0.75, 1.0], cukup: [1.0, 1.5], baik: [1.5, 2.0], sangat_baik: [2.0, 3.0] },
    { sangat_kurang: [0, 0.5], kurang: [0.5, 0.75], cukup: [0.75, 1.0], baik: [1.0, 1.5], sangat_baik: [1.5, 2.5] }
  ),
  deadlift_1rm: generateNorms(
    { sangat_kurang: [0, 1.0], kurang: [1.0, 1.5], cukup: [1.5, 2.0], baik: [2.0, 2.5], sangat_baik: [2.5, 3.5] },
    { sangat_kurang: [0, 0.75], kurang: [0.75, 1.0], cukup: [1.0, 1.5], baik: [1.5, 2.0], sangat_baik: [2.0, 3.0] }
  ),
  bench_press_1rm: generateNorms(
    { sangat_kurang: [0, 0.5], kurang: [0.5, 0.75], cukup: [0.75, 1.0], baik: [1.0, 1.5], sangat_baik: [1.5, 2.5] },
    { sangat_kurang: [0, 0.25], kurang: [0.25, 0.5], cukup: [0.5, 0.75], baik: [0.75, 1.0], sangat_baik: [1.0, 1.5] }
  ),
  overhead_press_1rm: generateNorms(
    { sangat_kurang: [0, 0.35], kurang: [0.35, 0.5], cukup: [0.5, 0.75], baik: [0.75, 1.0], sangat_baik: [1.0, 1.5] },
    { sangat_kurang: [0, 0.2], kurang: [0.2, 0.35], cukup: [0.35, 0.5], baik: [0.5, 0.75], sangat_baik: [0.75, 1.0] }
  ),
  power_clean_1rm: generateNorms(
    { sangat_kurang: [0, 0.5], kurang: [0.5, 0.75], cukup: [0.75, 1.0], baik: [1.0, 1.25], sangat_baik: [1.25, 2.0] },
    { sangat_kurang: [0, 0.35], kurang: [0.35, 0.5], cukup: [0.5, 0.75], baik: [0.75, 1.0], sangat_baik: [1.0, 1.5] }
  ),
  // STRENGTH - Dynamometer
  grip_right: generateNorms(
    { sangat_kurang: [0, 35], kurang: [35, 45], cukup: [45, 55], baik: [55, 65], sangat_baik: [65, 100] },
    { sangat_kurang: [0, 20], kurang: [20, 28], cukup: [28, 35], baik: [35, 42], sangat_baik: [42, 70] }
  ),
  grip_left: generateNorms(
    { sangat_kurang: [0, 32], kurang: [32, 42], cukup: [42, 52], baik: [52, 62], sangat_baik: [62, 95] },
    { sangat_kurang: [0, 18], kurang: [18, 25], cukup: [25, 32], baik: [32, 40], sangat_baik: [40, 65] }
  ),
  back_dynamometer: generateNorms(
    { sangat_kurang: [0, 90], kurang: [90, 120], cukup: [120, 150], baik: [150, 180], sangat_baik: [180, 250] },
    { sangat_kurang: [0, 50], kurang: [50, 70], cukup: [70, 95], baik: [95, 120], sangat_baik: [120, 170] }
  ),
  leg_dynamometer: generateNorms(
    { sangat_kurang: [0, 120], kurang: [120, 160], cukup: [160, 200], baik: [200, 250], sangat_baik: [250, 350] },
    { sangat_kurang: [0, 70], kurang: [70, 100], cukup: [100, 130], baik: [130, 170], sangat_baik: [170, 250] }
  ),
  // STRENGTH - Bodyweight
  push_up: generateNorms(
    { sangat_kurang: [0, 15], kurang: [15, 25], cukup: [25, 40], baik: [40, 55], sangat_baik: [55, 100] },
    { sangat_kurang: [0, 5], kurang: [5, 12], cukup: [12, 22], baik: [22, 35], sangat_baik: [35, 70] }
  ),
  pull_up: generateNorms(
    { sangat_kurang: [0, 3], kurang: [3, 7], cukup: [7, 12], baik: [12, 18], sangat_baik: [18, 35] },
    { sangat_kurang: [0, 0], kurang: [0, 2], cukup: [2, 5], baik: [5, 10], sangat_baik: [10, 20] }
  ),
  sit_up: generateNorms(
    { sangat_kurang: [0, 20], kurang: [20, 30], cukup: [30, 45], baik: [45, 55], sangat_baik: [55, 80] },
    { sangat_kurang: [0, 15], kurang: [15, 25], cukup: [25, 35], baik: [35, 45], sangat_baik: [45, 70] }
  ),

  // SPEED
  sprint_10m: generateNorms(
    { sangat_kurang: [2.5, 3.0], kurang: [2.1, 2.5], cukup: [1.85, 2.1], baik: [1.65, 1.85], sangat_baik: [1.4, 1.65] },
    { sangat_kurang: [2.8, 3.3], kurang: [2.4, 2.8], cukup: [2.1, 2.4], baik: [1.9, 2.1], sangat_baik: [1.6, 1.9] }
  ),
  sprint_20m: generateNorms(
    { sangat_kurang: [4.0, 4.5], kurang: [3.5, 4.0], cukup: [3.1, 3.5], baik: [2.8, 3.1], sangat_baik: [2.4, 2.8] },
    { sangat_kurang: [4.5, 5.0], kurang: [4.0, 4.5], cukup: [3.5, 4.0], baik: [3.2, 3.5], sangat_baik: [2.8, 3.2] }
  ),
  sprint_30m: generateNorms(
    { sangat_kurang: [5.5, 6.0], kurang: [4.8, 5.5], cukup: [4.3, 4.8], baik: [3.9, 4.3], sangat_baik: [3.4, 3.9] },
    { sangat_kurang: [6.0, 6.5], kurang: [5.3, 6.0], cukup: [4.8, 5.3], baik: [4.4, 4.8], sangat_baik: [3.9, 4.4] }
  ),
  sprint_40m: generateNorms(
    { sangat_kurang: [6.8, 7.5], kurang: [6.0, 6.8], cukup: [5.4, 6.0], baik: [5.0, 5.4], sangat_baik: [4.4, 5.0] },
    { sangat_kurang: [7.5, 8.2], kurang: [6.7, 7.5], cukup: [6.0, 6.7], baik: [5.5, 6.0], sangat_baik: [4.9, 5.5] }
  ),
  sprint_50m: generateNorms(
    { sangat_kurang: [8.0, 8.8], kurang: [7.2, 8.0], cukup: [6.5, 7.2], baik: [6.0, 6.5], sangat_baik: [5.3, 6.0] },
    { sangat_kurang: [9.0, 9.8], kurang: [8.0, 9.0], cukup: [7.2, 8.0], baik: [6.6, 7.2], sangat_baik: [5.8, 6.6] }
  ),
  sprint_60m: generateNorms(
    { sangat_kurang: [9.5, 10.5], kurang: [8.5, 9.5], cukup: [7.6, 8.5], baik: [7.0, 7.6], sangat_baik: [6.2, 7.0] },
    { sangat_kurang: [10.5, 11.5], kurang: [9.5, 10.5], cukup: [8.5, 9.5], baik: [7.8, 8.5], sangat_baik: [6.8, 7.8] }
  ),
  sprint_100m: generateNorms(
    { sangat_kurang: [15.0, 17.0], kurang: [13.5, 15.0], cukup: [12.0, 13.5], baik: [11.0, 12.0], sangat_baik: [9.5, 11.0] },
    { sangat_kurang: [17.0, 19.0], kurang: [15.0, 17.0], cukup: [13.5, 15.0], baik: [12.5, 13.5], sangat_baik: [11.0, 12.5] }
  ),
  flying_30m: generateNorms(
    { sangat_kurang: [4.5, 5.0], kurang: [4.0, 4.5], cukup: [3.5, 4.0], baik: [3.1, 3.5], sangat_baik: [2.7, 3.1] },
    { sangat_kurang: [5.0, 5.5], kurang: [4.5, 5.0], cukup: [4.0, 4.5], baik: [3.5, 4.0], sangat_baik: [3.0, 3.5] }
  ),
  reaction_time: generateNorms(
    { sangat_kurang: [350, 500], kurang: [280, 350], cukup: [220, 280], baik: [170, 220], sangat_baik: [120, 170] },
    { sangat_kurang: [380, 520], kurang: [300, 380], cukup: [240, 300], baik: [190, 240], sangat_baik: [140, 190] }
  ),
  tapping_speed: generateNorms(
    { sangat_kurang: [0, 30], kurang: [30, 40], cukup: [40, 50], baik: [50, 60], sangat_baik: [60, 80] },
    { sangat_kurang: [0, 25], kurang: [25, 35], cukup: [35, 45], baik: [45, 55], sangat_baik: [55, 75] }
  ),

  // ENDURANCE
  cooper_12min: generateNorms(
    { sangat_kurang: [0, 1600], kurang: [1600, 2000], cukup: [2000, 2400], baik: [2400, 2800], sangat_baik: [2800, 4000] },
    { sangat_kurang: [0, 1200], kurang: [1200, 1600], cukup: [1600, 2000], baik: [2000, 2400], sangat_baik: [2400, 3500] }
  ),
  beep_test: generateNorms(
    { sangat_kurang: [0, 5], kurang: [5, 7], cukup: [7, 9], baik: [9, 12], sangat_baik: [12, 21] },
    { sangat_kurang: [0, 4], kurang: [4, 5.5], cukup: [5.5, 7], baik: [7, 9], sangat_baik: [9, 15] }
  ),
  yo_yo_ir1: generateNorms(
    { sangat_kurang: [0, 440], kurang: [440, 720], cukup: [720, 1040], baik: [1040, 1560], sangat_baik: [1560, 2800] },
    { sangat_kurang: [0, 280], kurang: [280, 440], cukup: [440, 680], baik: [680, 1000], sangat_baik: [1000, 2000] }
  ),
  yo_yo_ir2: generateNorms(
    { sangat_kurang: [0, 320], kurang: [320, 560], cukup: [560, 840], baik: [840, 1200], sangat_baik: [1200, 2000] },
    { sangat_kurang: [0, 200], kurang: [200, 360], cukup: [360, 520], baik: [520, 760], sangat_baik: [760, 1400] }
  ),
  harvard_step: generateNorms(
    { sangat_kurang: [0, 50], kurang: [50, 65], cukup: [65, 80], baik: [80, 95], sangat_baik: [95, 130] },
    { sangat_kurang: [0, 45], kurang: [45, 60], cukup: [60, 75], baik: [75, 90], sangat_baik: [90, 125] }
  ),
  resting_hr: generateNorms(
    { sangat_kurang: [85, 100], kurang: [75, 85], cukup: [65, 75], baik: [55, 65], sangat_baik: [40, 55] },
    { sangat_kurang: [90, 105], kurang: [80, 90], cukup: [70, 80], baik: [60, 70], sangat_baik: [45, 60] }
  ),
  vo2max_estimated: generateNorms(
    { sangat_kurang: [0, 35], kurang: [35, 42], cukup: [42, 50], baik: [50, 58], sangat_baik: [58, 80] },
    { sangat_kurang: [0, 28], kurang: [28, 35], cukup: [35, 42], baik: [42, 50], sangat_baik: [50, 70] }
  ),

  // FLEXIBILITY
  sit_and_reach: generateNorms(
    { sangat_kurang: [-20, 0], kurang: [0, 10], cukup: [10, 20], baik: [20, 30], sangat_baik: [30, 50] },
    { sangat_kurang: [-15, 5], kurang: [5, 15], cukup: [15, 25], baik: [25, 35], sangat_baik: [35, 55] }
  ),
  shoulder_flexibility_right: generateNorms(
    { sangat_kurang: [-30, -10], kurang: [-10, 0], cukup: [0, 10], baik: [10, 20], sangat_baik: [20, 40] },
    { sangat_kurang: [-25, -5], kurang: [-5, 5], cukup: [5, 15], baik: [15, 25], sangat_baik: [25, 45] }
  ),
  shoulder_flexibility_left: generateNorms(
    { sangat_kurang: [-30, -10], kurang: [-10, 0], cukup: [0, 10], baik: [10, 20], sangat_baik: [20, 40] },
    { sangat_kurang: [-25, -5], kurang: [-5, 5], cukup: [5, 15], baik: [15, 25], sangat_baik: [25, 45] }
  ),
  trunk_rotation_right: generateNorms(
    { sangat_kurang: [0, 30], kurang: [30, 40], cukup: [40, 50], baik: [50, 60], sangat_baik: [60, 80] },
    { sangat_kurang: [0, 35], kurang: [35, 45], cukup: [45, 55], baik: [55, 65], sangat_baik: [65, 85] }
  ),
  trunk_rotation_left: generateNorms(
    { sangat_kurang: [0, 30], kurang: [30, 40], cukup: [40, 50], baik: [50, 60], sangat_baik: [60, 80] },
    { sangat_kurang: [0, 35], kurang: [35, 45], cukup: [45, 55], baik: [55, 65], sangat_baik: [65, 85] }
  ),
  hip_flexion: generateNorms(
    { sangat_kurang: [0, 80], kurang: [80, 100], cukup: [100, 115], baik: [115, 130], sangat_baik: [130, 150] },
    { sangat_kurang: [0, 85], kurang: [85, 105], cukup: [105, 120], baik: [120, 135], sangat_baik: [135, 155] }
  ),
  ankle_dorsiflexion: generateNorms(
    { sangat_kurang: [0, 10], kurang: [10, 15], cukup: [15, 20], baik: [20, 30], sangat_baik: [30, 45] },
    { sangat_kurang: [0, 12], kurang: [12, 18], cukup: [18, 25], baik: [25, 35], sangat_baik: [35, 50] }
  ),
  hamstring_flexibility: generateNorms(
    { sangat_kurang: [0, 50], kurang: [50, 65], cukup: [65, 80], baik: [80, 90], sangat_baik: [90, 120] },
    { sangat_kurang: [0, 55], kurang: [55, 70], cukup: [70, 85], baik: [85, 95], sangat_baik: [95, 125] }
  ),
  quadriceps_flexibility: generateNorms(
    { sangat_kurang: [-20, -5], kurang: [-5, 0], cukup: [0, 5], baik: [5, 10], sangat_baik: [10, 20] },
    { sangat_kurang: [-15, 0], kurang: [0, 5], cukup: [5, 10], baik: [10, 15], sangat_baik: [15, 25] }
  ),
  thomas_test: generateNorms(
    { sangat_kurang: [0, -10], kurang: [-10, -5], cukup: [-5, 0], baik: [0, 5], sangat_baik: [5, 15] },
    { sangat_kurang: [0, -5], kurang: [-5, 0], cukup: [0, 5], baik: [5, 10], sangat_baik: [10, 20] }
  ),

  // POWER
  vertical_jump: generateNorms(
    { sangat_kurang: [0, 30], kurang: [30, 40], cukup: [40, 50], baik: [50, 60], sangat_baik: [60, 90] },
    { sangat_kurang: [0, 20], kurang: [20, 28], cukup: [28, 36], baik: [36, 45], sangat_baik: [45, 70] }
  ),
  broad_jump: generateNorms(
    { sangat_kurang: [0, 180], kurang: [180, 210], cukup: [210, 240], baik: [240, 270], sangat_baik: [270, 350] },
    { sangat_kurang: [0, 140], kurang: [140, 165], cukup: [165, 190], baik: [190, 220], sangat_baik: [220, 290] }
  ),
  triple_hop: generateNorms(
    { sangat_kurang: [0, 500], kurang: [500, 580], cukup: [580, 660], baik: [660, 750], sangat_baik: [750, 950] },
    { sangat_kurang: [0, 400], kurang: [400, 470], cukup: [470, 540], baik: [540, 620], sangat_baik: [620, 800] }
  ),
  squat_jump: generateNorms(
    { sangat_kurang: [0, 25], kurang: [25, 35], cukup: [35, 45], baik: [45, 55], sangat_baik: [55, 80] },
    { sangat_kurang: [0, 18], kurang: [18, 25], cukup: [25, 32], baik: [32, 40], sangat_baik: [40, 60] }
  ),
  cmj: generateNorms(
    { sangat_kurang: [0, 28], kurang: [28, 38], cukup: [38, 48], baik: [48, 58], sangat_baik: [58, 85] },
    { sangat_kurang: [0, 20], kurang: [20, 28], cukup: [28, 36], baik: [36, 44], sangat_baik: [44, 65] }
  ),
  drop_jump: generateNorms(
    { sangat_kurang: [0, 30], kurang: [30, 40], cukup: [40, 50], baik: [50, 60], sangat_baik: [60, 85] },
    { sangat_kurang: [0, 22], kurang: [22, 30], cukup: [30, 38], baik: [38, 48], sangat_baik: [48, 70] }
  ),
  medicine_ball_throw: generateNorms(
    { sangat_kurang: [0, 4], kurang: [4, 6], cukup: [6, 8], baik: [8, 10], sangat_baik: [10, 15] },
    { sangat_kurang: [0, 2.5], kurang: [2.5, 4], cukup: [4, 5.5], baik: [5.5, 7], sangat_baik: [7, 11] }
  ),
  shot_put: generateNorms(
    { sangat_kurang: [0, 6], kurang: [6, 8], cukup: [8, 10], baik: [10, 13], sangat_baik: [13, 20] },
    { sangat_kurang: [0, 4], kurang: [4, 5.5], cukup: [5.5, 7], baik: [7, 9], sangat_baik: [9, 14] }
  ),
  reactive_strength_index: generateNorms(
    { sangat_kurang: [0, 1.0], kurang: [1.0, 1.5], cukup: [1.5, 2.0], baik: [2.0, 2.5], sangat_baik: [2.5, 4.0] },
    { sangat_kurang: [0, 0.8], kurang: [0.8, 1.2], cukup: [1.2, 1.6], baik: [1.6, 2.0], sangat_baik: [2.0, 3.5] }
  ),
  peak_power: generateNorms(
    { sangat_kurang: [0, 8], kurang: [8, 10], cukup: [10, 12], baik: [12, 14], sangat_baik: [14, 20] },
    { sangat_kurang: [0, 6], kurang: [6, 8], cukup: [8, 10], baik: [10, 12], sangat_baik: [12, 17] }
  ),

  // AGILITY
  illinois_agility: generateNorms(
    { sangat_kurang: [20, 25], kurang: [17, 20], cukup: [15.5, 17], baik: [14.5, 15.5], sangat_baik: [12, 14.5] },
    { sangat_kurang: [22, 27], kurang: [19, 22], cukup: [17, 19], baik: [16, 17], sangat_baik: [13.5, 16] }
  ),
  t_test: generateNorms(
    { sangat_kurang: [13, 15], kurang: [11.5, 13], cukup: [10, 11.5], baik: [9.2, 10], sangat_baik: [7.5, 9.2] },
    { sangat_kurang: [14, 16], kurang: [12.5, 14], cukup: [11, 12.5], baik: [10.2, 11], sangat_baik: [8.5, 10.2] }
  ),
  shuttle_run_4x10: generateNorms(
    { sangat_kurang: [14, 16], kurang: [12.5, 14], cukup: [11, 12.5], baik: [10, 11], sangat_baik: [8.5, 10] },
    { sangat_kurang: [15, 17], kurang: [13.5, 15], cukup: [12, 13.5], baik: [11, 12], sangat_baik: [9.5, 11] }
  ),
  shuttle_run_5x10: generateNorms(
    { sangat_kurang: [17, 19], kurang: [15.5, 17], cukup: [14, 15.5], baik: [12.5, 14], sangat_baik: [10.5, 12.5] },
    { sangat_kurang: [18, 20], kurang: [16.5, 18], cukup: [15, 16.5], baik: [13.5, 15], sangat_baik: [11.5, 13.5] }
  ),
  hexagon: generateNorms(
    { sangat_kurang: [18, 22], kurang: [15, 18], cukup: [12.5, 15], baik: [10.5, 12.5], sangat_baik: [8, 10.5] },
    { sangat_kurang: [20, 24], kurang: [17, 20], cukup: [14, 17], baik: [12, 14], sangat_baik: [9, 12] }
  ),
  pro_agility: generateNorms(
    { sangat_kurang: [6, 7], kurang: [5.2, 6], cukup: [4.6, 5.2], baik: [4.2, 4.6], sangat_baik: [3.6, 4.2] },
    { sangat_kurang: [6.5, 7.5], kurang: [5.7, 6.5], cukup: [5.1, 5.7], baik: [4.7, 5.1], sangat_baik: [4.1, 4.7] }
  ),
  arrowhead: generateNorms(
    { sangat_kurang: [10, 11.5], kurang: [8.8, 10], cukup: [8, 8.8], baik: [7.3, 8], sangat_baik: [6.2, 7.3] },
    { sangat_kurang: [11, 12.5], kurang: [9.8, 11], cukup: [9, 9.8], baik: [8.3, 9], sangat_baik: [7.2, 8.3] }
  ),
  l_run: generateNorms(
    { sangat_kurang: [9, 10.5], kurang: [8, 9], cukup: [7.2, 8], baik: [6.6, 7.2], sangat_baik: [5.8, 6.6] },
    { sangat_kurang: [10, 11.5], kurang: [9, 10], cukup: [8.2, 9], baik: [7.5, 8.2], sangat_baik: [6.5, 7.5] }
  ),
  zig_zag: generateNorms(
    { sangat_kurang: [9, 10.5], kurang: [7.8, 9], cukup: [6.8, 7.8], baik: [6, 6.8], sangat_baik: [5, 6] },
    { sangat_kurang: [10, 11.5], kurang: [8.8, 10], cukup: [7.8, 8.8], baik: [7, 7.8], sangat_baik: [6, 7] }
  ),
  reactive_agility: generateNorms(
    { sangat_kurang: [2.5, 3.0], kurang: [2.1, 2.5], cukup: [1.8, 2.1], baik: [1.5, 1.8], sangat_baik: [1.2, 1.5] },
    { sangat_kurang: [2.8, 3.3], kurang: [2.4, 2.8], cukup: [2.0, 2.4], baik: [1.7, 2.0], sangat_baik: [1.4, 1.7] }
  ),
};

// Function to get norm level based on value
export function getNormLevel(
  testId: string,
  value: number,
  gender: Gender,
  ageGroup: AgeGroup,
  higherIsBetter: boolean
): NormLevel {
  const norms = testNorms[testId];
  if (!norms) return 'cukup'; // default jika norma tidak ditemukan
  
  const genderNorms = norms[gender][ageGroup];
  
  if (higherIsBetter) {
    if (value >= genderNorms.sangat_baik[0]) return 'sangat_baik';
    if (value >= genderNorms.baik[0]) return 'baik';
    if (value >= genderNorms.cukup[0]) return 'cukup';
    if (value >= genderNorms.kurang[0]) return 'kurang';
    return 'sangat_kurang';
  } else {
    if (value <= genderNorms.sangat_baik[1]) return 'sangat_baik';
    if (value <= genderNorms.baik[1]) return 'baik';
    if (value <= genderNorms.cukup[1]) return 'cukup';
    if (value <= genderNorms.kurang[1]) return 'kurang';
    return 'sangat_kurang';
  }
}

export const normLevelColors: Record<NormLevel, string> = {
  sangat_kurang: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
  kurang: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
  cukup: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  baik: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  sangat_baik: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
};

export const normLevelLabels: Record<NormLevel, string> = {
  sangat_kurang: 'Sangat Kurang',
  kurang: 'Kurang',
  cukup: 'Cukup',
  baik: 'Baik',
  sangat_baik: 'Sangat Baik',
};
