// The organiser's appearance choices, kept in cookies so the server renders the right colours on
// the first paint (no flash). "system" is the absence of a choice: the device decides.

export const THEME_COOKIE = "theme";
export const CONTRAST_COOKIE = "contrast";
export const ONE_YEAR = 60 * 60 * 24 * 365;

export type Theme = "system" | "light" | "dark";
export type Contrast = "standard" | "high";

export const parseTheme = (value: string | undefined): Theme =>
  value === "light" || value === "dark" ? value : "system";

export const parseContrast = (value: string | undefined): Contrast =>
  value === "high" ? "high" : "standard";
