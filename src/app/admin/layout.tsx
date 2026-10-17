// src/app/admin/layout.tsx — the dashboard's furniture. The root layout supplies <html> and the tokens.
import './admin.css'

export const metadata = { title: 'Admin', robots: { index: false, follow: false } }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="adm-root">{children}</div>
}
