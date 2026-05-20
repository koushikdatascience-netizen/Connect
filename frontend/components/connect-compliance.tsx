"use client";

export function ConnectComplianceBanner() {
  return (
    <section className="mb-4 rounded-[28px] border border-[#e5d4b8] bg-[linear-gradient(120deg,rgba(255,252,244,0.98),rgba(255,245,225,0.96))] px-5 py-5 shadow-[0_14px_32px_rgba(100,76,18,0.08)] sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8e6a09]">
            Snapkey Connect
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.05em] text-[#171311] sm:text-3xl">
            Snapkey Connect is a social media management module within Snapkey CRM.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#615541] sm:text-[15px]">
            Users can securely connect supported social media accounts, create content, schedule posts, and manage publishing workflows using official platform integrations.
          </p>
        </div>
        <div className="inline-flex self-start rounded-full border border-[#e2ca80] bg-[#fff2c7] px-3 py-2 text-xs font-semibold text-[#7f630f]">
          Accessible to authorized Snapkey CRM users.
        </div>
      </div>
    </section>
  );
}

export function ConnectComplianceFooter() {
  return (
    <footer className="mt-4 rounded-[26px] border border-[#e8dbc5] bg-[linear-gradient(180deg,rgba(255,252,245,0.98),rgba(247,241,230,0.96))] px-5 py-5 shadow-[0_10px_24px_rgba(108,84,24,0.06)] sm:px-6">
      <p className="text-sm leading-6 text-[#5f533f]">
        Snapkey Connect is a module of Snapkey CRM. All data handling, permissions, and user privacy are governed by Snapkey&apos;s central privacy policy.
      </p>
      <p className="mt-2 text-sm leading-6 text-[#5f533f]">
        Snapkey uses official platform APIs and operates in compliance with Facebook and Instagram platform policies. All publishing actions are initiated and controlled by the user.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium">
        <a
          href="https://snapkey.in/privacy-policy/"
          target="_blank"
          rel="noreferrer"
          className="text-[#8a6516] transition-colors hover:text-[#5e4306]"
        >
          Privacy Policy
        </a>
        <a
          href="https://snapkey.in/terms-and-conditions/"
          target="_blank"
          rel="noreferrer"
          className="text-[#8a6516] transition-colors hover:text-[#5e4306]"
        >
          Terms &amp; Conditions
        </a>
        <a
          href="https://snapkey.in/data-deletion-request/"
          target="_blank"
          rel="noreferrer"
          className="text-[#8a6516] transition-colors hover:text-[#5e4306]"
        >
          Data Deletion Request
        </a>
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[#8c7f68]">
        Snapkey CRM by ABM Techno-Matrix Private Limited
      </p>
    </footer>
  );
}
