/** A GET from the browser to this site's own API. */
export async function fetchJson<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok)
    throw new Error(`Request failed with status ${response.status}.`);
  return response.json() as Promise<T>;
}
