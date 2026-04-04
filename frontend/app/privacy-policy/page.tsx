export default function PrivacyPolicyPage() {
  return (
    <main className="card section legal-page">
      <div className="legal-header">
        <div className="brand-kicker">SnapKey CRM</div>
        <h2 className="section-title">Privacy Policy</h2>
        <p className="section-copy">
          This Privacy Policy explains how the SnapKey Social Publishing module collects, uses, and
          protects information when workspace users connect social accounts, upload media, and
          schedule posts.
        </p>
        <p className="helper-text">Last updated: April 4, 2026</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h3>1. Information We Collect</h3>
          <p>
            We may collect account identifiers, social platform account names, OAuth access tokens,
            media metadata, scheduled post content, and basic operational logs needed to connect,
            manage, and publish social content.
          </p>
        </section>

        <section className="legal-section">
          <h3>2. How We Use Information</h3>
          <p>We use this information to:</p>
          <ul>
            <li>connect user-authorized social media accounts</li>
            <li>store and schedule social publishing tasks</li>
            <li>upload and attach media to planned content</li>
            <li>track publishing status, errors, and operational activity</li>
            <li>support tenant-based workspace separation and security</li>
          </ul>
        </section>

        <section className="legal-section">
          <h3>3. OAuth and Social Platform Access</h3>
          <p>
            When a user chooses to connect a social account, the application uses the relevant
            platform OAuth flow to obtain the access required for approved publishing and account
            management actions. We only use the scopes necessary for configured social publishing
            features.
          </p>
        </section>

        <section className="legal-section">
          <h3>4. Token and Credential Storage</h3>
          <p>
            Access tokens and refresh tokens are stored in encrypted form where supported by the
            application. Tokens are used only for account connection, publishing, and status
            synchronization related to the user’s authorized workspace.
          </p>
        </section>

        <section className="legal-section">
          <h3>5. Tenant and Workspace Isolation</h3>
          <p>
            SnapKey Social Publishing uses tenant-scoped access controls and database isolation so
            that one workspace cannot access another workspace’s connected accounts, media, or post
            records.
          </p>
        </section>

        <section className="legal-section">
          <h3>6. Data Retention</h3>
          <p>
            We retain connected account records, media references, and scheduled post history for
            operational use, troubleshooting, and audit purposes, subject to workspace retention
            decisions and platform limitations.
          </p>
        </section>

        <section className="legal-section">
          <h3>7. Data Sharing</h3>
          <p>
            We do not sell personal information. Data may be shared only with the connected social
            platforms, hosting providers, storage providers, and service components necessary to
            operate the publishing workflow.
          </p>
        </section>

        <section className="legal-section">
          <h3>8. Security</h3>
          <p>
            We use reasonable administrative and technical measures to protect user data, including
            authentication controls, encrypted token handling, access restrictions, and operational
            logging.
          </p>
        </section>

        <section className="legal-section">
          <h3>9. User Choices</h3>
          <p>
            Users may disconnect linked social accounts, remove scheduled content, and request
            workspace-specific data cleanup through the responsible SnapKey team or support contact.
          </p>
        </section>

        <section className="legal-section">
          <h3>10. Contact</h3>
          <p>
            For privacy-related questions, contact the SnapKey team or the application administrator
            responsible for the connected workspace environment.
          </p>
        </section>
      </div>
    </main>
  );
}
