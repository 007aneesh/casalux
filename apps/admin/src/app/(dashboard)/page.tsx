import { redirect } from 'next/navigation'

export default function DashboardRootPage(): never {
  redirect('/dashboard/listings')
}
