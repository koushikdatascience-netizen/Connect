"use client";

import { createContext, useContext } from "react";

export type SessionState = {
  authenticated: boolean;
  tenant_id?: string;
  user_id?: string;
  role?: string | null;
  is_admin?: boolean;
  status?: string | null;
  email_verified?: boolean | null;
};

type SessionStateContextValue = {
  ready: boolean;
  session: SessionState | null;
  isPendingApproval: boolean;
};

export const SessionStateContext = createContext<SessionStateContextValue>({
  ready: false,
  session: null,
  isPendingApproval: false,
});

export function useSessionState() {
  return useContext(SessionStateContext);
}

export function PendingApprovalBanner({ compact = false }: { compact?: boolean }) {
  const { isPendingApproval } = useSessionState();

  if (!isPendingApproval) {
    return null;
  }

  return (
    <div
      className={`rounded-[24px] border border-[#e8c88b] bg-[#fff8e1] text-[#8a6116] shadow-[0_10px_24px_rgba(180,144,34,0.08)] ${
        compact ? "px-4 py-3 text-sm" : "px-5 py-4 text-sm"
      }`}
    >
      <p className="font-semibold">Your account is pending approval.</p>
      <p className="mt-1 leading-6">
        Connections and publishing unlock after Snapkey CRM approval.
      </p>
    </div>
  );
}
