"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  AdminConnectUser,
  approveAdminConnectUser,
  fetchAdminConnectUsers,
  suspendAdminConnectUser,
  updateAdminConnectUserLimits,
} from "@/lib/api";
import { useSessionState } from "@/components/session-state";

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function statusClass(status: string) {
  if (status === "active" || status === "approved_test_user") return "border-[#cce7b0] bg-[#f4fbeb] text-[#51751d]";
  if (status === "blocked") return "border-[#f0c7c0] bg-[#fff4f2] text-[#b54708]";
  return "border-[#ead28a] bg-[#fff8df] text-[#8a6508]";
}

function AdminUserRow({
  user,
  onChange,
}: {
  user: AdminConnectUser;
  onChange: (user: AdminConnectUser, message: string) => void;
}) {
  const [socialLimit, setSocialLimit] = useState(String(user.max_social_accounts));
  const [monthlyLimit, setMonthlyLimit] = useState(String(user.max_monthly_posts));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: () => Promise<{ message: string; user: AdminConnectUser }>) {
    try {
      setBusy(true);
      setError(null);
      const result = await action();
      setSocialLimit(String(result.user.max_social_accounts));
      setMonthlyLimit(String(result.user.max_monthly_posts));
      onChange(result.user, result.message);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveLimits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const maxSocialAccounts = Number(socialLimit);
    const maxMonthlyPosts = Number(monthlyLimit);
    if (!Number.isFinite(maxSocialAccounts) || !Number.isFinite(maxMonthlyPosts)) {
      setError("Limits must be valid numbers.");
      return;
    }
    await runAction(() =>
      updateAdminConnectUserLimits(user.id, {
        max_social_accounts: maxSocialAccounts,
        max_monthly_posts: maxMonthlyPosts,
      }),
    );
  }

  return (
    <article className="rounded-[26px] border border-[#eadfcf] bg-white/82 p-4 shadow-[0_16px_36px_rgba(99,72,16,0.08)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-display text-xl font-semibold tracking-[-0.05em] text-[#171311]">{user.email}</h2>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(user.status)}`}>{user.status}</span>
            {user.is_admin ? <span className="rounded-full border border-[#bfd7ff] bg-[#f4f8ff] px-3 py-1 text-xs font-semibold text-[#2454a6]">Admin</span> : null}
          </div>
          <div className="mt-2 grid gap-1 text-sm text-[#6b5e48] sm:grid-cols-2">
            <span>Phone: {user.phone}</span>
            <span>Email verified: {user.email_verified ? "Yes" : "No"}</span>
            <span>Connected accounts: {user.connected_social_accounts}/{user.max_social_accounts}</span>
            <span>Created: {formatDate(user.created_at)}</span>
          </div>
          <p className="mt-2 truncate text-xs text-[#8a7a5c]">Tenant: {user.tenant_id}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void runAction(() => approveAdminConnectUser(user.id))}
            disabled={busy || user.status === "active"}
            className="rounded-full bg-[#222] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => void runAction(() => suspendAdminConnectUser(user.id))}
            disabled={busy || user.status === "blocked"}
            className="rounded-full border border-[#efc4bc] bg-[#fff4f2] px-4 py-2 text-sm font-semibold text-[#b54708] transition hover:bg-[#ffe9e5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Suspend
          </button>
        </div>
      </div>

      <form className="mt-4 grid gap-3 rounded-[20px] border border-[#efe2bd] bg-[#fffaf0] p-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={saveLimits}>
        <label className="text-sm font-medium text-[#5f533f]">
          Account limit
          <input
            type="number"
            min="0"
            value={socialLimit}
            onChange={(event) => setSocialLimit(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#e6d5a3] bg-white px-3 py-2 text-sm outline-none focus:border-[#c99b18]"
          />
        </label>
        <label className="text-sm font-medium text-[#5f533f]">
          Monthly post limit
          <input
            type="number"
            min="0"
            value={monthlyLimit}
            onChange={(event) => setMonthlyLimit(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#e6d5a3] bg-white px-3 py-2 text-sm outline-none focus:border-[#c99b18]"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="self-end rounded-xl border border-[#d7b64a] bg-[#fff3bf] px-4 py-2 text-sm font-semibold text-[#735407] transition hover:bg-[#ffe99b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save limits
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-[#b54708]">{error}</p> : null}
    </article>
  );
}

export default function AdminUsersPage() {
  const { session } = useSessionState();
  const [users, setUsers] = useState<AdminConnectUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);
      setUsers(await fetchAdminConnectUsers());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.is_admin) {
      void loadUsers();
    } else {
      setLoading(false);
    }
  }, [session?.is_admin]);

  function updateUser(nextUser: AdminConnectUser, message: string) {
    setUsers((current) => current.map((user) => (user.id === nextUser.id ? nextUser : user)));
    setNotice(message);
  }

  if (!session?.is_admin) {
    return (
      <main className="min-h-[calc(100vh-2.5rem)] px-4 py-4 sm:px-5 lg:px-6">
        <section className="rounded-[30px] border border-[#eadfcf] bg-white/80 p-6 shadow-[0_18px_48px_rgba(24,24,24,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a67d10]">Admin</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.06em] text-[#171311]">Admin access required</h1>
          <p className="mt-3 text-sm leading-6 text-[#6b5e48]">Sign in with a Snapkey Connect admin account to manage users and limits.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-2.5rem)] px-4 py-4 sm:px-5 lg:px-6">
      <section className="rounded-[32px] border border-[#eadfcf] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,248,226,0.9))] p-5 shadow-[0_18px_48px_rgba(24,24,24,0.08)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a67d10]">Admin Panel</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-[#171311]">Connect users</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6b5e48]">Approve pending users, suspend access, and increase connected-account or monthly-post limits for paid/approved accounts.</p>
          </div>
          <button type="button" onClick={() => void loadUsers()} className="secondary-button justify-center px-5 py-3 text-sm font-semibold">
            Refresh
          </button>
        </div>

        {notice ? <div className="mt-5 rounded-2xl border border-[#d7e9c0] bg-[#f7fbef] px-4 py-3 text-sm text-[#53722c]">{notice}</div> : null}
        {error ? <div className="mt-5 rounded-2xl border border-[#f0c8c3] bg-[#fff5f3] px-4 py-3 text-sm text-[#b54708]">{error}</div> : null}

        <div className="mt-6 space-y-4">
          {loading ? <div className="rounded-[24px] border border-[#eadfcf] bg-white/75 px-5 py-4 text-sm text-[#6b5e48]">Loading users...</div> : null}
          {!loading && users.length === 0 ? <div className="rounded-[24px] border border-[#eadfcf] bg-white/75 px-5 py-4 text-sm text-[#6b5e48]">No users found.</div> : null}
          {users.map((user) => (
            <AdminUserRow key={user.id} user={user} onChange={updateUser} />
          ))}
        </div>
      </section>
    </main>
  );
}
