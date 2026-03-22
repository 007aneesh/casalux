import { Resend } from 'resend'
import type { IEmailService, SendEmailParams } from '../IEmailService.js'

interface ResendConfig {
  apiKey: string
  fromAddress?: string
}

// Template → subject mapping (override per send if needed)
const TEMPLATE_SUBJECTS: Record<string, string> = {
  'booking-confirmed': 'Your booking is confirmed!',
  'new-booking-host': 'New booking received',
  'payment-failed': 'Payment failed — please retry',
  'request-approved': 'Your booking request was approved',
  'request-declined': 'Update on your booking request',
  'pre-approval': 'You have been pre-approved!',
  'review-request': 'How was your stay?',
  'payout-sent': 'Your payout is on the way',
}

export class ResendAdapter implements IEmailService {
  private client: Resend
  private from: string

  constructor(config: ResendConfig) {
    this.client = new Resend(config.apiKey)
    this.from = config.fromAddress ?? 'CasaLux <noreply@casalux.com>'
  }

  async send(params: SendEmailParams): Promise<void> {
    const subject = params.subject ?? TEMPLATE_SUBJECTS[params.template] ?? 'Message from CasaLux'

    await this.client.emails.send({
      from: this.from,
      to: params.to,
      subject,
      // In production: use react-email templates compiled to HTML
      html: `<p>Template: ${params.template}</p><pre>${JSON.stringify(params.data, null, 2)}</pre>`,
      reply_to: params.replyTo,
    })
  }
}
