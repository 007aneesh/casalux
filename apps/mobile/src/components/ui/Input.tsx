import { forwardRef } from 'react'
import { TextInput, View, Text } from 'react-native'
import type { TextInputProps } from 'react-native'
import { colors } from '../../theme/tokens'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, leftIcon, rightIcon, className = '', ...rest },
  ref,
) {
  return (
    <View className="w-full">
      {label && (
        <Text className="text-sm font-sans-medium text-foreground mb-1.5">
          {label}
        </Text>
      )}
      <View
        className={[
          'flex-row items-center bg-card border rounded-md px-4 h-12',
          error ? 'border-danger' : 'border-border',
        ].join(' ')}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.mutedLight}
          className={`flex-1 text-base text-foreground font-sans ${className}`}
          {...rest}
        />
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>
      {error && (
        <Text className="text-xs text-danger mt-1 font-sans">{error}</Text>
      )}
    </View>
  )
})
