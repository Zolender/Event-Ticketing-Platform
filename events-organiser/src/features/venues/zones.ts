// Timezones for venues: the IANA names the runtime knows, under their current names. Node and
// some browsers still list old names ("Asia/Calcutta", "Europe/Kiev"); both forms work everywhere
// (Intl and Postgres alike), but venues are saved and shown under the current one.

const currentNames: Record<string, string> = {
  "Africa/Asmera": "Africa/Asmara",
  "America/Buenos_Aires": "America/Argentina/Buenos_Aires",
  "America/Catamarca": "America/Argentina/Catamarca",
  "America/Cordoba": "America/Argentina/Cordoba",
  "America/Godthab": "America/Nuuk",
  "America/Indianapolis": "America/Indiana/Indianapolis",
  "America/Jujuy": "America/Argentina/Jujuy",
  "America/Louisville": "America/Kentucky/Louisville",
  "America/Mendoza": "America/Argentina/Mendoza",
  "Asia/Calcutta": "Asia/Kolkata",
  "Asia/Katmandu": "Asia/Kathmandu",
  "Asia/Rangoon": "Asia/Yangon",
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
  "Atlantic/Faeroe": "Atlantic/Faroe",
  "Europe/Kiev": "Europe/Kyiv",
  "Pacific/Enderbury": "Pacific/Kanton",
};

export function currentZoneName(zone: string) {
  return currentNames[zone] ?? zone;
}

/** Any zone the runtime can format with; the database checks again against its own list. */
export function isZone(zone: string) {
  if (!zone.includes("/")) return false;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

let cached: string[] | undefined;

/** Every zone, current names, sorted. */
export function allZones() {
  cached ??= [
    ...new Set(Intl.supportedValuesOf("timeZone").map(currentZoneName)),
  ]
    .filter((zone) => zone.includes("/"))
    .sort();
  return cached;
}

/** "America/Argentina/Buenos_Aires" reads "Buenos Aires". */
export function zoneCity(zone: string) {
  return (zone.split("/").pop() ?? zone).replaceAll("_", " ");
}

/** "Africa", "America", "Europe"... */
export function zoneRegion(zone: string) {
  return zone.split("/")[0];
}

/** Matches "nai", "kigali", "new york", "america/new" alike. */
export function zoneMatches(zone: string, query: string) {
  const q = query.trim().toLowerCase().replaceAll(" ", "_");
  if (!q) return true;
  return zone.toLowerCase().includes(q);
}

// Countries with a single zone suggest it when a new venue's country is typed. Countries with
// several are listed with null: the organiser chooses. Others suggest nothing.
const countryZones: Record<string, string | null> = {
  rwanda: "Africa/Kigali",
  kenya: "Africa/Nairobi",
  uganda: "Africa/Kampala",
  tanzania: "Africa/Dar_es_Salaam",
  burundi: "Africa/Bujumbura",
  ethiopia: "Africa/Addis_Ababa",
  nigeria: "Africa/Lagos",
  ghana: "Africa/Accra",
  "south africa": "Africa/Johannesburg",
  egypt: "Africa/Cairo",
  morocco: "Africa/Casablanca",
  senegal: "Africa/Dakar",
  "united kingdom": "Europe/London",
  uk: "Europe/London",
  ireland: "Europe/Dublin",
  france: "Europe/Paris",
  belgium: "Europe/Brussels",
  netherlands: "Europe/Amsterdam",
  germany: "Europe/Berlin",
  italy: "Europe/Rome",
  india: "Asia/Kolkata",
  japan: "Asia/Tokyo",
  "united arab emirates": "Asia/Dubai",
  uae: "Asia/Dubai",
  "democratic republic of the congo": null,
  "dr congo": null,
  drc: null,
  "united states": null,
  "united states of america": null,
  usa: null,
  us: null,
  canada: null,
  brazil: null,
  australia: null,
  russia: null,
  mexico: null,
  spain: null,
  indonesia: null,
};

export type ZoneSuggestion =
  { kind: "one"; zone: string } | { kind: "several" } | { kind: "none" };

export function suggestZone(country: string): ZoneSuggestion {
  const key = country.trim().toLowerCase();
  if (!(key in countryZones)) return { kind: "none" };
  const zone = countryZones[key];
  return zone ? { kind: "one", zone } : { kind: "several" };
}
