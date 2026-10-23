// src/app/copyright/page.tsx — who made Little Steps, what is covered, and what belongs to others. In plain words,
// like the About page. The only links are on this site.
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Copyright',
  description: 'Who made Little Steps, what is covered by copyright, what stays yours, and the open source parts it is built on.',
}

const YEAR = 2026

export default function CopyrightPage() {
  return (
    <div className="ls-page ls-about">
      <h1 className="ls-h1">Copyright</h1>
      <p className="sq-ph-dek">© {YEAR} Pradeep Miriyala.</p>

      <h2 className="sq-subhead">Little Steps</h2>
      <p className="sq-ph-text">
        The games, drawings, words, sounds and code of Little Steps were made by Pradeep Miriyala.
      </p>
      <p className="sq-ph-text">
        The code is open source under the GNU Affero General Public License v3. Anyone may read it, run it and change it.
        If someone shares a changed version, or runs one for others, they must share their changes under the same
        licence. The name Little Steps and its icon are not part of that licence.
      </p>
      <p className="sq-ph-text">
        The source code is on GitHub, as pradeep-miriyala/autism-parenting. A grown-up can find the link in the parents’ area.
      </p>
      <p className="sq-ph-text">
        Using Little Steps with your own child is what it is for. Sharing the link with other families is always welcome.
      </p>

      <h2 className="sq-subhead">What stays yours</h2>
      <p className="sq-ph-text">
        The photos you add to the Jigsaw, the family pictures and names you add, and the recordings you make are yours. They stay on your phone or computer.
        Little Steps makes no claim on them.
      </p>

      <h2 className="sq-subhead">Feedback you send</h2>
      <p className="sq-ph-text">
        If you send feedback, you let the developer read it and use it to make Little Steps better. The words are still yours.
      </p>

      <h2 className="sq-subhead">Parts made by others</h2>
      <p className="sq-ph-text">Little Steps is built on work shared by other people. Thank you to them.</p>
      <ul className="ls-list">
        <li>Next.js and React, by Vercel and Meta, under the MIT licence.</li>
        <li>Vercel Analytics, under the MIT licence.</li>
        <li>The QR code library qrcode-generator, by Kazuhiko Arase, under the MIT licence.</li>
        <li>The MongoDB driver, under the Apache 2.0 licence.</li>
        <li>The typefaces Faustina, Literata and Karla, from Google Fonts, under the SIL Open Font Licence.</li>
        <li>The small emoji pictures on tiles and stickers are drawn by your own phone or computer. Their designers hold the rights to them.</li>
      </ul>

      <p className="sq-note">
        The full list, with every licence, is in THIRD_PARTY_NOTICES.md in the source code.
      </p>

      <p className="sq-note">
        Little Steps is not medical advice, and it does not replace the guidance of your child’s therapist or teacher.
      </p>

      <p className="ls-links">
        <Link href="/about" className="sq-btn">About</Link>
        <Link href="/parents/feedback" className="sq-btn">Send feedback</Link>
        <Link href="/" className="sq-btn primary">Back to the games</Link>
      </p>
    </div>
  )
}
