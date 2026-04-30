import { forwardRef, useMemo } from 'react'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import type { BottomSheetModal as BottomSheetModalType } from '@gorhom/bottom-sheet'
import { colors } from '../../theme/tokens'

interface SheetProps {
  snapPoints?: (string | number)[]
  children: React.ReactNode
  onDismiss?: () => void
}

export const Sheet = forwardRef<BottomSheetModalType, SheetProps>(function Sheet(
  { snapPoints, children, onDismiss },
  ref,
) {
  const points = useMemo(() => snapPoints ?? ['50%', '85%'], [snapPoints])
  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={points}
      enablePanDownToClose
      onDismiss={onDismiss}
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.muted }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 24 }}>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  )
})
