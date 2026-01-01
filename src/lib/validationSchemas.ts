import { z } from "zod";

// Authentication validation
export const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Email tidak valid" })
    .max(255, { message: "Email terlalu panjang" }),
  password: z
    .string()
    .min(6, { message: "Password minimal 6 karakter" })
    .max(72, { message: "Password maksimal 72 karakter" }),
});

// Athlete validation
export const athleteSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Nama tidak boleh kosong" })
    .max(100, { message: "Nama maksimal 100 karakter" }),
  mass: z
    .number()
    .positive({ message: "Massa harus positif" })
    .max(500, { message: "Massa tidak valid" })
    .optional()
    .nullable(),
  body_height: z
    .number()
    .positive({ message: "Tinggi badan harus positif" })
    .max(300, { message: "Tinggi badan tidak valid" })
    .optional()
    .nullable(),
  vertical_jump: z
    .number()
    .positive({ message: "Vertical jump harus positif" })
    .max(200, { message: "Vertical jump tidak valid" })
    .optional()
    .nullable(),
  avatar_url: z
    .string()
    .url({ message: "URL avatar tidak valid" })
    .optional()
    .nullable(),
  sports_branch: z
    .string()
    .trim()
    .max(100, { message: "Cabang olahraga maksimal 100 karakter" })
    .optional()
    .nullable(),
});

// Training session validation
export const trainingSessionSchema = z.object({
  athlete_id: z.string().uuid({ message: "ID atlet tidak valid" }),
  session_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format tanggal tidak valid (YYYY-MM-DD)" }),
  duration_minutes: z
    .number()
    .int({ message: "Durasi harus bilangan bulat" })
    .positive({ message: "Durasi harus positif" })
    .max(1440, { message: "Durasi maksimal 24 jam" }),
  rpe: z
    .number()
    .int({ message: "RPE harus bilangan bulat" })
    .min(1, { message: "RPE minimal 1" })
    .max(10, { message: "RPE maksimal 10" }),
  notes: z
    .string()
    .trim()
    .max(1000, { message: "Catatan maksimal 1000 karakter" })
    .optional(),
});

// Athlete readiness validation
export const athleteReadinessSchema = z.object({
  athlete_id: z.string().uuid({ message: "ID atlet tidak valid" }),
  readiness_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format tanggal tidak valid (YYYY-MM-DD)" }),
  resting_heart_rate: z
    .number()
    .int({ message: "Heart rate harus bilangan bulat" })
    .min(30, { message: "Heart rate minimal 30 bpm" })
    .max(220, { message: "Heart rate maksimal 220 bpm" }),
  vertical_jump: z
    .number()
    .positive({ message: "Vertical jump harus positif" })
    .max(200, { message: "Vertical jump tidak valid" }),
});
