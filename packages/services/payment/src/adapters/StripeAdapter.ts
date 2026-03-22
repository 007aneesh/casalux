/**
 * StripeAdapter — default payment provider.
 * PRD Section 3.2 — webhook-driven, no synchronous payment confirmations.
 */
import Stripe from 'stripe'
import type {
  IPaymentService,
  CheckoutParams,
  CheckoutSession,
  PaymentIntentParams,
  PaymentIntent,
  WebhookEvent,
  Refund,
  TransferParams,
  Transfer,
} from '../IPaymentService.js'

interface StripeConfig {
  secretKey: string
  webhookSecret: string
}

export class StripeAdapter implements IPaymentService {
  private stripe: Stripe
  private webhookSecret: string

  constructor(config: StripeConfig) {
    this.stripe = new Stripe(config.secretKey, { apiVersion: '2024-04-10' })
    this.webhookSecret = config.webhookSecret
  }

  async createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: { name: `Booking ${params.bookingId}` },
          unit_amount: params.amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { ...params.metadata, bookingId: params.bookingId },
    })

    return {
      sessionId: session.id,
      sessionUrl: session.url!,
      providerPayload: { sessionId: session.id },
    }
  }

  async createPaymentIntent(params: PaymentIntentParams): Promise<PaymentIntent> {
    const intent = await this.stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency.toLowerCase(),
      metadata: { ...params.metadata, bookingId: params.bookingId },
    })

    return {
      intentId: intent.id,
      clientSecret: intent.client_secret!,
      status: intent.status,
    }
  }

  constructWebhookEvent(payload: Buffer, signature: string): WebhookEvent {
    const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret)
    return {
      eventId: event.id,
      eventType: event.type,
      payload: event.data.object as any,
    }
  }

  async refund(chargeId: string, amount?: number): Promise<Refund> {
    const refund = await this.stripe.refunds.create({
      charge: chargeId,
      ...(amount !== undefined && { amount }),
    })
    return { refundId: refund.id!, amount: refund.amount, status: refund.status! }
  }

  async createTransfer(params: TransferParams): Promise<Transfer> {
    const transfer = await this.stripe.transfers.create({
      amount: params.amount,
      currency: params.currency.toLowerCase(),
      destination: params.destination,
      metadata: { ...params.metadata, bookingId: params.bookingId },
    })
    return { transferId: transfer.id, amount: transfer.amount, status: 'created' }
  }
}
