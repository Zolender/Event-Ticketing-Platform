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
