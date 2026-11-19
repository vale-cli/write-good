// Runs the original write-good and this style over the same files and
// reports where they disagree.
//
//   node compare.mjs [-v] <file>...
//
// Set VALE to test a particular binary. Exits 1 on any difference.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'

const require = createRequire(import.meta.url)
const here = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const verbose = args[0] === '-v' && args.shift()
const files = args.map((f) => path.resolve(f))

// write-good folds findings that share a span into one line. The checks are
// run one at a time here so each can be set against its rule.
const checks = {
  Weasel: require('weasel-words'),
  Illusions: require('write-good/lib/lexical-illusions'),
  So: require('write-good/lib/starts-with-so'),
  ThereIs: require('write-good/lib/there-is'),
  Passive: require('passive-voice'),
  Adverbs: require('adverb-where'),
  TooWordy: require('too-wordy'),
  Cliches: require('no-cliches'),
  'E-Prime': require('e-prime')
}

const squash = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase()

function original(file) {
  const text = fs.readFileSync(file, 'utf8')
  const found = []
  for (const [rule, check] of Object.entries(checks)) {
    for (const s of check(text)) {
      // write-good counts one leading space where a sentence has several,
      // which leaves these two checks pointing at the gap and running long.
      let {index, offset} = s
      if (rule === 'So' || rule === 'ThereIs') {
        const from = index
        while (/\s/.test(text[index])) index++
        if (rule === 'ThereIs') offset -= index - from
      }
      const before = text.slice(0, index)
      const line = before.split('\n').length
      found.push({
        line,
        // Columns count characters, not UTF-16 units.
        col: [...before.slice(before.lastIndexOf('\n') + 1)].length + 1,
        text: squash(text.substr(index, offset)),
        rule
      })
    }
  }
  return found
}

function vale(list) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'write-good-'))
  const config = path.join(dir, '.vale.ini')
  fs.writeFileSync(
    config,
    `StylesPath = ${path.join(here, '..')}\nMinAlertLevel = suggestion\n\n[*]\nBasedOnStyles = write-good\n`
  )
  const result = spawnSync(
    process.env.VALE || 'vale',
    ['--no-global', '--no-exit', '--output=JSON', `--config=${config}`, ...list],
    {encoding: 'utf8', maxBuffer: 1 << 30}
  )
  fs.rmSync(dir, {recursive: true})
  if (result.status !== 0 || !result.stdout.trim().startsWith('{')) {
    throw new Error(result.stderr || result.stdout)
  }
  const out = {}
  for (const [file, alerts] of Object.entries(JSON.parse(result.stdout))) {
    out[path.resolve(file)] = alerts.map((a) => ({
      line: a.Line,
      col: a.Span[0],
      text: squash(a.Match),
      rule: a.Check.replace('write-good.', '')
    }))
  }
  return out
}

const key = (a) => `${a.line}:${a.col} ${a.rule} "${a.text}"`

// Multiset difference: what is in `a` and not in `b`.
function minus(a, b) {
  const counts = new Map()
  for (const x of b) counts.set(key(x), (counts.get(key(x)) || 0) + 1)
  return a.filter((x) => {
    const n = counts.get(key(x)) || 0
    if (n > 0) counts.set(key(x), n - 1)
    return n === 0
  })
}

const ours = vale(files)
const total = {original: 0, vale: 0, missing: 0, extra: 0}
const rules = {}

for (const file of files) {
  const want = original(file)
  const got = ours[file] || []
  const missing = minus(want, got)
  const extra = minus(got, want)
  const bad = missing.length + extra.length > 0

  total.original += want.length
  total.vale += got.length
  total.missing += missing.length
  total.extra += extra.length
  for (const m of missing) (rules[m.rule] ||= [0, 0])[0]++
  for (const m of extra) (rules[m.rule] ||= [0, 0])[1]++

  if (bad || verbose) {
    console.log(
      `${bad ? 'FAIL' : 'ok  '} ${path.relative(process.cwd(), file)}: write-good ${want.length}, vale ${got.length}, missing ${missing.length}, extra ${extra.length}`
    )
  }
  const limit = verbose ? Infinity : 10
  for (const m of missing.slice(0, limit)) console.log(`  - ${key(m)}`)
  for (const m of extra.slice(0, limit)) console.log(`  + ${key(m)}`)
}

for (const [rule, [missing, extra]] of Object.entries(rules)) {
  console.log(`${rule}: missing ${missing}, extra ${extra}`)
}
console.log(
  `${files.length} files: write-good ${total.original}, vale ${total.vale}, missing ${total.missing}, extra ${total.extra}`
)
process.exit(total.missing + total.extra > 0 ? 1 : 0)
