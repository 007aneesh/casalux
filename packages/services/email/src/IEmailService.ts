/**
 * IEmailService — Service Bus Interface for transactional email.
 * PRD Section 3.4 — all emails dispatched via BullMQ, never inline.
 */

export type EmailTemplate =
  | 'booking-confirmed'
  | 'new-booking-host'
  | 'booking-cancelled-guest'
  | 'booking-cancelled-host'
  | 'payment-failed'
  | 'refund-confirmation'
  | 'host-alert'
  | 'review-request'
  | 'payout-sent'
  | 'request-approved'
  | 'request-declined'
  | 'request-expired'
  | 'missed-request'
  | 'payment-window-expired'
  | 'pre-approval'
  | 'welcome'
  | 'host-application-approved'
  | 'host-application-rejected'

export interface SendEmailParams {
  to: string
  template: EmailTemplate
  data: Record<string, unknown>
  subject?: string     // Override template subject if needed
  replyTo?: string
}

export interface IEmailService {
  send(params: SendEmailParams): Promise<void>
}
