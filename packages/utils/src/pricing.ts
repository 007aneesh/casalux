/**
 * Pricing pure function — packages/utils/src/pricing.ts
 *
 * Zero DB dependencies. Fully unit-testable. 100% coverage required before booking ships.
 * PRD Section 13.2
 */

import type { PricingBreakdown } from '@casalux/types'

export interface ActiveDiscount {
  type: string
  label: string
  priority: number          // lower = applied first
  value: number             // percentage (0-100) or flat amount in cents
  isPercent: boolean
  minNights?: number
  daysInAdvance?: number    // for early_bird
  daysUntilCheckIn?: number // for last_minute
}

export interface PricingInput {
  basePrice: number         // cents per night
  nights: number
  cleaningFee: number       // cents
  serviceFeePercent: number // e.g. 12 = 12%
  taxRules: Array<{ percent: number; label: string }>
  discounts: ActiveDiscount[]
}

export function calculatePrice(input: PricingInput): PricingBreakdown {
  const { basePrice, nights, cleaningFee, serviceFeePercent, taxRules, discounts } = input

  const rawSubtotal = basePrice * nights

  // Sort by priority ASC, apply sequentially
  const sortedDiscounts = [...discounts].sort((a, b) => a.priority - b.priority)

  let currentSubtotal = rawSubtotal
  const appliedDiscounts: Array<{ type: string; label: string; amount: number }> = []

  for (const discount of sortedDiscounts) {
    if (discount.isPercent) {
      const amount = Math.round(currentSubtotal * (discount.value / 100))
      currentSubtotal -= amount
      appliedDiscounts.push({ type: discount.type, label: discount.label, amount })
    } else {
      const amount = Math.min(discount.value, currentSubtotal)
      currentSubtotal -= amount
      appliedDiscounts.push({ type: discount.type, label: discount.label, amount })
    }
  }

  const discountedSubtotal = currentSubtotal
  const serviceFee = Math.round(discountedSubtotal * (serviceFeePercent / 100))

  const taxes = taxRules.reduce(
    (sum, rule) => sum + Math.round(discountedSubtotal * (rule.percent / 100)),
    0
  )

  const total = discountedSubtotal + cleaningFee + serviceFee + taxes

  return {
    rawSubtotal,
    discounts: appliedDiscounts,
    discountedSubtotal,
    cleaningFee,
    serviceFee,
    taxes,
    total,
    currency: 'INR', // overridden by caller
    nights,
  }
}

export function calculateHostPayout(totalAmount: number, platformServiceFee: number, taxes: number): number {
  return totalAmount - platformServiceFee - taxes
}

export function daysUntilCheckIn(checkIn: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkInDate = new Date(checkIn)
  checkInDate.setHours(0, 0, 0, 0)
  return Math.round((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
