import type { Metadata } from 'next'
import { PageHero, PageContainerWide, SectionHeading } from '../layout'

export const metadata: Metadata = {
  title: 'Help Centre',
  description: 'Find answers to common questions about booking, payments, hosting, and your CasaLux account.',
}

const faqs: { category: string; icon: string; questions: { q: string; a: string }[] }[] = [
  {
    category: 'Booking',
    icon: '🏠',
    questions: [
      {
        q: 'How do I book a listing?',
        a: 'Find a property you love on the Search page, select your check-in and check-out dates, and click "Request to Book". You\'ll be asked to confirm guest numbers and add a message to the host. Once the host accepts, you\'ll be prompted to complete payment.',
      },
      {
        q: 'Can I book instantly without host approval?',
        a: 'Some listings have Instant Book enabled — you\'ll see a lightning bolt badge on the card. With Instant Book, payment is charged immediately and the reservation is confirmed automatically. For all other listings, the host has 24 hours to accept or decline your request.',
      },
      {
        q: 'What happens if my booking request is declined?',
        a: 'If a host declines or the 24-hour window passes without a response, your request expires. No payment is taken and you\'re free to request another property. We\'ll notify you by email as soon as a decision is made.',
      },
      {
        q: 'Can I modify my booking dates after confirmation?',
        a: 'Yes. Go to your Bookings page, open the booking, and click "Request date change". The host must approve the new dates. If the nightly rate differs, the price difference will be charged or refunded automatically.',
      },
      {
        q: 'Is there a minimum stay requirement?',
        a: 'Minimum stay requirements are set by each host and displayed on the listing page. Some properties require 2–7 nights minimum, especially during peak seasons.',
      },
    ],
  },
  {
    category: 'Payments',
    icon: '💳',
    questions: [
      {
        q: 'When am I charged?',
        a: 'For Instant Book listings, payment is taken immediately at checkout. For request-based bookings, your card is authorised (not charged) when you submit the request. The charge only completes once the host accepts.',
      },
      {
        q: 'What payment methods are accepted?',
        a: 'We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover) and digital wallets including Apple Pay and Google Pay via Stripe. Card details are never stored on our servers — all processing is handled by Stripe.',
      },
      {
        q: 'What is the CasaLux service fee?',
        a: 'Guests pay a service fee of 10–14% of the booking subtotal. This fee covers guest support, secure payments, and platform maintenance. The exact fee is shown on the checkout summary before you confirm.',
      },
      {
        q: 'How do host payouts work?',
        a: 'Hosts receive their payout (nightly rate × nights, minus the host service fee) within 24 hours of the guest\'s check-in. Funds are sent via Stripe to the bank account or debit card on file in your host profile.',
      },
      {
        q: 'Are there any hidden fees?',
        a: 'No hidden fees. The total shown at checkout — nightly rate, cleaning fee (if any), service fee, and applicable taxes — is exactly what you pay. There are no processing charges added afterwards.',
      },
    ],
  },
  {
    category: 'Hosting',
    icon: '🔑',
    questions: [
      {
        q: 'How do I become a host?',
        a: 'Click "Become a host" in the navigation menu. You\'ll complete a short onboarding: property details, photos, pricing, and availability. Once submitted, your listing is reviewed by our curation team (usually within 48 hours) before going live.',
      },
      {
        q: 'What properties qualify as "luxury" on CasaLux?',
        a: 'We curate all listings to ensure a minimum standard: high-quality furnishings, professional photography, accurate descriptions, and consistent 4.5+ star ratings. Properties are reviewed before listing and periodically thereafter.',
      },
      {
        q: 'Can I block dates on my calendar?',
        a: 'Yes. In your Host dashboard under Calendar, you can block any dates manually or sync your availability with an external iCal feed (Airbnb, VRBO, Booking.com, etc.).',
      },
      {
        q: 'What is the host service fee?',
        a: 'CasaLux charges hosts 3% of each booking subtotal. This covers payout processing and platform access. It is automatically deducted before your payout is sent.',
      },
    ],
  },
  {
    category: 'Account & Safety',
    icon: '🔒',
    questions: [
      {
        q: 'How do I verify my identity?',
        a: 'Identity verification is handled through Clerk, our authentication provider. You can add a government-issued ID from your Account Settings > Verification tab. Verified guests and hosts see a blue checkmark on their profiles.',
      },
      {
        q: 'How do I report a safety concern?',
        a: 'If you feel unsafe during a stay, leave the property and contact local emergency services first. Then contact our 24/7 Support team via the Help icon in the app or email safety@casalux.com. We investigate all reports within 24 hours.',
      },
      {
        q: 'What happens if a host cancels my confirmed booking?',
        a: 'Host-initiated cancellations are rare but taken seriously. You\'ll receive a full refund within 3–5 business days and a rebooking credit of 10% of your original booking value to use on your next stay.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Account Settings > Privacy > Delete Account. This permanently removes your personal data and all associated booking history. Active or upcoming bookings must be cancelled first. Deletion is irreversible.',
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <>
      <PageHero
        label="Support"
        title="Help Centre"
        description="Find answers to common questions. Can't find what you're looking for? Contact our support team anytime."
      />

      {/* Quick contact bar */}
      <div className="bg-[rgb(var(--gold))]/10 border-b border-[rgb(var(--gold))]/20">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-4 flex flex-wrap gap-6 items-center justify-between">
          <p className="text-sm text-foreground/80">
            Need personal assistance? Our support team is available <strong>24/7</strong>.
          </p>
          <div className="flex gap-4 text-sm">
            <a href="mailto:support@casalux.com" className="text-[rgb(var(--gold-600))] font-medium hover:underline">
              support@casalux.com
            </a>
          </div>
        </div>
      </div>

      <PageContainerWide>
        <div className="grid md:grid-cols-2 gap-12">
          {faqs.map((section) => (
            <div key={section.category}>
              <SectionHeading>
                <span className="mr-2">{section.icon}</span>
                {section.category}
              </SectionHeading>
              <div className="space-y-2">
                {section.questions.map(({ q, a }) => (
                  <details
                    key={q}
                    className="group border border-border rounded-xl overflow-hidden"
                  >
                    <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-surface transition-colors list-none">
                      {q}
                      <svg
                        className="w-4 h-4 text-muted flex-shrink-0 ml-4 transition-transform group-open:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-5 pb-5 pt-2 text-sm text-muted leading-relaxed border-t border-border bg-surface/40">
                      {a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-[rgb(var(--navy))] text-white p-8 text-center">
          <h2 className="font-display text-2xl font-semibold mb-2">Still need help?</h2>
          <p className="text-white/70 mb-6">
            Our team is available around the clock. Typical response time is under 2 hours.
          </p>
          <a
            href="mailto:support@casalux.com"
            className="inline-block bg-[rgb(var(--gold))] text-[rgb(var(--navy))] font-semibold px-6 py-3 rounded-xl hover:bg-[rgb(var(--gold-600))] transition-colors"
          >
            Email support
          </a>
        </div>
      </PageContainerWide>
    </>
  )
}
