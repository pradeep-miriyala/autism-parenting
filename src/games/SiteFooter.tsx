// The foot of the home page. Folded away by default (see CollapsibleFooter): a child playing the games tends to
// keep scrolling, and this is where the links that lead off the page live.
const PORTFOLIO = process.env.NEXT_PUBLIC_PORTFOLIO_URL || 'https://pradeep.miriyala.in'

export default function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p>
          Little Steps is a free project by Pradeep Miriyala, made for children on the autism spectrum and the
          families who practise with them. It is not medical advice, and it does not replace the guidance of
          your child’s therapist or teacher.
        </p>
        <p>
          Your child’s rounds, stickers, details and any voice recordings stay on the phone or computer they
          are made on. The only thing sent is an anonymous count of visits and finished rounds, which can be
          switched off in the settings.
        </p>
        <div className="footer-links">
          <a href={PORTFOLIO} target="_blank" rel="noreferrer">Pradeep Miriyala</a>
          <a href={`${PORTFOLIO}/contact`} target="_blank" rel="noreferrer">Get in touch</a>
          <a href="https://github.com/pradeep-miriyala/autism-parenting" target="_blank" rel="noreferrer">Source on GitHub</a>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--ink-50)' }}>© {year} Pradeep Miriyala</p>
      </div>
    </footer>
  )
}
