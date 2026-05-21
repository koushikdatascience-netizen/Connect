import {
  Account,
  AccountStatusResponse,
  AnalyticsHeatmapCell,
  AnalyticsOverviewResponse,
  AnalyticsPlatformBreakdownItem,
  AnalyticsSyncResponse,
  AnalyticsTimeseriesResponse,
  AnalyticsTopPostItem,
  AnalyticsWordCloudItem,
  MediaAsset,
  Post,
  PostLiveMetricsResponse,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
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
    credentials: "include",
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

function buildAnalyticsQuery(params?: {
  startDate?: string;
  endDate?: string;
  platforms?: string[];
  socialAccountId?: number | null;
  postId?: number | null;
  limit?: number | null;
}) {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set("start_date", params.startDate);
  if (params?.endDate) searchParams.set("end_date", params.endDate);
  if (params?.platforms?.length) searchParams.set("platforms", params.platforms.join(","));
  if (params?.socialAccountId) searchParams.set("social_account_id", String(params.socialAccountId));
  if (params?.postId) searchParams.set("post_id", String(params.postId));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function fetchSession() {
  return apiFetch<{
    authenticated: boolean;
    tenant_id: string;
    user_id: string;
    role?: string | null;
    is_admin: boolean;
  }>("/api/v1/auth/session");
}

export function exchangeWebviewCode(code: string) {
  return apiFetch<{
    authenticated: boolean;
    tenant_id: string;
    user_id: string;
    role?: string | null;
    is_admin: boolean;
  }>("/api/v1/auth/webview/exchange", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function logoutSession() {
  return apiFetch<null>("/api/v1/auth/logout", {
    method: "POST",
  });
}

export function getOAuthLoginUrl(platform: string) {
  const oauthPlatform = platform === "youtube" ? "google" : platform;
  return `${API_BASE_URL}/api/v1/oauth/${oauthPlatform}/login?tenant_id=${getRuntimeTenantId()}`;
}

export async function beginOAuthLogin(
  platform: string,
  options?: { addAnother?: boolean; openInNewTab?: boolean },
) {
  const oauthPlatform = platform === "youtube" ? "google" : platform;
  const addAnother = options?.addAnother ? "true" : "false";
  let authTab: Window | null = null;

  if (typeof window !== "undefined" && options?.openInNewTab) {
    authTab = window.open("", "_blank");
    if (!authTab) {
      throw new Error("Popup or tab opening was blocked by the browser. Please allow popups for this site and try again.");
    }
    authTab.document.write("<title>Connecting account...</title><p style=\"font-family: sans-serif; padding: 24px;\">Redirecting to the provider login...</p>");
  }

  const response = await apiFetch<{ authorization_url: string }>(
    `/api/v1/oauth/${oauthPlatform}/authorize?add_another=${addAnother}`,
  );
  if (typeof window !== "undefined") {
    if (options?.openInNewTab) {
      if (!authTab || authTab.closed) {
        throw new Error("The authentication tab was closed before the login flow could start.");
      }
      authTab.location.href = response.authorization_url;
      return;
    }
    window.location.href = response.authorization_url;
  }
}

export function registerConnectUser(payload: {
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}) {
  return apiFetch<{ message: string; status: string }>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginConnectUser(payload: { email: string; password: string }) {
  return apiFetch<{
    token: string;
    authenticated: boolean;
    tenant_id: string;
    user_id: string;
    status: string;
  }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyConnectEmail(token: string) {
  return apiFetch<{ message: string; status: string }>("/api/v1/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function requestPasswordReset(email: string) {
  return apiFetch<{ message: string }>("/api/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetConnectPassword(payload: {
  token: string;
  password: string;
  confirm_password: string;
}) {
  return apiFetch<{ message: string }>("/api/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function connectWordpressSite(payload: {
  site_url: string;
  username: string;
  application_password: string;
  account_name?: string | null;
}) {
  return apiFetch<Account>("/api/v1/accounts/wordpress/connect", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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

export function fetchPostMetrics(postId: number) {
  return apiFetch<PostLiveMetricsResponse>(`/api/v1/posts/${postId}/metrics`);
}

export function fetchAnalyticsOverview(params?: {
  startDate?: string;
  endDate?: string;
  platforms?: string[];
  socialAccountId?: number | null;
  postId?: number | null;
}) {
  return apiFetch<AnalyticsOverviewResponse>(`/api/v1/analytics/overview${buildAnalyticsQuery(params)}`);
}

export function fetchAnalyticsTimeseries(params?: {
  startDate?: string;
  endDate?: string;
  platforms?: string[];
  socialAccountId?: number | null;
  postId?: number | null;
}) {
  return apiFetch<AnalyticsTimeseriesResponse>(`/api/v1/analytics/timeseries${buildAnalyticsQuery(params)}`);
}

export function fetchAnalyticsPlatformBreakdown(params?: {
  startDate?: string;
  endDate?: string;
  platforms?: string[];
  socialAccountId?: number | null;
}) {
  return apiFetch<AnalyticsPlatformBreakdownItem[]>(`/api/v1/analytics/platform-breakdown${buildAnalyticsQuery(params)}`);
}

export function fetchAnalyticsTopPosts(params?: {
  startDate?: string;
  endDate?: string;
  platforms?: string[];
  limit?: number | null;
}) {
  return apiFetch<AnalyticsTopPostItem[]>(`/api/v1/analytics/top-posts${buildAnalyticsQuery(params)}`);
}

export function fetchAnalyticsHeatmap(params?: {
  startDate?: string;
  endDate?: string;
  platforms?: string[];
}) {
  return apiFetch<AnalyticsHeatmapCell[]>(`/api/v1/analytics/heatmap/posting-times${buildAnalyticsQuery(params)}`);
}

export function fetchAnalyticsTopics(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number | null;
}) {
  return apiFetch<AnalyticsWordCloudItem[]>(`/api/v1/analytics/topics${buildAnalyticsQuery(params)}`);
}

export function syncAnalyticsSnapshots(platforms?: string[]) {
  const query = buildAnalyticsQuery({ platforms });
  return apiFetch<AnalyticsSyncResponse>(`/api/v1/analytics/sync${query}`, {
    method: "POST",
  });
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

export async function deletePost(postId: number) {
  return apiFetch<{ post_id: number; local_deleted: boolean; remote_deleted: boolean; message: string }>(`/api/v1/posts/${postId}`, {
    method: "DELETE",
  });
}

export function processOverduePosts() {
  return apiFetch<{ message: string; processed_posts: Array<{ post_id: number; status: string; task_id: string | null }> }>(
    "/api/v1/posts/process-overdue",
    {
      method: "POST",
    },
  );
}


export function deactivateAccount(accountId: number) {
  return apiFetch<{ id: number; is_active: boolean }>(
    `/api/v1/accounts/${accountId}/deactivate`,
    { method: "POST" },
  );
}

export async function deleteAccount(accountId: number) {
  await apiFetch<null>(`/api/v1/accounts/${accountId}`, {
    method: "DELETE",
  });
}
