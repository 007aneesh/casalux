'use server'

import { deleteListing } from '@/lib/api'

export async function deleteListingAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteListing(id)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Delete failed' }
  }
}
