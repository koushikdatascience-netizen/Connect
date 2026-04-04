export default function TermsPage() {
  return (
    <main className="card section legal-page">
      <div className="legal-header">
        <div className="brand-kicker">SnapKey CRM</div>
        <h2 className="section-title">Terms &amp; Conditions</h2>
        <p className="section-copy">
          These Terms &amp; Conditions govern the use of the SnapKey Social Publishing module for
          connecting social accounts, managing media, scheduling posts, and monitoring publishing
          activity.
        </p>
        <p className="helper-text">Last updated: April 4, 2026</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h3>1. Acceptance of Terms</h3>
          <p>
            By using this service, users agree to follow these terms and to use the platform only
            for lawful and authorized social publishing activity.
          </p>
        </section>

        <section className="legal-section">
          <h3>2. Authorized Use</h3>
          <p>Users may use the application to:</p>
          <ul>
            <li>connect social accounts they are authorized to manage</li>
            <li>prepare, upload, schedule, and publish permitted content</li>
            <li>review publishing history, status, and operational errors</li>
          </ul>
        </section>

        <section className="legal-section">
          <h3>3. User Responsibilities</h3>
          <p>Users are responsible for:</p>
          <ul>
            <li>ensuring they have the right to manage connected accounts</li>
            <li>complying with social platform rules and API usage policies</li>
            <li>ensuring posted content is lawful and appropriate</li>
            <li>keeping access credentials and workspace access secure</li>
          </ul>
        </section>

        <section className="legal-section">
          <h3>4. Platform Integrations</h3>
          <p>
            Social platform connectivity depends on third-party APIs and their availability,
            permissions, review processes, and policy changes. Some features may be limited or
            unavailable depending on provider approval and account eligibility.
          </p>
        </section>

        <section className="legal-section">
          <h3>5. Content Responsibility</h3>
          <p>
            Users remain solely responsible for all content they upload, schedule, or publish
            through the service. The platform does not assume ownership of user-generated content.
          </p>
        </section>

        <section className="legal-section">
          <h3>6. Availability and Changes</h3>
          <p>
            The service may be updated, changed, limited, or temporarily interrupted as features,
            infrastructure, and third-party integrations evolve.
          </p>
        </section>

        <section className="legal-section">
          <h3>7. Suspension or Removal</h3>
          <p>
            Access may be restricted or removed for misuse, unauthorized access attempts, policy
            violations, security concerns, or other operational reasons.
          </p>
        </section>

        <section className="legal-section">
          <h3>8. Limitation of Liability</h3>
          <p>
            The service is provided on an as-available basis. SnapKey and related operators are not
            responsible for losses arising from outages, failed third-party API actions, provider
            restrictions, or user-generated content.
          </p>
        </section>

        <section className="legal-section">
          <h3>9. Termination</h3>
          <p>
            Use of the service may be ended by disconnecting accounts, removing workspace access, or
            by administrative action where necessary.
          </p>
        </section>

        <section className="legal-section">
          <h3>10. Contact</h3>
          <p>
            Questions about these terms should be directed to the SnapKey team or the workspace
            administrator managing the deployment.
          </p>
        </section>
      </div>
    </main>
  );
}
