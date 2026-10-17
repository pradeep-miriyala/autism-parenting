'use client'
// Your pictures: add photos for the Jigsaw.
import PicturesSettings from '../PicturesSettings'

export default function PicturesPage() {
  return (
    <div className="ls-page">
      <h1 className="sq-sr">Your pictures</h1>
      <div className="sq-parent ls-card">
        <PicturesSettings />
      </div>
    </div>
  )
}
