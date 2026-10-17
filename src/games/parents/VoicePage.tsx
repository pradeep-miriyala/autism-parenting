'use client'
// Your voice: record up to three congratulations to play in place of the computer voice.
import VoiceSettings from '../VoiceSettings'
import { useApp } from '../store'

export default function VoicePage() {
  const { useRecordings, setUseRecordings } = useApp()
  return (
    <div className="ls-page">
      <h1 className="sq-sr">Your voice</h1>
      <div className="sq-parent ls-card">
        <VoiceSettings useRecordings={useRecordings} onUseRecordings={setUseRecordings} />
      </div>
    </div>
  )
}
