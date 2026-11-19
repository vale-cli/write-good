#!/bin/sh
#
# Two checks. The edge cases in fixtures/edges.md are linted and compared to
# a golden file, which needs nothing but Vale. Then, when the scripts'
# dependencies are installed, the original write-good is run over every fixture
# and has to agree with the style finding for finding.
#
# `./test.sh -u` rewrites the golden file instead of comparing.
set -eu

# One sort order on every machine.
export LC_ALL=C

update=0
[ "${1:-}" = "-u" ] && update=1
status=0

root=$(cd "$(dirname "$0")" && pwd)
vale=${VALE:-vale}
mkdir -p "$root/testdata"

# Alerts that share a line and column come back in whatever order the checks
# ran. Sorting compares the set.
golden=$root/testdata/edges.md.txt
got=$(cd "$root/fixtures/golden" && "$vale" --output=line --no-global ../edges.md 2>&1 | sort -t: -k2,2n -k3,3n -k4,4 || true)

if [ "$update" -eq 1 ]; then
	printf '%s\n' "$got" > "$golden"
	echo "golden file rewritten"
elif [ "$got" != "$(cat "$golden")" ]; then
	echo "FAIL edges.md"
	printf '%s\n' "$got" | diff -u "$golden" - || true
	status=1
else
	echo "ok   edges.md ($(printf '%s' "$got" | grep -c . || true) alerts)"
fi

if [ -d "$root/script/node_modules" ]; then
	(cd "$root/script" && VALE="$vale" node compare.mjs ../fixtures/edges.md ../fixtures/phrases.md) || status=1
else
	echo "skip comparison with write-good: run 'npm install' in script/"
fi

exit $status
