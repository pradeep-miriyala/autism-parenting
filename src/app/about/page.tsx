// src/app/about/page.tsx — what Little Steps is, in words a parent can read in a minute. No links that lead off the
// site: those are with the grown-ups' pages, behind the lock.
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About',
  description: 'What Little Steps is: calm practice games for autistic children, made by a parent, with nothing to sign up for and nothing leaving the device unless you choose.',
}

export default function AboutPage() {
  return (
    <div className="ls-page ls-about">
      <span className="eyebrow">For parents of autistic children</span>
      <h1 className="ls-h1">Little Steps</h1>
      <p className="sq-ph-dek">A quiet space for families on the autism journey.</p>
      <p className="sq-ph-text">
        Simple practice games to do together at home: numbers, patterns, sorting, puzzles, spelling and drawing. They are
        slow and gentle by design: no timers, no scores, nothing to sign up for. Games are grouped on the front screen;
        tap one to begin. Choose a game, then use the blue play button at the top to hand the screen to your child.
      </p>

      <h2 className="sq-subhead">How it is meant to feel</h2>
      <ul className="ls-list">
        <li>A wrong answer gets a soft buzz and a short shake. Nothing the child has got right is lost.</li>
        <li>A right answer gets a small sparkle. There are no points, no streaks and no timers.</li>
        <li>If a child is stuck, the right choice glows gently after a pause. You choose how long the pause is.</li>
        <li>Every few finished rounds earns a sticker. Stickers are only ever added.</li>
        <li>You can record your own voice to congratulate your child, in place of the computer voice.</li>
        <li>You can add your own photos to the Jigsaw. Each one is cut into pieces in a new way every time.</li>
      </ul>

      <h2 className="sq-subhead">Play mode</h2>
      <p className="sq-ph-text">
        Open a game and tap the blue <strong>▶</strong> button. Only the game stays on screen: no menu, no settings, no way
        to wander off. To leave, press and hold the lock for a few seconds.
      </p>

      <h2 className="sq-subhead">Privacy</h2>
      <p className="sq-ph-text">
        Your child’s rounds, stickers, details, any voice recordings and any photos you add stay on the phone or computer they are made on.
        The only things sent are an anonymous count of visits and finished rounds, and page views through Vercel
        Analytics (no cookies). You can switch both off, and neither is sent if your browser says Do Not Track. A
        child’s first name is shared only if you turn that on, and switching it off deletes it. If you choose to send
        feedback, what you write is sent to the developer and kept for up to a year.
      </p>

      <p className="sq-note">
        Little Steps is a free project by Pradeep Miriyala, made for children on the autism spectrum and the families who
        practise with them. It is not medical advice, and it does not replace the guidance of your child’s therapist or teacher.
      </p>

      <p className="ls-links">
        <Link href="/parents" className="sq-btn">For parents</Link>
        <Link href="/copyright" className="sq-btn">Copyright</Link>
        <Link href="/" className="sq-btn primary">Back to the games</Link>
      </p>
    </div>
  )
}
