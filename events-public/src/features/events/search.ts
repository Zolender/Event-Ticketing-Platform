// What visitors type, made comparable with the view's search_text, which the database builds with
// lower(unaccent(...)). Both sides drop accents, so "cafe" finds "Café" and "Café" finds "cafe".

export const SEARCH_MIN = 2;
export const SEARCH_MAX = 100;

/** The search as it belongs in the URL: trimmed, spaces collapsed, capped. Null means no search. */
export function normaliseSearch(raw: string | null | undefined) {
  const text = (raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SEARCH_MAX)
    .trim();
  return text.length >= SEARCH_MIN ? text : null;
}

// Letters unaccent rewrites that Unicode decomposition does not.
const LETTERS: Record<string, string> = {
  ø: "o",
  æ: "ae",
  œ: "oe",
  ß: "ss",
  ł: "l",
  đ: "d",
  ð: "d",
  þ: "th",
  ı: "i",
};

export function foldForSearch(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[øæœßłđðþı]/g, (letter) => LETTERS[letter]);
}

/**
 * A "contains" pattern for ilike, where the visitor's %, _ and \ mean themselves. Supabase's API
 * reads * as a wildcard and cannot escape it, so a typed * matches any one character instead.
 */
export function containsPattern(search: string) {
  const escaped = foldForSearch(search)
    .replace(/[\\%_]/g, (c) => `\\${c}`)
    .replaceAll("*", "_");
  return `%${escaped}%`;
}
