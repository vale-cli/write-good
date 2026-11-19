// The word lists inside write-good's checks. None of the packages export
// them, so each source file is run up to the point where its list is built.
import fs from 'node:fs'
import vm from 'node:vm'
import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)

function read(file, names, until) {
  let source = fs.readFileSync(require.resolve(file), 'utf8')
  if (until) source = source.slice(0, source.indexOf(until))
  return vm.runInNewContext(`${source}\n;({${names.join(', ')}})`, {
    require: () => () => [],
    module: {}
  })
}

export const version = (name) => require(`${name}/package.json`).version

export const weasel = read('weasel-words', ['weasels', 'exceptions'], 'var re =')
export const passive = read('passive-voice', ['irregulars', 'exceptions'], 'var re =')
export const adverb = read('adverb-where', ['adverbs', 'weakens'], 'const adverbRegex')
export const wordy = read('too-wordy', ['wordyWords'], '// Replace')
export const cliche = read('no-cliches', ['cliches'], '// Replace')
export const eprime = read('e-prime', ['toBe'], 'var re =')
