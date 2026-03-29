import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getListing, updateListing, updateListingStatus, addCustomAmenity, type UpdateListingPayload } from '@/lib/api'
import EditListingForm from '@/components/listings/EditListingForm'

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let listing
  try { listing = await getListing(id) } catch { notFound() }
  if (!listing) notFound()

  async function handleSave(payload: UpdateListingPayload) {
    'use server'
    await updateListing(id, payload)
    revalidatePath(`/listings/${id}`)
    revalidatePath(`/listings/${id}/edit`)
  }

  async function handleStatusChange(status: string) {
    'use server'
    await updateListingStatus(id, status)
    revalidatePath(`/listings/${id}`)
    revalidatePath(`/listings/${id}/edit`)
  }

  async function handleAddCustomAmenity(name: string) {
    'use server'
    const res = await addCustomAmenity(id, name)
    return res.data
  }

  return <EditListingForm listing={listing} onSave={handleSave} onStatusChange={handleStatusChange} onAddCustomAmenity={handleAddCustomAmenity} />
}
