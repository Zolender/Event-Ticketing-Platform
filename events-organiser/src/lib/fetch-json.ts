/** Thrown on a 401: the session has ended. `Providers` sends the organiser back to sign-in. */
export class SessionEndedError extends Error {
  constructor() {
    super("The session has ended.");
    this.name = "SessionEndedError";
  }
}

/** A GET from the browser to our own API. */
export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (response.status === 401) throw new SessionEndedError();
  if (!response.ok)
    throw new Error(`Request failed with status ${response.status}.`);
  return response.json() as Promise<T>;
}

/** A refused write: `code` picks the page's wording, `fields` holds per-field messages. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields: Record<string, string> = {},
    readonly suggestion?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * A write from the browser to our own API, always as JSON (the server refuses anything else). No
 * connection at all comes back as an ApiError with the code "offline".
 */
export async function sendJson<T>(
  method: "POST" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers:
        body === undefined
          ? { Accept: "application/json" }
          : { Accept: "application/json", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "offline", "Can't reach Tiketi.");
  }
  if (response.status === 401) throw new SessionEndedError();
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      response.status,
      data.code ?? "unexpected",
      data.message ?? "Something went wrong.",
      data.fields,
      data.suggestion,
    );
  return data as T;
}
