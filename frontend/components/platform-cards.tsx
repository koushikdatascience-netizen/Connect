"use client";

import { getOAuthLoginUrl } from "@/lib/api";
import { AccountStatusResponse, PlatformName } from "@/lib/types";

const platforms: Array<{
  key: PlatformName;
  label: string;
  description: string;
}> = [
  {
    key: "facebook",
    label: "Facebook",
    description: "Manage page publishing, engagement flows, and Meta-linked distribution.",
  },
  {
    key: "instagram",
    label: "Instagram",
    description: "Handle visual campaigns, reels, and Instagram professional publishing.",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    description: "Deliver professional updates, company posts, and high-intent social reach.",
  },
  {
    key: "twitter",
    label: "X / Twitter",
    description: "Coordinate fast updates, campaign reactions, and conversational brand posts.",
  },
  {
    key: "youtube",
    label: "YouTube",
    description: "Prepare video publishing workflows using the connected Google channel.",
  },
];

export function PlatformCards({
  accountStatus,
}: {
  accountStatus: AccountStatusResponse;
}) {
  return (
    <div className="grid three">
      {platforms.map((platform) => {
        const state = accountStatus[platform.key];
        const isConnected = state.connected;

        return (
          <article
            key={platform.key}
            className={`platform-card${isConnected ? " connected" : ""}`}
          >
            <div className="platform-head">
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-display), sans-serif",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {platform.label}
                </h3>
                <p className="meta" style={{ margin: "8px 0 0" }}>
                  {platform.description}
                </p>
              </div>
              <span className={`pill${isConnected ? " connected" : ""}`}>
                {isConnected ? "Connected" : "Not connected"}
              </span>
            </div>

            <div className="meta">
              Active workspace accounts: <strong>{state.active_accounts}</strong>
            </div>

            <div className="cta-row">
              <a className="btn primary" href={getOAuthLoginUrl(platform.key)}>
                {isConnected ? "Relink social" : "Link social"}
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}
