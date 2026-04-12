import type { Metadata } from 'next'
import { PageHero, PageContainer, SectionHeading, Prose } from '../_shared'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'CasaLux Terms of Service — the rules and agreements that govern use of the platform.',
}

export default function TermsPage() {
  return (
    <>
      <PageHero
        label="Legal"
        title="Terms of Service"
        description="Please read these terms carefully. By using CasaLux, you agree to be bound by them."
      />

      <PageContainer>
        <p className="text-sm text-muted mb-10 border border-border rounded-lg px-4 py-3 bg-surface">
          <strong>Last updated:</strong> 12 April 2026 &nbsp;·&nbsp;
          <strong>Effective:</strong> 12 April 2026 &nbsp;·&nbsp;
          Questions? <a href="mailto:legal@casalux.com" className="underline">legal@casalux.com</a>
        </p>

        <SectionHeading>1. Acceptance of terms</SectionHeading>
        <Prose>
          <p>
            By accessing or using the CasaLux website, applications, or any related services (collectively, the "Platform"), you agree to these Terms of Service ("Terms") and our <a href="/privacy" className="underline">Privacy Policy</a>. If you do not agree, you must not use the Platform.
          </p>
          <p>
            CasaLux, Inc. ("CasaLux", "we", "our") reserves the right to modify these Terms at any time. Material changes will be communicated by email. Continued use after the effective date constitutes acceptance. These Terms were last updated on 12 April 2026.
          </p>
          <p>
            You must be at least 18 years old to create an account or make a booking. By using the Platform, you represent that you meet this requirement.
          </p>
        </Prose>

        <SectionHeading>2. The CasaLux platform</SectionHeading>
        <Prose>
          <p>
            CasaLux is a marketplace that connects property hosts ("Hosts") with travellers seeking short-term accommodation ("Guests"). CasaLux is not a party to the rental agreement between Host and Guest — we facilitate the connection and transaction.
          </p>
          <p>
            CasaLux does not own, manage, or control any property listed on the Platform. Hosts are solely responsible for their listings, their accuracy, the condition of the property, and compliance with all applicable local laws (including planning permissions, rental licences, and tax obligations).
          </p>
          <p>
            We curate listings to maintain quality standards but do not guarantee the accuracy of any listing description, photo, or host claim. Guests are encouraged to review listings carefully and contact the Host with questions before booking.
          </p>
        </Prose>

        <SectionHeading>3. Accounts</SectionHeading>
        <Prose>
          <p>
            You must create an account to make bookings or list a property. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account.
          </p>
          <p>
            You agree to provide accurate, current, and complete information and to keep it updated. CasaLux may suspend or terminate accounts that contain false or misleading information.
          </p>
          <p>
            Identity verification is required for both Guests and Hosts before transacting. You consent to our identity verification processes and our identity verification provider's terms.
          </p>
        </Prose>

        <SectionHeading>4. Bookings and reservations</SectionHeading>
        <Prose>
          <p>
            A booking is formed when a Guest submits a booking request and the Host accepts it (or, for Instant Book listings, when payment is successfully processed). At that point, a binding rental agreement exists between the Guest and Host, subject to these Terms.
          </p>
          <p>
            <strong>Guest obligations:</strong> Guests agree to (a) use the property only for the purpose described in the booking, (b) comply with the Host's house rules, (c) not exceed the stated maximum occupancy, (d) leave the property in the same condition as found, and (e) vacate by the stated check-out time.
          </p>
          <p>
            <strong>Host obligations:</strong> Hosts agree to (a) ensure the property materially matches the listing description and photos, (b) make the property available for the dates confirmed in the booking, (c) provide safe, clean, and functional accommodation, and (d) respond to Guest messages within 24 hours.
          </p>
          <p>
            CasaLux may cancel a booking on behalf of either party in cases of fraud, safety risk, or material misrepresentation.
          </p>
        </Prose>

        <SectionHeading>5. Payments and fees</SectionHeading>
        <Prose>
          <p>
            All payments are processed by Stripe, Inc. under Stripe's terms of service. CasaLux does not store full payment card details.
          </p>
          <p>
            <strong>Guest fees:</strong> Guests pay the nightly rate multiplied by the number of nights, plus any applicable cleaning fee, plus a service fee of 10–14% of the booking subtotal. The total is displayed at checkout before payment is taken.
          </p>
          <p>
            <strong>Host fees:</strong> Hosts receive the nightly rate minus a 3% host service fee. Payouts are disbursed within 24 hours of Guest check-in to the bank account or debit card registered in the Host's profile.
          </p>
          <p>
            All prices are displayed in Indian Rupees (INR) unless otherwise indicated. Applicable taxes (GST or local equivalents) are included in the displayed total where required by law.
          </p>
          <p>
            CasaLux reserves the right to change its fee structure with 30 days' notice to affected users.
          </p>
        </Prose>

        <SectionHeading>6. Cancellations and refunds</SectionHeading>
        <Prose>
          <p>
            Each listing displays one of three cancellation policies (Flexible, Moderate, or Strict) set by the Host. The applicable policy is shown on the listing page and on the booking confirmation. Refund amounts are calculated per the policy in effect at the time of booking. Full details are available on our <a href="/cancellations" className="underline">Cancellation options</a> page.
          </p>
          <p>
            If a Host cancels a confirmed booking, the Guest receives a full refund plus a rebooking credit equal to 10% of the original booking value. Hosts who cancel confirmed bookings without a valid extenuating circumstance may have their accounts suspended.
          </p>
          <p>
            Extenuating circumstances (natural disasters, serious illness, government travel restrictions) may qualify for a full refund outside the standard cancellation policy. Documentation must be submitted to support within 14 days of the event.
          </p>
        </Prose>

        <SectionHeading>7. Host listing standards</SectionHeading>
        <Prose>
          <p>
            All listings must meet CasaLux's quality standards: accurate descriptions and photos, professionally presented interiors, functional amenities as described, and properties free from health and safety hazards.
          </p>
          <p>
            Hosts represent and warrant that they have the legal right to list and rent the property, have obtained all required permits and licences, and will comply with all applicable laws including local short-term rental regulations, tax laws, and building safety codes.
          </p>
          <p>
            CasaLux may delist any property at its sole discretion for quality violations, repeated negative guest feedback, or any other reason with 14 days' notice (or immediately in cases of safety risk or fraud).
          </p>
        </Prose>

        <SectionHeading>8. Prohibited conduct</SectionHeading>
        <Prose>
          <p>You must not, and must not attempt to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the Platform for any unlawful purpose or in violation of any applicable law.</li>
            <li>Circumvent the Platform to arrange payments outside of CasaLux's checkout system.</li>
            <li>Post false, misleading, or fraudulent listings, reviews, or information.</li>
            <li>Harass, threaten, or discriminate against other users.</li>
            <li>Access, tamper with, or disrupt the Platform's servers, security systems, or other users' accounts.</li>
            <li>Scrape, crawl, or systematically extract data from the Platform without prior written consent.</li>
            <li>Use the Platform to advertise third-party products or services without our consent.</li>
            <li>Create multiple accounts to evade bans or circumvent Platform limits.</li>
          </ul>
          <p>
            Violations may result in immediate account suspension, forfeiture of pending payouts, and referral to law enforcement where applicable.
          </p>
        </Prose>

        <SectionHeading>9. Reviews</SectionHeading>
        <Prose>
          <p>
            Both Guests and Hosts may leave reviews after a completed stay. Reviews must be honest, based on personal experience, and comply with our community standards. Reviews that contain personal attacks, discriminatory language, or false factual claims will be removed.
          </p>
          <p>
            CasaLux does not edit or moderate review content before publication, but reserves the right to remove reviews that violate these Terms.
          </p>
        </Prose>

        <SectionHeading>10. Intellectual property</SectionHeading>
        <Prose>
          <p>
            The CasaLux name, logo, and platform design are trademarks of CasaLux, Inc. You may not use them without prior written consent.
          </p>
          <p>
            By uploading content (photos, descriptions, reviews) to the Platform, you grant CasaLux a non-exclusive, worldwide, royalty-free licence to use, display, and distribute that content for the purpose of operating and promoting the Platform. You retain ownership of your content and may request removal by deleting your listing or account.
          </p>
        </Prose>

        <SectionHeading>11. Limitation of liability</SectionHeading>
        <Prose>
          <p>
            To the fullest extent permitted by law, CasaLux's total liability to you for any claims arising out of or relating to these Terms or the Platform shall not exceed the greater of (a) the total fees paid by you to CasaLux in the 12 months preceding the claim, or (b) ₹10,000.
          </p>
          <p>
            CasaLux is not liable for: (a) the acts or omissions of Hosts or Guests; (b) the condition, safety, or legality of any property; (c) property damage or personal injury occurring during a stay; (d) indirect, incidental, consequential, or punitive damages; or (e) loss of data or business interruption.
          </p>
          <p>
            Nothing in these Terms limits liability for death or personal injury caused by negligence, fraud, or any other matter that cannot be excluded by law.
          </p>
        </Prose>

        <SectionHeading>12. Indemnification</SectionHeading>
        <Prose>
          <p>
            You agree to indemnify and hold harmless CasaLux, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising out of your use of the Platform, your listing or booking, your violation of these Terms, or your violation of any third-party rights.
          </p>
        </Prose>

        <SectionHeading>13. Dispute resolution</SectionHeading>
        <Prose>
          <p>
            If a dispute arises between a Guest and Host, the parties should first attempt to resolve it through the Platform's messaging system. If unresolved, either party may contact CasaLux support, who will investigate and may issue a binding resolution regarding any withheld payouts or refunds.
          </p>
          <p>
            Disputes between you and CasaLux shall be resolved by binding arbitration under the Indian Arbitration and Conciliation Act, 1996, in Bengaluru, Karnataka, conducted in English. This clause does not prevent either party from seeking injunctive relief in a court of competent jurisdiction.
          </p>
        </Prose>

        <SectionHeading>14. Governing law</SectionHeading>
        <Prose>
          <p>
            These Terms are governed by the laws of India. Subject to the arbitration clause above, you and CasaLux submit to the exclusive jurisdiction of the courts of Bengaluru, Karnataka for any matter not subject to arbitration.
          </p>
        </Prose>

        <SectionHeading>15. General</SectionHeading>
        <Prose>
          <p>
            If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect. Our failure to enforce any right does not waive that right. These Terms, together with our Privacy Policy, constitute the entire agreement between you and CasaLux regarding the Platform.
          </p>
          <p>
            Notices to CasaLux should be sent to: <a href="mailto:legal@casalux.com" className="underline">legal@casalux.com</a>.
          </p>
        </Prose>

        <p className="mt-10 text-xs text-muted text-center">
          Also see our <a href="/privacy" className="underline">Privacy Policy</a> and{' '}
          <a href="/cancellations" className="underline">Cancellation options</a>.
        </p>
      </PageContainer>
    </>
  )
}
