// src/app/api/admin/dashboard/route.ts
// The Little Steps dashboard: who is on the page now, the last two weeks, and the names parents
// chose to share. Admin only.

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { deleteShared, loadDashboard } from '@/lib/stats'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json(await loadDashboard(await getDb()))
  } catch (err) {
    console.error('[admin/parenting GET]', err)
    return NextResponse.json({ error: 'Could not load the numbers' }, { status: 500 })
  }
}

/** DELETE ?id=… removes one shared name. */
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id') || ''
  if (!/^[A-Za-z0-9_-]{12,40}$/.test(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 })
  try {
    const ok = await deleteShared(await getDb(), id)
    return NextResponse.json({ ok }, { status: ok ? 200 : 404 })
  } catch (err) {
    console.error('[admin/parenting DELETE]', err)
    return NextResponse.json({ error: 'Could not delete' }, { status: 500 })
  }
}
