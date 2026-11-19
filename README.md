# write-good [![Build Status](https://travis-ci.org/errata-ai/write-good.svg?branch=master)](https://travis-ci.org/github/errata-ai/write-good) ![Vale version](https://img.shields.io/badge/vale-%3E%3D%20v3.28.1-blue.svg) ![license](https://img.shields.io/github/license/mashape/apistatus.svg)

> [`write-good`](https://github.com/btford/write-good): Naive linter for English prose for developers who can't write good and wanna learn to do other stuff good too.

This repository contains a [Vale-compatible](https://github.com/errata-ai/vale) implementation of the guidelines enforced by the `write-good` ([LICENSE](https://github.com/btford/write-good/blob/master/LICENSE)) linter.

## Getting Started

To get started, add the package to your configuration file (as shown below) and then run `vale sync`.

```ini
StylesPath = styles
MinAlertLevel = suggestion

Packages = write-good

[*]
BasedOnStyles = write-good
```

## Rules

The rules are generated from the checks that `write-good` 1.0.8 ships, one
rule per check, with the same word lists and the same patterns.

| Rule | `write-good` check |
| ---- | ------------------ |
| `Weasel` | `weasel` |
| `Illusions` | `illusion` |
| `So` | `so` |
| `ThereIs` | `thereIs` |
| `Passive` | `passive` |
| `Adverbs` | `adverb` |
| `TooWordy` | `tooWordy` |
| `Cliches` | `cliches` |
| `E-Prime` | `eprime` |

`write-good` leaves `eprime` off unless asked. To do the same:

```ini
write-good.E-Prime = NO
```

## Differences from write-good

On plain text the style reports what `write-good` reports, at the same line
and column, except:

- `write-good` reads every file as plain text. In Markdown and the other
  formats Vale understands, the style skips code, URLs, and front matter,
  and reads through inline markup such as `**bold**`.
- `write-good` folds two findings on the same words into one line. Vale
  reports one per rule.
- When more than one space leads a sentence, `write-good` places `So` and
  `ThereIs` one character into the gap. Vale reports where the word is.

## Development

```console
$ cd script
$ npm install
$ npm run generate   # rewrite write-good/*.yml and fixtures/phrases.md
$ cd ..
$ ./test.sh          # compare with the golden file, then with write-good itself
```

To move to a newer `write-good`, change its version in `script/package.json`
and run the same steps. `script/compare.mjs` takes any files and prints each
finding the two tools disagree on.
