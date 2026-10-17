// src/app/page.tsx — Little Steps: calm practice games for autistic children
import SiteHeader from '@/games/SiteHeader'
import SiteFooter from '@/games/SiteFooter'
import CollapsibleFooter from '@/games/CollapsibleFooter'
import Games from '@/games/Games'
import PwaInstall from '@/games/PwaInstall'
import { PARENTING_CSS } from '@/games/styles'

export default function HomePage() {
  return (
    <>
      <style>{PARENTING_CSS}</style>
      <SiteHeader />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* The page's heading for search engines and screen readers. What a parent reads
            is folded into "For parents" below, so a child sees only the games. */}
        <h1 className="sq-sr">Little Steps: calm practice games for autistic children</h1>

        <PwaInstall />

        <Games
          parentIntro={
            <>
              <span className="eyebrow">For parents of autistic children</span>
              <h2 className="sq-ph-title">Little Steps</h2>
              <p className="sq-ph-dek">A quiet space for families on the autism journey.</p>
              <p className="sq-ph-text">
                Simple practice games to do together at home: numbers, patterns, sorting, puzzles, spelling
                and drawing. They are slow and gentle by design: no timers, no scores, nothing to sign up
                for. Games are grouped on the front screen; tap one to begin. Choose a game, then use the
                blue play button to hand the screen to your child.
              </p>
            </>
          }
        />
      </div>

      <CollapsibleFooter>
        <SiteFooter />
      </CollapsibleFooter>
    </>
  )
}
