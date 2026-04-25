"use client";

import { getReadableError } from "@/lib/error-utils";

type Props = {
  error: string | null | undefined;
  fallback?: string;
  compact?: boolean;
};

export function ErrorNotice({ error, fallback, compact = false }: Props) {
  if (!error) {
    return null;
  }

  const normalized = getReadableError(error, { fallback });

  return (
    <div className="rounded-2xl border border-[#4a2a2d] bg-[#1d1114] px-4 py-3 text-[#f0a4a1] shadow-[0_12px_28px_rgba(0,0,0,0.22)]">
      <div className={`flex items-start gap-3 ${compact ? "text-xs" : "text-sm"}`}>
        <span className="mt-0.5 text-base">!</span>
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-6">{normalized.summary}</p>
          {normalized.details && normalized.details !== normalized.summary ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium text-[#f5c2bf] hover:text-[#ffe0dd]">
                See logs
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-xl border border-[#33202a] bg-[#130c10] p-3 text-[11px] leading-5 text-[#f0bebc] whitespace-pre-wrap break-words">
                {normalized.details}
              </pre>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}
