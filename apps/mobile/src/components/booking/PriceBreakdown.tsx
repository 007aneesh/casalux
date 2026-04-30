import { View, Text } from 'react-native'
import type { PricingBreakdown } from '@casalux/types'
import { formatCurrency } from '@casalux/utils'

interface PriceBreakdownProps {
  pricing: PricingBreakdown
}

export function PriceBreakdown({ pricing }: PriceBreakdownProps): JSX.Element {
  const c = pricing.currency
  return (
    <View>
      <Row
        label={`${formatCurrency(pricing.rawSubtotal / pricing.nights, c)} × ${pricing.nights} nights`}
        value={formatCurrency(pricing.rawSubtotal, c)}
      />
      {pricing.discounts.map((d) => (
        <Row
          key={d.label}
          label={d.label}
          value={`-${formatCurrency(d.amount, c)}`}
          highlight
        />
      ))}
      <Row label="Cleaning fee" value={formatCurrency(pricing.cleaningFee, c)} />
      <Row label="Service fee" value={formatCurrency(pricing.serviceFee, c)} />
      <Row label="Taxes" value={formatCurrency(pricing.taxes, c)} />
      <View className="h-px bg-border my-3" />
      <Row label="Total" value={formatCurrency(pricing.total, c)} bold />
    </View>
  )
}

function Row({
  label,
  value,
  bold,
  highlight,
}: {
  label: string
  value: string
  bold?: boolean
  highlight?: boolean
}): JSX.Element {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text
        className={[
          bold ? 'font-sans-semibold' : 'font-sans',
          'text-foreground',
        ].join(' ')}
      >
        {label}
      </Text>
      <Text
        className={[
          bold ? 'font-sans-semibold' : 'font-sans',
          highlight ? 'text-success' : 'text-foreground',
        ].join(' ')}
      >
        {value}
      </Text>
    </View>
  )
}
