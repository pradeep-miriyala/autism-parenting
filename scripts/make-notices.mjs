// Writes THIRD_PARTY_NOTICES.md: every package that ships with the site (the production dependencies, and what they
// depend on), with its licence and copyright line, and the full text of each distinct licence once.
// Run after changing dependencies:  npm run notices
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dirs = execSync('npm ls --omit=dev --all --parseable --long=false', { encoding: 'utf8', maxBuffer: 1 << 26 })
  .split('\n').map(s => s.trim()).filter(Boolean).slice(1)

const pkgs = new Map()
for (const dir of dirs) {
  const file = join(dir, 'package.json')
  if (!existsSync(file)) continue
  const p = JSON.parse(readFileSync(file, 'utf8'))
  if (!p.name || pkgs.has(`${p.name}@${p.version}`)) continue
  const lic = typeof p.license === 'string' ? p.license : p.license?.type ?? (p.licenses?.map(l => l.type).join(' OR ')) ?? 'UNKNOWN'
  const licFile = readdirSync(dir).find(f => /^(licen[cs]e|copying)(\.|$)/i.test(f))
  const text = licFile ? readFileSync(join(dir, licFile), 'utf8').trim() : ''
  const copyright = [...new Set(text.split('\n').map(l => l.trim()).filter(l => /^copyright\s*(\(c\)|©)?\s*\d{4}/i.test(l)))].slice(0, 3)
  const repo = (typeof p.repository === 'string' ? p.repository : p.repository?.url ?? p.homepage ?? '').replace(/^git\+/, '').replace(/\.git$/, '')
  pkgs.set(`${p.name}@${p.version}`, { name: p.name, version: p.version, lic, copyright, repo, text })
}

const list = [...pkgs.values()].sort((a, b) => a.name.localeCompare(b.name))
const texts = new Map()
for (const p of list) {
  if (!p.text) continue
  const key = createHash('sha1').update(p.text.replace(/^.*copyright.*$/gim, '').replace(/\s+/g, ' ')).digest('hex')
  if (!texts.has(key)) texts.set(key, { lic: p.lic, text: p.text, who: [] })
  texts.get(key).who.push(p.name)
}

let out = `# Third-party notices

Little Steps is licensed under the GNU Affero General Public License v3 (see LICENSE). It is built on the open source
packages below. Each keeps its own licence and copyright. This file is made by \`npm run notices\`; please do not edit it by hand.

## Fonts

The typefaces Faustina, Literata and Karla are loaded from Google Fonts. They are under the SIL Open Font Licence 1.1
(https://openfontlicense.org). They are not stored in this repository.

## Emoji

The small emoji pictures on tiles and stickers are drawn by the phone or computer using its own emoji font. Their
designers hold the rights to them. They are not part of this repository.

## Packages (${list.length})

`
for (const p of list) {
  out += `- **${p.name}** ${p.version}, ${p.lic}${p.repo ? `, ${p.repo}` : ''}\n`
  for (const c of p.copyright) out += `  - ${c}\n`
}
out += '\n## Licence texts\n'
for (const t of texts.values()) {
  out += `\n### ${t.lic}\n\nUsed by: ${t.who.slice(0, 12).join(', ')}${t.who.length > 12 ? `, and ${t.who.length - 12} more` : ''}\n\n\`\`\`\n${t.text}\n\`\`\`\n`
}
writeFileSync('THIRD_PARTY_NOTICES.md', out)
console.log(`${list.length} packages, ${texts.size} licence texts`)
