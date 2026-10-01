import { z } from "zod";

// Shared by the account forms and the route handlers. One line each, worded as the fix.

export const NAME_MAX = 100;

export const nameSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter the name the public will see.")
    .max(NAME_MAX, "Keep it to 100 characters."),
});

// Supabase is set to at least 8 characters; bcrypt reads only the first 72 bytes.
export const passwordSchema = z.object({
  current: z.string().min(1, "Enter your current password."),
  next: z
    .string()
    .min(8, "At least 8 characters.")
    .max(72, "Keep it to 72 characters."),
});
