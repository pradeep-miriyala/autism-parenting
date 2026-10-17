// src/app/admin/page.tsx — server component, auth gate
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminDashboard from './AdminDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')
  return <AdminDashboard />
}
