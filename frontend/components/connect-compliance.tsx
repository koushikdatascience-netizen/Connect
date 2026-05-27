"use client";

export function ConnectComplianceFooter() {
  return (
    <footer className="mt-4 rounded-[18px] border border-[#e8dbc5] bg-[#fffdf8] px-4 py-3 text-xs text-[#6a5e49] shadow-[0_8px_18px_rgba(108,84,24,0.04)] sm:px-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-5">
          Snapkey Connect is part of Snapkey CRM and uses official platform authorization flows.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
          <a
            href="https://crm.snapkey.in"
            target="_blank"
            rel="noreferrer"
            className="text-[#8a6516] transition-colors hover:text-[#5e4306]"
          >
            CRM
          </a>
          <a
            href="https://snapkey.in"
            target="_blank"
            rel="noreferrer"
            className="text-[#8a6516] transition-colors hover:text-[#5e4306]"
          >
            Website
          </a>
          <a
            href="https://snapkey.in/privacy-policy/"
            target="_blank"
            rel="noreferrer"
            className="text-[#8a6516] transition-colors hover:text-[#5e4306]"
          >
            Privacy
          </a>
          <a
            href="https://snapkey.in/terms-and-conditions/"
            target="_blank"
            rel="noreferrer"
            className="text-[#8a6516] transition-colors hover:text-[#5e4306]"
          >
            Terms
          </a>
          <a
            href="https://snapkey.in/data-deletion-request/"
            target="_blank"
            rel="noreferrer"
            className="text-[#8a6516] transition-colors hover:text-[#5e4306]"
          >
            Data deletion
          </a>
        </div>
      </div>
    </footer>
  );
}
