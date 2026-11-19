// Writes ../fixtures/phrases.md: every word and phrase write-good knows, so
// compare.mjs exercises all of them.
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {adverb, cliche, eprime, passive, weasel, wordy} from './lists.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const out = []

const section = (title, items, sentence) => {
  out.push(`# ${title}`, '')
  for (const item of items) out.push(sentence(item), '')
}

const plain = (p) => `We saw ${p} there. ${cap(p)} came next.`

section('Weasel', weasel.weasels, (p) => `${plain(p)} We saw too ${p} of them.`)
section('Passive', passive.irregulars, (p) => `It was ${p} then. They were\n${p} again.`)
section('Adverbs', [...adverb.adverbs.map((a) => `${a}y`), ...adverb.weakens], plain)
section('TooWordy', wordy.wordyWords, (p) => `${plain(p)} A pre-${p} case.`)
section('Cliches', cliche.cliches, (p) => `${plain(p)} We saw ${p.replace(/ /, '\n')} again.`)
section('E-Prime', eprime.toBe, (p) => `${plain(p)} We saw ${p.replace(/'/g, '’')} there.`)

fs.mkdirSync(path.join(here, '..', 'fixtures'), {recursive: true})
fs.writeFileSync(path.join(here, '..', 'fixtures', 'phrases.md'), out.join('\n'))
