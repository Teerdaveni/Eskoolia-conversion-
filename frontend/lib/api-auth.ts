import { API_BASE_URL } from "@/lib/api";
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from "@/lib/auth";

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearAuthTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  const data = (await res.json()) as { access?: string };
  if (!data.access) {
    clearAuthTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  setAuthTokens(data.access, refresh);
  return data.access;
}

function withAuthHeaders(token: string, headers?: HeadersInit): HeadersInit {
  const base: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (headers && typeof headers === "object" && !Array.isArray(headers)) {
    return { ...base, ...(headers as Record<string, string>) };
  }
  return base;
}

export async function apiRequestWithRefresh<T>(path: string, options?: RequestInit): Promise<T> {
  let token = getAccessToken();
  if (!token) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) throw new Error("401");
    token = refreshed;
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: withAuthHeaders(token, options?.headers),
    cache: options?.cache ?? "no-store",
  });

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) throw new Error("401");

    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: withAuthHeaders(refreshed, options?.headers),
      cache: options?.cache ?? "no-store",
    });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) {
      clearAuthTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    throw new Error(body?.message || body?.detail || String(response.status));
  }

  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}
