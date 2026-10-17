'use client'
// The Jigsaw screen: each round is either a parent's photo (PhotoJigsaw) or one of the drawn pictures (PuzzleGame),
// as the parent chose on Your pictures. With no photos, or on a browser that cannot keep them, it is the drawn
// pictures only, exactly as before.
import { useCallback, useEffect, useRef, useState } from 'react'
import PuzzleGame from './PuzzleGame'
import PhotoJigsaw from './PhotoJigsaw'
import { pickPhoto } from './pictures/prefs'
import { listPhotos, type Photo } from './pictures/store'
import { useApp } from './store'
import type { Profile } from './profile'

type Props = {
  level: number
  sound: boolean
  profile: Profile
  sprinklesOn: boolean
  hintSec: number
  onActive?: (active: boolean) => void
  onDone?: () => void
}

export default function JigsawGame(props: Props) {
  const { jigsaw } = useApp()
  const [photos, setPhotos] = useState<Photo[] | null>(null)
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [round, setRound] = useState(0)
  const last = useRef<number | null>(null)
  const bad = useRef(new Set<number>())   // photos that would not open this visit

  const choose = useCallback((list: Photo[]) => {
    const usable = list.filter(p => !bad.current.has(p.slot))
    const slot = pickPhoto(jigsaw.pictures, usable.map(p => p.slot), last.current)
    last.current = slot
    return slot === null ? null : usable.find(p => p.slot === slot) ?? null
  }, [jigsaw.pictures])

  // The photos are read once, when the game opens. The drawn pictures need nothing, so they never wait.
  useEffect(() => {
    let live = true
    if (jigsaw.pictures === 'cartoons') { setPhotos([]); setPhoto(null); return }
    listPhotos().then(list => {
      if (!live) return
      setPhoto(choose(list))
      setPhotos(list)
    })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jigsaw.pictures])

  const next = useCallback(() => { setPhoto(choose(photos ?? [])); setRound(r => r + 1) }, [choose, photos])
  const broken = useCallback(() => {
    if (photo) bad.current.add(photo.slot)
    next()
  }, [photo, next])

  if (photos === null) return null
  return photo
    ? <PhotoJigsaw key={round} photo={photo.blob} level={props.level} plain={jigsaw.plain} guide={jigsaw.guide}
        sound={props.sound} profile={props.profile} sprinklesOn={props.sprinklesOn} hintSec={props.hintSec}
        onActive={props.onActive} onDone={props.onDone} onNext={next} onBroken={broken} />
    : <PuzzleGame key={round} {...props} onNext={next} />
}
