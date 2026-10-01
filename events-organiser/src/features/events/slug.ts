const MAX_LENGTH = 80;

/**
 * The readable part of an event's public URL, made from its title: "Café Noël: Édition 2" becomes
 * "cafe-noel-edition-2". Matches the database's check (lowercase words joined by single hyphens).
 */
export function slugify(title: string) {
  const slug = title
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replaceAll("&", " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LENGTH)
    .replace(/-+$/, "");
  return slug || "event";
}
