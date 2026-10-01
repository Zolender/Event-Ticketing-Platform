import { z } from "zod";
import { currentZoneName, isZone } from "./zones";

// Shared by the forms and the route handlers, so both check the same thing. The limits are the
// database's own checks. One line each, worded as the fix.
export const venueSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter the venue name.")
    .max(200, "Keep it to 200 characters."),
  address: z
    .string()
    .trim()
    .min(1, "Enter the address.")
    .max(300, "Keep it to 300 characters."),
  city: z
    .string()
    .trim()
    .min(1, "Enter the city.")
    .max(100, "Keep it to 100 characters."),
  country: z
    .string()
    .trim()
    .min(1, "Enter the country.")
    .max(100, "Keep it to 100 characters."),
  timezone: z
    .string()
    .refine(isZone, "Choose the venue's timezone.")
    .transform(currentZoneName),
});

export type VenueInput = z.input<typeof venueSchema>;
export type VenueFields = z.output<typeof venueSchema>;
