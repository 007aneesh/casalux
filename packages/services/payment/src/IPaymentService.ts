/**
 * IPaymentService — Service Bus Interface for payments.
 * PRD Section 3.2 — all booking state changes flow through provider webhook events.
 */

export interface CheckoutParams {
  amount: number          // cents
  currency: string        // ISO 4217
  bookingId: string
  metadata: Record<string, string>
  successUrl: string
  cancelUrl: string
}

export interface CheckoutSession {
  sessionId: string
  sessionUrl: string
  providerPayload: Record<string, unknown>
}

export interface PaymentIntentParams {
  amount: number
  currency: string
  bookingId: string
  metadata: Record<string, string>
}

export interface PaymentIntent {
  intentId: string
  clientSecret: string
  status: string
}

export interface WebhookEvent {
  eventId: string
  eventType: string
  payload: Record<string, unknown>
}

export interface Refund {
  refundId: string
  amount: number
  status: string
}

export interface TransferParams {
  amount: number
  currency: string
  destination: string     // Host's connected account / bank
  bookingId: string
  metadata: Record<string, string>
}

export interface Transfer {
  transferId: string
  amount: number
  status: string
}

export interface IPaymentService {
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession>
  createPaymentIntent(params: PaymentIntentParams): Promise<PaymentIntent>
  retrievePaymentIntent(intentId: string): Promise<PaymentIntent | null>
  constructWebhookEvent(payload: Buffer, signature: string): WebhookEvent
  refund(chargeId: string, amount?: number): Promise<Refund>
  createTransfer(params: TransferParams): Promise<Transfer>
}
