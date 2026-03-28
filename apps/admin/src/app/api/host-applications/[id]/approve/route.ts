import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { getToken } = await auth()
  const token = await getToken()
  const res = await fetch(`${API_BASE}/api/v1/admin/host-applications/${id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
