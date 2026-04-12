import { Resend } from 'resend'
import type { IEmailService, SendEmailParams, EmailTemplate } from '../IEmailService.js'

interface ResendConfig {
  apiKey: string
  fromAddress?: string
}

// ── Subject lines ─────────────────────────────────────────────────────────────
const SUBJECTS: Record<EmailTemplate, string> = {
  'booking-confirmed':           'Your booking is confirmed! 🎉',
  'new-booking-host':            'New booking received',
  'booking-cancelled-guest':     'Your booking has been cancelled',
  'booking-cancelled-host':      'A booking has been cancelled',
  'payment-failed':              'Payment failed — please retry',
  'refund-confirmation':         'Your refund is on the way',
  'host-alert':                  'Important update from CasaLux',
  'review-request':              'How was your stay? Leave a review',
  'payout-sent':                 'Your payout is on the way',
  'request-approved':            'Your booking request was approved!',
  'request-declined':            'Update on your booking request',
  'request-expired':             'Your booking request expired',
  'missed-request':              'You missed a booking request',
  'payment-window-expired':      'Payment window expired',
  'pre-approval':                'You have been pre-approved!',
  'welcome':                     'Welcome to CasaLux',
  'host-application-submitted':  "We've received your host application",
  'host-application-approved':   "Congratulations — you're a CasaLux host! \uD83C\uDFE1",
  'host-application-rejected':   'Update on your CasaLux host application',
}

// ── Shared layout wrapper ─────────────────────────────────────────────────────
function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CasaLux</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo header -->
        <tr>
          <td style="background:#0f172a;border-radius:16px 16px 0 0;padding:24px 32px;text-align:center;">
            <span style="font-size:22px;font-weight:700;color:#f59e0b;letter-spacing:-0.5px;">CasaLux</span>
            <span style="display:block;font-size:11px;color:#94a3b8;margin-top:2px;letter-spacing:1px;text-transform:uppercase;">Curated luxury stays</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px 32px;border-radius:0 0 16px 16px;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 0 8px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              © ${new Date().getFullYear()} CasaLux, Inc. &nbsp;·&nbsp;
              <a href="https://casalux.com" style="color:#94a3b8;">casalux.com</a>
            </p>
            <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1;">
              You're receiving this because you have an account with CasaLux.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Reusable mini-components ──────────────────────────────────────────────────
function h1(text: string) {
  return `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;line-height:1.2;">${text}</h1>`
}
function p(text: string, muted = false) {
  const color = muted ? '#64748b' : '#334155'
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${color};">${text}</p>`
}
function divider() {
  return `<hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;" />`
}
function ctaButton(text: string, href: string) {
  return `<div style="margin:28px 0 8px;">
    <a href="${href}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:10px;">${text}</a>
  </div>`
}
function infoBox(content: string, color: 'amber' | 'green' | 'red' | 'blue' = 'amber') {
  const palette = {
    amber: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' },
    green: { bg: '#f0fdf4', border: '#86efac', text: '#14532d' },
    red:   { bg: '#fef2f2', border: '#fca5a5', text: '#7f1d1d' },
    blue:  { bg: '#eff6ff', border: '#93c5fd', text: '#1e3a5f' },
  }[color]
  return `<div style="background:${palette.bg};border:1px solid ${palette.border};border-radius:10px;padding:16px 20px;margin:20px 0;">
    <div style="font-size:14px;line-height:1.6;color:${palette.text};">${content}</div>
  </div>`
}
function stepList(steps: string[]) {
  return `<ol style="margin:0;padding-left:20px;color:#334155;font-size:14px;line-height:1.8;">
    ${steps.map((s) => `<li>${s}</li>`).join('')}
  </ol>`
}

// ── Template builders ─────────────────────────────────────────────────────────

function templateHostApplicationSubmitted(data: Record<string, unknown>): string {
  const firstName = (data.firstName as string | undefined) ?? 'there'
  return layout(`
    ${h1('Application under review')}
    ${p(`Hi ${firstName},`)}
    ${p("We've received your host application and our team is reviewing it. This usually takes <strong>1–3 business days</strong>.")}
    ${p("We'll notify you by email once a decision has been made.")}

    ${infoBox(`
      <strong style="display:block;margin-bottom:8px;">What happens next?</strong>
      ${stepList([
        'Our team carefully reviews your property details and photos',
        'You\'ll receive an email with the outcome of our review',
        'Once approved, your listing goes live on CasaLux immediately',
      ])}
    `, 'amber')}

    ${divider()}
    ${p('In the meantime, you can log in and continue editing your application.', true)}
    ${ctaButton('View application status', 'https://casalux.com/host/onboarding')}
    ${p('Thank you for choosing CasaLux. We look forward to welcoming you to our host community.', true)}
  `)
}

function templateHostApplicationApproved(data: Record<string, unknown>): string {
  const firstName   = (data.firstName as string | undefined) ?? 'there'
  const autoApproved = data.autoApproved === true
  const intro = autoApproved
    ? "Your application was instantly approved — welcome to the CasaLux host community!"
    : "Our team has reviewed your application and we're pleased to let you know — you're approved!"

  return layout(`
    ${h1("Congratulations — you're a host! 🏡")}
    ${p(`Hi ${firstName},`)}
    ${p(intro)}

    ${infoBox(`
      <strong style="display:block;margin-bottom:8px;">Your listing is live</strong>
      ${stepList([
        'Log in to your host dashboard to manage your listing',
        'Set your availability calendar and pricing',
        'Enable Instant Book or review requests manually',
        'Start earning — guests can book now',
      ])}
    `, 'green')}

    ${ctaButton('Go to host dashboard', 'https://casalux.com/host/dashboard')}
    ${divider()}
    ${p("If you have any questions about hosting on CasaLux, our support team is here to help.", true)}
  `)
}

function templateHostApplicationRejected(data: Record<string, unknown>): string {
  const firstName = (data.firstName as string | undefined) ?? 'there'
  const reason    = (data.reason    as string | undefined) ?? ''

  return layout(`
    ${h1('Update on your host application')}
    ${p(`Hi ${firstName},`)}
    ${p("Thank you for applying to become a CasaLux host. After careful review, we're unable to approve your application at this time.")}

    ${reason ? infoBox(`
      <strong style="display:block;margin-bottom:6px;">Feedback from our team</strong>
      <span>${reason}</span>
    `, 'red') : ''}

    ${p("We encourage you to address the feedback above and re-apply. Many hosts are approved on their second application after making the suggested improvements.")}

    ${infoBox(`
      <strong style="display:block;margin-bottom:8px;">What you can do</strong>
      ${stepList([
        'Review the feedback from our team above',
        'Update your listing details, photos, and description',
        'Re-apply from your profile at any time',
      ])}
    `, 'blue')}

    ${ctaButton('Re-apply now', 'https://casalux.com/become-a-host')}
    ${divider()}
    ${p('Questions? Reply to this email or reach out to our support team — we\'re happy to help.', true)}
  `)
}

// ── Fallback for other templates (still functional, not yet designed) ─────────
function templateFallback(template: string, data: Record<string, unknown>): string {
  return layout(`
    ${h1('Message from CasaLux')}
    ${p(`Template: <code>${template}</code>`)}
    <pre style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;font-size:12px;overflow:auto;color:#475569;">${JSON.stringify(data, null, 2)}</pre>
  `)
}

// ── Main adapter ─────────────────────────────────────────────────────────────

export class ResendAdapter implements IEmailService {
  private client: Resend
  private from:   string

  constructor(config: ResendConfig) {
    this.client = new Resend(config.apiKey)
    this.from   = config.fromAddress ?? 'CasaLux <noreply@casalux.com>'
  }

  async send(params: SendEmailParams): Promise<void> {
    const subject = params.subject ?? SUBJECTS[params.template] ?? 'Message from CasaLux'
    const html    = this.renderTemplate(params.template, params.data)

    const { error } = await this.client.emails.send({
      from:     this.from,
      to:       params.to,
      subject,
      html,
      reply_to: params.replyTo,
    })

    if (error) {
      throw new Error(`[ResendAdapter] Failed to send "${params.template}" to ${params.to}: ${error.message}`)
    }
  }

  private renderTemplate(template: EmailTemplate, data: Record<string, unknown>): string {
    switch (template) {
      case 'host-application-submitted': return templateHostApplicationSubmitted(data)
      case 'host-application-approved':  return templateHostApplicationApproved(data)
      case 'host-application-rejected':  return templateHostApplicationRejected(data)
      default:                           return templateFallback(template, data)
    }
  }
}
