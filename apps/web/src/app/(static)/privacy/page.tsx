import type { Metadata } from 'next'
import { PageHero, PageContainer, SectionHeading, Prose } from '../_shared'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How CasaLux collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        label="Legal"
        title="Privacy Policy"
        description="We take your privacy seriously. This policy explains what data we collect, why we collect it, and how you can control it."
      />

      <PageContainer>
        <p className="text-sm text-muted mb-10 border border-border rounded-lg px-4 py-3 bg-surface">
          <strong>Last updated:</strong> 12 April 2026 &nbsp;·&nbsp;
          <strong>Effective:</strong> 12 April 2026 &nbsp;·&nbsp;
          Questions? <a href="mailto:privacy@casalux.com" className="underline">privacy@casalux.com</a>
        </p>

        {/* 1 */}
        <SectionHeading>1. Who we are</SectionHeading>
        <Prose>
          <p>
            CasaLux, Inc. ("CasaLux", "we", "our", or "us") operates the website at casalux.com and related mobile applications (collectively, the "Platform"). We are the data controller responsible for personal data processed under this policy.
          </p>
          <p>
            Our registered address is: CasaLux, Inc., 12th Floor, Embassy Tech Village, Outer Ring Road, Bengaluru, Karnataka 560103, India.
          </p>
        </Prose>

        {/* 2 */}
        <SectionHeading>2. Data we collect</SectionHeading>
        <Prose>
          <p><strong>Account data.</strong> When you create an account: name, email address, phone number, profile photo, and authentication credentials managed via Clerk.</p>
          <p><strong>Identity verification.</strong> Government-issued ID document type and number, processed by our identity verification provider. We do not store document images after verification is complete.</p>
          <p><strong>Booking data.</strong> Check-in and check-out dates, number of guests, property selected, booking messages exchanged with hosts or guests, and booking status.</p>
          <p><strong>Payment data.</strong> Billing address and last-four card digits. Full card numbers are never stored on our servers — all payment processing is handled by Stripe, Inc. under their own privacy policy.</p>
          <p><strong>Host data.</strong> Property address, property photos, availability calendar, payout bank account details (processed and stored by Stripe).</p>
          <p><strong>Communications.</strong> Messages sent through our in-platform messaging system, support tickets, and email correspondence with our team.</p>
          <p><strong>Usage data.</strong> Pages visited, search queries, filters applied, listings viewed, time spent, device type, browser, operating system, and IP address — collected via server logs and Vercel Analytics.</p>
          <p><strong>Cookies and tracking.</strong> See Section 7.</p>
        </Prose>

        {/* 3 */}
        <SectionHeading>3. How we use your data</SectionHeading>
        <Prose>
          <p>We use personal data to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create and manage your account and authenticate you securely.</li>
            <li>Process bookings, payments, and payouts.</li>
            <li>Facilitate communication between guests and hosts.</li>
            <li>Verify identities to maintain trust and safety on the Platform.</li>
            <li>Send transactional emails (booking confirmation, payment receipt, check-in reminders).</li>
            <li>Send service notifications and product updates (you may opt out at any time).</li>
            <li>Resolve disputes, investigate fraud, and enforce our Terms of Service.</li>
            <li>Improve the Platform through aggregated analytics and A/B testing.</li>
            <li>Comply with legal obligations.</li>
          </ul>
          <p>
            We do not sell your personal data to third parties. We do not use your data for automated decision-making that produces legal or similarly significant effects without human review.
          </p>
        </Prose>

        {/* 4 */}
        <SectionHeading>4. Legal basis for processing</SectionHeading>
        <Prose>
          <p>Where applicable under the General Data Protection Regulation (GDPR) and India's Digital Personal Data Protection Act (DPDPA), we process personal data on the following bases:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Contract performance</strong> — processing necessary to provide the booking and marketplace services you requested.</li>
            <li><strong>Legitimate interests</strong> — fraud prevention, security, platform analytics, and improving our services.</li>
            <li><strong>Legal obligation</strong> — tax reporting, law enforcement requests, and regulatory compliance.</li>
            <li><strong>Consent</strong> — marketing emails and non-essential cookies (you may withdraw consent at any time).</li>
          </ul>
        </Prose>

        {/* 5 */}
        <SectionHeading>5. Data sharing and disclosure</SectionHeading>
        <Prose>
          <p>We share personal data only as described below:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Between guests and hosts.</strong> Your first name, profile photo, and verified status are visible to the other party in a confirmed booking. Hosts' full property address is shared only after booking confirmation.</li>
            <li><strong>Service providers.</strong> Clerk (authentication), Stripe (payments), Neon (database hosting), Vercel (infrastructure), Cloudinary (image hosting), and BullMQ/Redis (background jobs). All providers are contractually bound to process data only on our instructions.</li>
            <li><strong>Legal authorities.</strong> When required by law, court order, or to protect the rights and safety of CasaLux, our users, or the public.</li>
            <li><strong>Business transfers.</strong> In connection with a merger, acquisition, or sale of assets, with appropriate notice to affected users.</li>
          </ul>
        </Prose>

        {/* 6 */}
        <SectionHeading>6. Data retention</SectionHeading>
        <Prose>
          <p>
            Account data is retained for the life of your account plus 3 years after deletion, to comply with financial reporting obligations. Booking records are retained for 7 years as required by tax law. Messages are retained for 2 years. Usage logs are retained for 90 days.
          </p>
          <p>
            You may request earlier deletion of certain data (see Section 8), subject to our legal retention obligations.
          </p>
        </Prose>

        {/* 7 */}
        <SectionHeading>7. Cookies and tracking</SectionHeading>
        <Prose>
          <p>We use the following types of cookies and similar technologies:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Essential cookies</strong> — authentication session cookies from Clerk. Required for the Platform to function. Cannot be disabled.</li>
            <li><strong>Analytics</strong> — Vercel Analytics and Speed Insights collect anonymised, aggregated data about page performance and usage. No cross-site tracking. No personally identifiable data is sent.</li>
          </ul>
          <p>
            We do not use third-party advertising cookies, retargeting pixels, or social media trackers.
          </p>
        </Prose>

        {/* 8 */}
        <SectionHeading>8. Your rights</SectionHeading>
        <Prose>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access</strong> — request a copy of personal data we hold about you.</li>
            <li><strong>Rectification</strong> — correct inaccurate or incomplete data.</li>
            <li><strong>Erasure</strong> — request deletion of your personal data ("right to be forgotten"), subject to legal retention requirements.</li>
            <li><strong>Restriction</strong> — request that we limit how we process your data in certain circumstances.</li>
            <li><strong>Portability</strong> — receive your data in a structured, machine-readable format.</li>
            <li><strong>Object</strong> — object to processing based on legitimate interests.</li>
            <li><strong>Withdraw consent</strong> — withdraw consent for marketing or non-essential cookies at any time.</li>
          </ul>
          <p>
            To exercise any right, email <a href="mailto:privacy@casalux.com" className="underline">privacy@casalux.com</a>. We respond within 30 days. If you are unsatisfied with our response, you may lodge a complaint with your local data protection authority.
          </p>
        </Prose>

        {/* 9 */}
        <SectionHeading>9. International data transfers</SectionHeading>
        <Prose>
          <p>
            Our infrastructure providers (Vercel, Neon, Stripe, Clerk) may process data in the United States or other jurisdictions outside India. Where data is transferred outside India, we ensure appropriate safeguards are in place through contractual clauses or adequacy decisions.
          </p>
        </Prose>

        {/* 10 */}
        <SectionHeading>10. Children's privacy</SectionHeading>
        <Prose>
          <p>
            CasaLux is not directed at children under 18 years of age. We do not knowingly collect personal data from children. If you believe a child has provided us with personal information, contact us at <a href="mailto:privacy@casalux.com" className="underline">privacy@casalux.com</a> and we will delete it promptly.
          </p>
        </Prose>

        {/* 11 */}
        <SectionHeading>11. Changes to this policy</SectionHeading>
        <Prose>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by email and by posting the updated policy on this page with a revised "Last updated" date. Continued use of the Platform after a change constitutes acceptance of the new policy.
          </p>
        </Prose>

        {/* 12 */}
        <SectionHeading>12. Contact us</SectionHeading>
        <Prose>
          <p>
            Data Controller: CasaLux, Inc.<br />
            Email: <a href="mailto:privacy@casalux.com" className="underline">privacy@casalux.com</a><br />
            Address: 12th Floor, Embassy Tech Village, Outer Ring Road, Bengaluru, Karnataka 560103, India.
          </p>
        </Prose>

        <p className="mt-10 text-xs text-muted text-center">
          Also see our <a href="/terms" className="underline">Terms of Service</a>.
        </p>
      </PageContainer>
    </>
  )
}
