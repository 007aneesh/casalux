import { ActivityIndicator, Pressable, Text } from 'react-native'
import type { PressableProps } from 'react-native'
import { colors } from '../../theme/tokens'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
}

const containerVariant: Record<ButtonVariant, string> = {
  primary: 'bg-navy active:bg-navy-800',
  secondary: 'bg-gold active:bg-gold-600',
  ghost: 'bg-transparent active:bg-border',
  outline: 'bg-transparent border border-navy active:bg-navy/5',
}

const textVariant: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-navy',
  ghost: 'text-navy',
  outline: 'text-navy',
}

const sizeContainer: Record<ButtonSize, string> = {
  sm: 'h-10 px-4',
  md: 'h-12 px-5',
  lg: 'h-14 px-6',
}

const sizeText: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-base',
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  leftIcon,
  ...rest
}: ButtonProps): JSX.Element {
  const isDisabled = disabled || loading
  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      className={[
        'flex-row items-center justify-center rounded-md',
        containerVariant[variant],
        sizeContainer[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.white : colors.navy}
        />
      ) : (
        <>
          {leftIcon}
          <Text
            className={[
              'font-sans-semibold',
              textVariant[variant],
              sizeText[size],
              leftIcon ? 'ml-2' : '',
            ].join(' ')}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  )
}
