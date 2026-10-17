'use client'
// The sticker album: one for every few rounds finished. Only ever shows what has been earned and how many are left;
// there is no score and nothing is taken away.
import { STICKERS } from './progress'
import { useApp } from './store'

export default function StickerBook() {
  const { progress, profile } = useApp()
  const got = progress.stickers
  const who = profile.name.trim()
  return (
    <div className="ls-page">
      <h1 className="ls-h1">{who ? `${who}’s stickers` : 'My stickers'}</h1>
      <p className="sq-note">{got.length === 0 ? 'Finish a round to get your first sticker.' : `${got.length} of ${STICKERS.length}`}</p>
      <ul className="sq-stickers">
        {STICKERS.map((st, i) => {
          const have = got.includes(i)
          return <li key={i} className={have ? 'got' : 'empty'} aria-label={have ? st.label : 'Not yet'}>{have ? st.emoji : ''}</li>
        })}
      </ul>
    </div>
  )
}
