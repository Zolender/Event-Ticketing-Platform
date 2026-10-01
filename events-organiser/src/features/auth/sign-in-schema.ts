import { z } from "zod";

// Shared by the form and the route handler, so both check the same thing. One line each.
export const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type SignInInput = z.infer<typeof signInSchema>;
