import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import {
  formatFromPrice,
  formatTime,
  stubDate,
  zoneCity,
} from "@/features/events/format";
import { getPublishedEvent } from "@/features/events/server/events";
import { publicIdFromSegment } from "@/features/events/url";

// The picture a shared link shows: the event page's ticket, drawn at 1200 by 630. Always the
// light colours, since an image cannot follow the viewer's theme. A draft's image is a 404, like
// its page. Cached and refreshed with the page.
export const revalidate = 300;
export const alt = "The event's title, date, time and venue on a Tiketi ticket";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Drawn on the first request for an event, then cached like the page.
export function generateStaticParams() {
  return [];
}

const NAVY = "#1e3a8a";
const ON_NAVY = "#90a8ff";
const PAGE = "#faf8ff";
const PANEL = "#eeedf4";
const INK = "#1a1b21";
const SOFT = "#444651";
const PRIMARY = "#00236f";
const STUB = 300;

const font = (file: string) =>
  readFile(join(process.cwd(), "assets/fonts", file));

export default async function Image({
  params,
}: {
  params: Promise<{ slugId: string }>;
}) {
  const publicId = publicIdFromSegment((await params).slugId);
  const event = publicId ? await getPublishedEvent(publicId) : null;
  if (!event) notFound();

  const date = stubDate(event.startsAt, event.timeZone);
  const titleSize =
    event.title.length > 60 ? 56 : event.title.length > 32 ? 68 : 80;
  const [regular, medium] = await Promise.all([
    font("Roboto-Regular.ttf"),
    font("Roboto-Medium.ttf"),
  ]);

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: 48,
        background: PAGE,
        fontFamily: "Roboto",
      }}
    >
      <div style={{ display: "flex", flex: 1, position: "relative" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "52px 56px",
            background: PANEL,
            borderRadius: "40px 0 0 40px",
            color: INK,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* The Tiketi mark, the same drawing as the favicon. */}
            <svg width="48" height="48" viewBox="0 0 32 32">
              <rect width="32" height="32" rx="8" fill={PRIMARY} />
              <path
                fill="#ffffff"
                d="M6 10.5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2.2a3.3 3.3 0 0 0 0 6.6v2.2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2.2a3.3 3.3 0 0 0 0-6.6z"
              />
              <path
                d="M19.5 10.5v11"
                fill="none"
                stroke={PRIMARY}
                strokeWidth="1.6"
                strokeDasharray="2 2"
                strokeLinecap="round"
              />
            </svg>
            <div style={{ fontSize: 36, color: INK }}>Tiketi</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                display: "block",
                fontSize: titleSize,
                fontWeight: 500,
                lineHeight: 1.08,
                lineClamp: 3,
              }}
            >
              {event.title}
            </div>
            <div style={{ fontSize: 32, color: SOFT }}>
              {`${event.venueName}, ${event.city}`}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: STUB,
            background: NAVY,
            color: ON_NAVY,
            borderRadius: "0 40px 40px 0",
            borderLeft: `6px dashed ${ON_NAVY}`,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: 4 }}>
            {date.weekday.toUpperCase()}
          </div>
          <div style={{ fontSize: 132, lineHeight: 1 }}>{date.day}</div>
          <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: 4 }}>
            {date.monthYear.toUpperCase()}
          </div>
          <div style={{ fontSize: 40, marginTop: 14 }}>
            {formatTime(event.startsAt, event.timeZone)}
          </div>
          <div
            style={{ fontSize: 22 }}
          >{`${zoneCity(event.timeZone)} time`}</div>
          {event.prices && !event.past ? (
            <div style={{ fontSize: 26, marginTop: 10, color: "#ffffff" }}>
              {formatFromPrice(event.prices, event.currency).replace(/ /g, " ")}
            </div>
          ) : null}
        </div>
        {/* The notches: two circles in the page colour where the perforation meets the edges. */}
        <div
          style={{
            position: "absolute",
            top: -20,
            right: STUB - 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            background: PAGE,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -20,
            right: STUB - 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            background: PAGE,
          }}
        />
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Roboto", data: regular, weight: 400, style: "normal" },
        { name: "Roboto", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
