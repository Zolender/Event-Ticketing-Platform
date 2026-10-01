import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { decodeCursor } from "@/features/events/cursor";
import { normaliseSearch } from "@/features/events/search";
import { listUpcoming } from "@/features/events/server/events";

// Load more and search, for the list page's TanStack queries: GET /api/events?q=jazz&cursor=...
// Read-only and public, so no cross-site guard is needed; inputs are still checked before any
// of them reaches a database filter.
const Query = z.object({
  q: z.string().max(1000).optional(),
  cursor: z.string().max(100).optional(),
});

export async function GET(request: NextRequest) {
  const query = Query.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  const cursor = query.success ? decodeCursor(query.data.cursor) : null;
  if (!query.success || (query.data.cursor !== undefined && !cursor)) {
    return NextResponse.json(
      {
        code: "bad_request",
        message: "The search or the cursor is not valid.",
      },
      { status: 400 },
    );
  }
  try {
    const page = await listUpcoming({
      search: normaliseSearch(query.data.q),
      cursor,
    });
    return NextResponse.json(page, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { code: "unavailable", message: "Couldn't load events." },
      { status: 503 },
    );
  }
}
