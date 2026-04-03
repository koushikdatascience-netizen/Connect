"use client";

import { useEffect, useMemo, useState } from "react";

import { PlatformCards } from "@/components/platform-cards";
import { PostComposerModal } from "@/components/post-composer-modal";
import { fetchAccounts, fetchAccountStatus, getApiBaseUrl, getTenantId } from "@/lib/api";
import { Account, AccountStatusResponse } from "@/lib/types";

const emptyStatus: AccountStatusResponse = {
  facebook: { connected: false, active_accounts: 0 },
  instagram: { connected: false, active_accounts: 0 },
  linkedin: { connected: false, active_accounts: 0 },
  twitter: { connected: false, active_accounts: 0 },
  youtube: { connected: false, active_accounts: 0 },
};

export default function DashboardPage() {
  const [status, setStatus] = useState<AccountStatusResponse>(emptyStatus);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [statusData, accountData] = await Promise.all([
          fetchAccountStatus(),
          fetchAccounts(),
        ]);
        setStatus(statusData);
        setAccounts(accountData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
      }
    }

    void load();
  }, []);

  const stats = useMemo(() => {
    const connectedPlatforms = Object.values(status).filter((item) => item.connected).length;
    const activeAccounts = accounts.filter((account) => account.is_active).length;
    const inactiveAccounts = Math.max(accounts.length - activeAccounts, 0);

    return {
      connectedPlatforms,
      activeAccounts,
      inactiveAccounts,
      totalAccounts: accounts.length,
    };
  }, [accounts, status]);

  return (
    <main className="grid" style={{ gap: 20 }}>
      <section className="card hero-card">
        <div className="hero-panel">
          <div className="brand-kicker">SnapKey CRM module</div>
          <h2 className="section-title" style={{ fontSize: "2.15rem", marginBottom: 12 }}>
            Social publishing dashboard
          </h2>
          <p className="section-copy">
            Connect channels, prepare campaign content, and push scheduled work into execution from
            one SnapKey workspace. Backend: <strong>{getApiBaseUrl()}</strong>. Tenant:{" "}
            <strong>{getTenantId()}</strong>.
          </p>

          <div className="cta-row" style={{ marginBottom: 22 }}>
            <button className="btn primary" onClick={() => setComposerOpen(true)} type="button">
              Create post
            </button>
            <a className="btn secondary" href="/posts">
              View scheduled posts
            </a>
          </div>

          {error ? <div className="banner error">{error}</div> : null}

          <div className="stat-grid">
            <div className="stat">
              <span>Connected platforms</span>
              <strong>{stats.connectedPlatforms}</strong>
            </div>
            <div className="stat">
              <span>Total accounts</span>
              <strong>{stats.totalAccounts}</strong>
            </div>
            <div className="stat">
              <span>Active accounts</span>
              <strong>{stats.activeAccounts}</strong>
            </div>
            <div className="stat">
              <span>Inactive accounts</span>
              <strong>{stats.inactiveAccounts}</strong>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-dots" />
          <div className="hero-window">
            <div className="hero-window-grid">
              <div className="hero-row long" />
              <div className="hero-row mid" />
              <div className="hero-row short" />
              <div className="hero-row long" />
            </div>
            <div className="hero-stamp">Campaigns in motion</div>
          </div>
        </div>
      </section>

      <section className="card section">
        <h2 className="section-title">Channel Connections</h2>
        <p className="section-copy">
          Link each social channel from here. Once connected, each platform becomes available inside
          the create-post modal and can be scheduled from the dashboard.
        </p>
        <PlatformCards accountStatus={status} />
      </section>

      <section className="card section">
        <h2 className="section-title">Workspace Accounts</h2>
        <p className="section-copy">
          A quick operational view of the accounts already stored inside this SnapKey tenant
          workspace.
        </p>
        {accounts.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Platform</th>
                  <th>Platform account ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td>{account.account_name}</td>
                    <td style={{ textTransform: "capitalize" }}>{account.platform}</td>
                    <td>{account.platform_account_id}</td>
                    <td>
                      <span className={`pill${account.is_active ? " connected" : ""}`}>
                        {account.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            No connected accounts yet. Use the cards above to start an OAuth flow.
          </div>
        )}
      </section>

      <PostComposerModal onClose={() => setComposerOpen(false)} open={composerOpen} />
    </main>
  );
}
