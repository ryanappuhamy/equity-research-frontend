// Typed fetch layer for the FastAPI backend.
//
// Render free tier sleeps after 15 min of inactivity and the first request can
// take 50+ seconds to cold-start. So: long timeout + a couple of retries, and a
// warmUp() ping fired on app load to wake the server before the user acts.

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://equity-research-platform-ryanappuhamy.onrender.com";

const DEFAULT_TIMEOUT_MS = 90_000;
const RETRIES = 2;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function once<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        detail = body?.detail ?? body?.note ?? detail;
      } catch {
        // non-JSON error body
      }
      throw new ApiError(detail, res.status);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number; retries?: number } = {},
): Promise<T> {
  const retries = init.retries ?? RETRIES;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await once<T>(path, init);
    } catch (err) {
      lastError = err;
      // Do not retry real client/server errors (4xx); only network/timeout/5xx.
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) throw err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

let warmed = false;
// Wake the Render dyno without blocking the UI. Safe to call repeatedly.
export async function warmUp(): Promise<void> {
  if (warmed) return;
  warmed = true;
  try {
    await fetch(`${API_BASE}/docs`, { method: "GET", mode: "no-cors" });
  } catch {
    warmed = false; // allow a later retry if it failed
  }
}
