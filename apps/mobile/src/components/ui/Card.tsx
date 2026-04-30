import { View } from 'react-native'
import type { ViewProps } from 'react-native'

interface CardProps extends ViewProps {
  className?: string
}

export function Card({ className = '', children, ...rest }: CardProps): JSX.Element {
  return (
    <View
      {...rest}
      className={`bg-card rounded-xl border border-border ${className}`}
    >
      {children}
    </View>
  )
}
