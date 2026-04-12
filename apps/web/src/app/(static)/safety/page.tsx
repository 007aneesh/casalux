import type { Metadata } from 'next'
import { PageHero, PageContainerWide, SectionHeading } from '../_shared'

export const metadata: Metadata = {
  title: 'Safety Information',
  description: 'How CasaLux keeps guests and hosts safe — from identity verification to 24/7 support.',
}

export default function SafetyPage() {
  return (
    <>
      <PageHero
        label="Support"
        title="Safety Information"
        description="Your safety is our top priority. Here's how we protect every guest and host on the CasaLux platform."
      />

      {/* Trust pillars */}
      <div className="bg-surface border-b border-border">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { icon: '🪪', label: 'ID Verification', sub: 'Every guest & host' },
              { icon: '🔐', label: 'Secure Payments', sub: 'Stripe PCI-DSS Level 1' },
              { icon: '🛡️', label: 'Host Guarantee', sub: 'Up to $50,000 damage cover' },
              { icon: '📞', label: '24/7 Support', sub: 'Available around the clock' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <span className="text-3xl">{icon}</span>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PageContainerWide>
        <div className="grid md:grid-cols-2 gap-12">

          {/* Guest safety */}
          <div>
            <SectionHeading>For Guests</SectionHeading>
            <div className="space-y-6">
              {[
                {
                  title: 'Identity Verification',
                  body: 'All hosts must complete identity verification before listing a property. Government-issued ID is checked against facial recognition. Verified hosts display a checkmark on their profile — look for it before booking.',
                },
                {
                  title: 'Secure Messaging',
                  body: 'All communication between guests and hosts happens inside the CasaLux platform. Never share personal contact details or arrange payments outside the platform — doing so removes our ability to protect you.',
                },
                {
                  title: 'Payment Protection',
                  body: 'Your payment is held securely and only released to the host 24 hours after your check-in, giving you time to flag any issues. If the property doesn\'t match the listing description, contact support before check-in time ends.',
                },
                {
                  title: 'During Your Stay',
                  body: 'Check for and familiarise yourself with emergency exits, fire extinguishers, and first-aid kits on arrival. Save the local emergency number (e.g. 112 in Europe, 911 in the US) and our 24/7 support line (+1 800 000 0000) in your phone.',
                },
                {
                  title: 'Reporting an Issue',
                  body: 'If you feel unsafe, leave the property immediately and call local emergency services. Then contact CasaLux support. We will assist with alternative accommodation and initiate an investigation. Hosts found in violation of our safety standards are immediately suspended.',
                },
              ].map(({ title, body }) => (
                <div key={title} className="border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Host safety */}
          <div>
            <SectionHeading>For Hosts</SectionHeading>
            <div className="space-y-6">
              {[
                {
                  title: 'Guest Verification',
                  body: 'Guests must complete identity verification before sending a booking request. You can see verification status on each request. You always have the right to decline any request — no explanation required.',
                },
                {
                  title: 'CasaLux Host Guarantee',
                  body: 'In the unlikely event a guest causes damage, our Host Guarantee covers eligible property damage up to $50,000 per booking. File a claim within 14 days of check-out through your Host dashboard.',
                },
                {
                  title: 'Secure Check-in',
                  body: 'We recommend using a smart lock or key lockbox with a unique code per booking rather than physical key handovers. This reduces risk and is more convenient for both parties.',
                },
                {
                  title: 'House Rules Enforcement',
                  body: 'Set clear house rules on your listing: maximum occupancy, no-smoking policy, pet rules, noise curfews. Guests agree to these rules at the time of booking. Violations can be reported and may result in guest account suspension.',
                },
                {
                  title: 'What to Do in an Emergency',
                  body: 'If a guest reports a safety emergency at your property, contact local emergency services first. Then call our 24/7 Host Support line. We will coordinate with you and the guest and handle any necessary insurance or claim processes.',
                },
              ].map(({ title, body }) => (
                <div key={title} className="border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency contacts */}
        <div className="mt-14 rounded-2xl border-2 border-[rgb(var(--gold))]/30 bg-[rgb(var(--gold))]/5 p-8">
          <h2 className="font-display text-xl font-semibold mb-4">Emergency contacts</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            {[
              { label: '24/7 Guest & Host Support', value: '+1 800 000 0000', type: 'tel' },
              { label: 'Safety issues & reports', value: 'safety@casalux.com', type: 'email' },
              { label: 'Law enforcement requests', value: 'legal@casalux.com', type: 'email' },
            ].map(({ label, value, type }) => (
              <div key={label} className="rounded-xl bg-card border border-border p-4">
                <p className="text-muted mb-1">{label}</p>
                <a
                  href={type === 'tel' ? `tel:${value}` : `mailto:${value}`}
                  className="font-semibold text-foreground hover:text-[rgb(var(--gold-600))] transition-colors"
                >
                  {value}
                </a>
              </div>
            ))}
          </div>
        </div>
      </PageContainerWide>
    </>
  )
}
