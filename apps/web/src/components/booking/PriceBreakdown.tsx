import { Skeleton } from '@casalux/ui'
import { formatPrice } from '@/lib/utils'
import type { PricingBreakdown } from '@casalux/types'

interface PriceBreakdownProps {
  pricing: PricingBreakdown | undefined
  isLoading: boolean
  currency?: string
}

export function PriceBreakdown({ pricing, isLoading, currency = 'INR' }: PriceBreakdownProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 border-t border-border pt-4 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
        <div className="border-t border-border pt-3 flex justify-between items-center">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    )
  }

  if (!pricing) return null

  const cur = pricing.currency || currency

  return (
    <div className="border-t border-border pt-4 mt-4 space-y-2.5">
      <LineItem
        label={`${formatPrice(pricing.rawSubtotal / pricing.nights, cur)} × ${pricing.nights} night${pricing.nights !== 1 ? 's' : ''}`}
        value={formatPrice(pricing.rawSubtotal, cur)}
      />

      {pricing.discounts.map((d, i) => (
        <LineItem
          key={i}
          label={d.label}
          value={`-${formatPrice(d.amount, cur)}`}
          valueClassName="text-green-600"
        />
      ))}

      {pricing.cleaningFee > 0 && (
        <LineItem label="Cleaning fee" value={formatPrice(pricing.cleaningFee, cur)} />
      )}
      <LineItem label="Service fee" value={formatPrice(pricing.serviceFee, cur)} />
      {pricing.taxes > 0 && (
        <LineItem label="Taxes" value={formatPrice(pricing.taxes, cur)} />
      )}

      <div className="border-t border-border pt-3 mt-3 flex items-center justify-between">
        <span className="font-semibold text-foreground">Total</span>
        <span className="font-semibold text-foreground text-lg">{formatPrice(pricing.total, cur)}</span>
      </div>
    </div>
  )
}

function LineItem({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground underline decoration-dashed decoration-muted underline-offset-2 cursor-help">
        {label}
      </span>
      <span className={`text-sm text-foreground ${valueClassName ?? ''}`}>{value}</span>
    </div>
  )
}
