import { Account, AccountStatusResponse, MediaAsset, Post } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "tenant_123";
const TOKEN_STORAGE_KEY =
  process.env.NEXT_PUBLIC_AUTH_TOKEN_STORAGE_KEY ?? "snapkey_jwt";
const DEMO_BEARER_TOKEN = process.env.NEXT_PUBLIC_DEBUG_BEARER_TOKEN ?? "";
const TENANT_CLAIMS = ["TenantId", "tenant_id"];

function readJwtClaim(token: string, claim: string) {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded)) as Record<string, unknown>;
    const value = decoded[claim];
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function readTenantClaim(token: string) {
  for (const claim of TENANT_CLAIMS) {
    const value = readJwtClaim(token, claim);
    if (value) {
      return value;
    }
  }
  return null;
}

function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return (
    window.localStorage.getItem(TOKEN_STORAGE_KEY) ||
    window.sessionStorage.getItem(TOKEN_STORAGE_KEY)
  );
}

export function getStoredAuthToken() {
  return getAuthToken();
}

export function hasStoredAuthToken() {
  return Boolean(getAuthToken());
}

export function setStoredAuthToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function clearStoredAuthToken() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getDemoBearerToken() {
  return DEMO_BEARER_TOKEN;
}

function getRuntimeTenantId() {
  const token = getAuthToken();
  if (token) {
    return readTenantClaim(token) ?? TENANT_ID;
  }
  return TENANT_ID;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const tenantId = getRuntimeTenantId();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(!token ? { "X-Tenant-ID": tenantId } : {}),
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text) as { detail?: string; request_id?: string };
      const detail = parsed.detail || `Request failed with ${response.status}`;
      const requestId = parsed.request_id ? ` (Request ID: ${parsed.request_id})` : "";
      throw new Error(`${detail}${requestId}`);
    } catch {
      throw new Error(text || `Request failed with ${response.status}`);
    }
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getTenantId() {
  return getRuntimeTenantId();
}

export function getOAuthLoginUrl(platform: string) {
  const oauthPlatform = platform === "youtube" ? "google" : platform;
  return `${API_BASE_URL}/api/v1/oauth/${oauthPlatform}/login?tenant_id=${getRuntimeTenantId()}`;
}

export async function beginOAuthLogin(platform: string) {
  const oauthPlatform = platform === "youtube" ? "google" : platform;
  const response = await apiFetch<{ authorization_url: string }>(
    `/api/v1/oauth/${oauthPlatform}/authorize`,
  );
  if (typeof window !== "undefined") {
    window.location.href = response.authorization_url;
  }
}

export function fetchAccountStatus() {
  return apiFetch<AccountStatusResponse>("/api/v1/accounts/status");
}

export function fetchAccounts() {
  return apiFetch<Account[]>("/api/v1/accounts/");
}

export function fetchMedia() {
  return apiFetch<MediaAsset[]>("/api/v1/media/");
}

export function uploadMedia(formData: FormData) {
  return apiFetch<MediaAsset>("/api/v1/media/upload", {
    method: "POST",
    body: formData,
  });
}

export function fetchPosts() {
  return apiFetch<Post[]>("/api/v1/posts/");
}

export function createPost(payload: {
  social_account_id: number;
  content: string;
  scheduled_at: string | null;
  media_ids: number[];
  platform_options: Record<string, unknown>;
}) {
  return apiFetch<{ post_id: number; status: string }>("/api/v1/posts/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePost(
  postId: number,
  payload: {
    content?: string;
    scheduled_at?: string | null;
    media_ids?: number[];
    platform_options?: Record<string, unknown>;
  },
) {
  return apiFetch<{ post_id: number; status: string; task_id: string | null }>(
    `/api/v1/posts/${postId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function publishPostNow(postId: number) {
  return apiFetch<{ post_id: number; status: string; task_id: string | null }>(
    `/api/v1/posts/${postId}/publish-now`,
    {
      method: "POST",
    },
  );
}

export function cancelPost(postId: number) {
  return apiFetch<{ post_id: number; status: string; task_id: string | null }>(
    `/api/v1/posts/${postId}/cancel`,
    {
      method: "POST",
    },
  );
}
