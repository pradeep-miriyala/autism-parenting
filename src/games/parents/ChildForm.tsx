'use client'
// The child's name, age and favourite colour. All optional, all kept on this device.
import { AGES, COLOURS, ageLabel, cleanName, type ColourId } from '../profile'
import { SpeakerIcon } from '../icons'
import { useFeedback } from '../feedback'
import { useApp } from '../store'

export default function ChildForm() {
  const { profile, editProfile, chooseAge, forgetChild, sound } = useApp()
  const { say } = useFeedback(sound)
  return (
    <div className="ls-page">
      <h1 className="ls-h1">Your child</h1>
      <p className="sq-note">
        Optional. Hearing their own name can be encouraging. These details stay on this phone or computer, and are never
        sent anywhere unless you choose to share them (see Privacy).
      </p>
      <div className="sq-parent ls-card">
        <div className="sq-field">
          <label htmlFor="sq-name">Child’s name</label>
          <div className="sq-fieldrow">
            <input id="sq-name" type="text" autoComplete="off" maxLength={24} value={profile.name}
              onChange={e => editProfile({ name: cleanName(e.target.value) })} placeholder="e.g. Aarav" />
            <button type="button" className="sq-icon" aria-label="Hear the name" disabled={!profile.name.trim()}
              onClick={() => say(`Well done, ${profile.say.trim() || profile.name.trim()}.`, true)}>
              <SpeakerIcon />
            </button>
          </div>
        </div>
        {profile.name && (
          <div className="sq-field">
            <label htmlFor="sq-say">Say it like (optional)</label>
            <input id="sq-say" type="text" autoComplete="off" maxLength={24} value={profile.say}
              onChange={e => editProfile({ say: cleanName(e.target.value) })}
              placeholder="spell it as it sounds, if the voice gets it wrong" />
          </div>
        )}
        {profile.name && !sound && <p className="sq-note">Turn the sound on (the menu, or Game settings) so they can hear it.</p>}

        <div className="sq-field">
          <label htmlFor="sq-age">Age</label>
          <select id="sq-age" value={profile.age ?? ''} onChange={e => chooseAge(e.target.value)}>
            <option value="">Not set</option>
            {AGES.map(a => <option key={a} value={a}>{ageLabel(a)}</option>)}
          </select>
        </div>
        <p className="sq-note">Choosing an age the first time suggests how long each game’s rounds start out. You can change them in Game settings, and the games never change them by themselves.</p>

        <div className="sq-field">
          <span className="sq-flabel">Favourite colour for the sprinkles</span>
          <div className="sq-swatches">
            {COLOURS.map(c => (
              <button key={c.id} type="button" aria-pressed={profile.colour === c.id} aria-label={c.label}
                className={`sq-swatch${profile.colour === c.id ? ' on' : ''}`}
                style={c.hex ? { background: c.hex } : undefined}
                onClick={() => editProfile({ colour: c.id as ColourId })}>
                {c.hex ? '' : 'Mix'}
              </button>
            ))}
          </div>
        </div>

        {(profile.name.trim() || profile.age !== null || profile.colour !== 'mix') && (
          <button type="button" className="sq-btn" onClick={forgetChild}>Forget my child’s details</button>
        )}
      </div>
    </div>
  )
}
