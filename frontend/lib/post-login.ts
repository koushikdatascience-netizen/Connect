import { fetchAccounts } from "@/lib/api";

const DEFAULT_LOGIN_DESTINATIONS = new Set(["", "/", "/compose", "/create-post", "/post-login"]);

export async function resolvePostLoginPath(nextPath?: string | null) {
  const requestedPath = nextPath || "/post-login";
  if (!DEFAULT_LOGIN_DESTINATIONS.has(requestedPath)) {
    return requestedPath;
  }

  try {
    const accounts = await fetchAccounts();
    return accounts.length > 0 ? "/compose" : "/connections";
  } catch {
    return "/connections";
  }
}
