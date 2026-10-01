// Seeds organisers, venues, events and tiers through Supabase's APIs. Works on the local stack and
// on the hosted project; nothing secret lives in this file.
//
//   SUPABASE_URL=... SUPABASE_SECRET_KEY=... SEED_PASSWORD=... node supabase/seed/seed.mjs
//
// Re-runnable: the seeded organisers keep their accounts, their events and venues are recreated.

const url = requireEnv("SUPABASE_URL").replace(/\/$/, "");
const secretKey = requireEnv("SUPABASE_SECRET_KEY");
const password = requireEnv("SEED_PASSWORD");

const DAY = 24 * 60 * 60 * 1000;

const organisers = [
  {
    email: "kigali.live@example.com",
    displayName: "Kigali Live Collective",
    venues: [
      {
        key: "nyarutarama",
        name: "Nyarutarama Open Air Stage",
        address: "KG 9 Ave",
        city: "Kigali",
        country: "Rwanda",
        timezone: "Africa/Kigali",
      },
      {
        key: "kimihurura",
        name: "Kimihurura Jazz Lounge",
        address: "KG 5 Ave",
        city: "Kigali",
        country: "Rwanda",
        timezone: "Africa/Kigali",
      },
    ],
    events: [
      {
        title: "Kigali Jazz Night",
        venue: "kimihurura",
        inDays: 12,
        at: "19:30",
        currency: "RWF",
        state: "published",
        description:
          "An evening of live jazz with the house quartet and guest vocalists from across the region. Doors open an hour before the first set; food and drinks are served all night.",
        tiers: [
          { name: "Regular", price: 10000, capacity: 200 },
          { name: "VIP", price: 30000, capacity: 40 },
          { name: "Table for four", price: 100000, capacity: 10 },
        ],
      },
      {
        title: "Afrobeat Sundowner",
        venue: "nyarutarama",
        inDays: 20,
        at: "16:00",
        currency: "RWF",
        state: "published",
        description:
          "Afrobeat and amapiano under the open sky, from late afternoon until the stars come out. Three DJs, one live band and a view over the hills.",
        tiers: [
          { name: "Early bird", price: 8000, capacity: 150 },
          { name: "Regular", price: 12000, capacity: 600 },
        ],
      },
      {
        title: "Acoustic Evenings Vol. 2",
        venue: "kimihurura",
        inDays: 40,
        at: "18:00",
        currency: "RWF",
        state: "draft",
        description: null,
        tiers: [],
      },
      {
        title: "Old Year Party",
        venue: "nyarutarama",
        inDays: 60,
        at: "21:00",
        currency: "RWF",
        state: "unpublished",
        description:
          "Seeing the year out with live music and a midnight countdown. Postponed while the line-up is confirmed.",
        tiers: [{ name: "Regular", price: 15000, capacity: 800 }],
      },
    ],
  },
  {
    email: "ubumuntu.arts@example.com",
    displayName: "Ubumuntu Arts",
    venues: [
      {
        key: "remera",
        name: "Remera Arts Centre",
        address: "KN 5 Rd",
        city: "Kigali",
        country: "Rwanda",
        timezone: "Africa/Kigali",
      },
      {
        key: "gisozi",
        name: "Gisozi Community Hall",
        address: "KG 14 Ave",
        city: "Kigali",
        country: "Rwanda",
        timezone: "Africa/Kigali",
      },
    ],
    events: [
      {
        title: "Contemporary Dance Showcase",
        venue: "remera",
        inDays: 9,
        at: "18:30",
        currency: "RWF",
        state: "published",
        description:
          "Six young companies present new contemporary work rooted in Rwandan movement traditions. The evening ends with a conversation with the choreographers.",
        tiers: [
          { name: "Student", price: 3000, capacity: 80 },
          { name: "Regular", price: 7000, capacity: 220 },
        ],
      },
      {
        title: "Poetry and Strings",
        venue: "gisozi",
        inDays: null,
        at: null,
        currency: "RWF",
        state: "past",
        description:
          "Spoken word in Kinyarwanda, English and French, accompanied by an inanga and a string trio. A gathering for words and the music around them.",
        tiers: [{ name: "Regular", price: 5000, capacity: 120 }],
      },
      {
        title: "Youth Theatre Festival",
        venue: "remera",
        inDays: 45,
        at: "10:00",
        currency: "RWF",
        state: "draft",
        description:
          "Three days of plays written and performed by secondary school students.",
        tiers: [{ name: "Day pass", price: 2000, capacity: 300 }],
      },
    ],
  },
  {
    email: "thames.kigali@example.com",
    displayName: "Thames and Kigali Events",
    venues: [
      {
        key: "riverside",
        name: "Riverside Hall",
        address: "12 Wharf Road",
        city: "London",
        country: "United Kingdom",
        timezone: "Europe/London",
      },
      {
        key: "kacyiru",
        name: "Kacyiru Rooftop",
        address: "KG 7 Ave",
        city: "Kigali",
        country: "Rwanda",
        timezone: "Africa/Kigali",
      },
    ],
    events: [
      {
        title: "Kigali Sounds in London",
        venue: "riverside",
        inDays: 30,
        at: "19:00",
        currency: "GBP",
        state: "published",
        description:
          "Rwandan artists on a London stage for one night: contemporary Rwandan pop, traditional drumming and a closing set from a Kigali DJ.",
        tiers: [
          { name: "Standing", price: 2500, capacity: 400 },
          { name: "Balcony seat", price: 4000, capacity: 120 },
        ],
      },
      {
        title: "Rooftop Film Night",
        venue: "kacyiru",
        inDays: 6,
        at: "19:00",
        currency: "RWF",
        state: "published",
        description:
          "Classic African cinema projected under the sky, with blankets, popcorn and a short introduction to each film.",
        tiers: [{ name: "Regular", price: 6000, capacity: 90 }],
      },
      {
        title: "Winter Market Fundraiser",
        venue: "riverside",
        inDays: 70,
        at: "11:00",
        currency: "GBP",
        state: "draft",
        description: null,
        tiers: [],
      },
    ],
  },
];

for (const organiser of organisers) {
  const userId = await upsertUser(organiser);
  await rest("DELETE", `events?organiser_id=eq.${userId}`);
  await rest("DELETE", `venues?organiser_id=eq.${userId}`);

  const venueIds = {};
  for (const { key, ...venue } of organiser.venues) {
    const [row] = await rest("POST", "venues", { ...venue, organiser_id: userId });
    venueIds[key] = { id: row.id, timezone: venue.timezone };
  }

  for (const event of organiser.events) {
    await createEvent(userId, venueIds[event.venue], event);
  }
  console.log(`Seeded ${organiser.displayName} (${organiser.email})`);
}

async function createEvent(organiserId, venue, event) {
  // A past published event can only become past with time: the rules refuse publishing in the
  // past, so it is published a few seconds ahead and allowed to pass.
  const startsAt =
    event.state === "past"
      ? new Date(Date.now() + 5000).toISOString()
      : zonedToUtc(event.inDays, event.at, venue.timezone);

  const [row] = await rest("POST", "events", {
    organiser_id: organiserId,
    venue_id: venue.id,
    title: event.title,
    slug: slugify(event.title),
    description: event.description,
    starts_at: startsAt,
    currency: event.currency,
  });

  if (event.tiers.length > 0) {
    await rest(
      "POST",
      "ticket_tiers",
      event.tiers.map((tier, position) => ({ ...tier, position, event_id: row.id })),
    );
  }

  if (event.state === "draft") return;
  await rest("PATCH", `events?id=eq.${row.id}`, { status: "published" });
  if (event.state === "unpublished") {
    await rest("PATCH", `events?id=eq.${row.id}`, { status: "draft" });
  }
  if (event.state === "past") {
    await new Promise((resolve) => setTimeout(resolve, 6000));
  }
}

async function upsertUser({ email, displayName }) {
  const { users } = await auth("GET", "admin/users?per_page=1000");
  const existing = users.find((user) => user.email === email);
  const body = { password, email_confirm: true, user_metadata: { display_name: displayName } };

  if (existing) {
    await auth("PUT", `admin/users/${existing.id}`, body);
    await rest("PATCH", `organisers?id=eq.${existing.id}`, { display_name: displayName });
    return existing.id;
  }
  const created = await auth("POST", "admin/users", { ...body, email });
  return created.id;
}

// "in N days at HH:MM" on the venue's wall clock, as a UTC instant.
function zonedToUtc(inDays, at, timeZone) {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(Date.now() + inDays * DAY));
  const wallClock = Date.parse(`${day}T${at}:00Z`);
  // The zone's offset at that moment, read back through Intl; twice, in case the first guess
  // lands on the other side of a daylight saving change.
  let utc = wallClock - offsetOf(wallClock, timeZone);
  utc = wallClock - offsetOf(utc, timeZone);
  return new Date(utc).toISOString();
}

function offsetOf(instant, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(instant))
      .map(({ type, value }) => [type, value]),
  );
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

function slugify(title) {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function auth(method, path, body) {
  return call(method, `${url}/auth/v1/${path}`, body);
}

async function rest(method, path, body) {
  return call(method, `${url}/rest/v1/${path}`, body, { Prefer: "return=representation" });
}

async function call(method, target, body, headers = {}) {
  const response = await fetch(target, {
    method,
    headers: { apikey: secretKey, "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${target} failed (${response.status}): ${text}`);
  return text ? JSON.parse(text) : null;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}; see the comment at the top of this file.`);
  return value;
}
