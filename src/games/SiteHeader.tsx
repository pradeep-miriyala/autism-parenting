// The bar across the top of the home page: the name, and a way back to the author's site. It has the class "nav"
// so that it steps aside, like the footer, whenever a game is open (see styles.ts).
const PORTFOLIO = process.env.NEXT_PUBLIC_PORTFOLIO_URL || 'https://pradeep.miriyala.in'

export default function SiteHeader() {
  return (
    <header className="nav">
      <a href="/" className="nav-brand">Little Steps</a>
      <a href={PORTFOLIO} className="nav-by" target="_blank" rel="noreferrer">By Pradeep Miriyala ↗</a>
    </header>
  )
}
