#!/usr/bin/env bash
# Stackra file contract:
# Purpose: the Runway command matrix (checklist cli-tool lines 1 and 2): runs every `runway` command once on a Testbed
#          box against this repository's own runway files, with arguments that change nothing (`--dry-run` for the
#          commands that would dispatch or sync, `--help` where a command needs a login the box never has), and
#          checks each exit code against the expected one. Prints one PASS or FAIL line per row and exits 1 on any FAIL.
# Boundary: runs only the built runway binary in the working tree; dispatches no workflow, ships nothing, reads no
#           secret (the box holds none). `status` and `drift` need a GitHub login and a Cloudflare token, so the box
#           checks their `--help`; `secrets decrypt` and `env orphans` refuse outside a proved CI job, which is the row.
#           Run it as `stackra testbed run "<label>" . ./tools/scripts/runway-command-matrix.sh`, never on the Mac.
# Runtime: bash
# Governing contract: ADR 0506 (decision 8); ADR 0484 (the testbed); STA-2104.
set -u

pnpm turbo run build --filter=@stackra/runway --output-logs=errors-only >/dev/null 2>&1 || {
  echo "FAIL build: @stackra/runway did not build"
  exit 1
}

RUNWAY=(node "$PWD/packages/developer/runway/dist/runway.mjs")
HEAD_SHA="$(git rev-parse HEAD)"
failed=0

# The dispatching commands fetch origin/main first; the box has no GitHub login, so they run in a throwaway clone whose
# origin is a local bare repository holding this commit as main. The real remote is never touched.
scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT
git clone -q . "$scratch/repo"
git init -q --bare "$scratch/origin.git"
git -C "$scratch/repo" push -q "$scratch/origin.git" "HEAD:refs/heads/main"
git -C "$scratch/repo" remote set-url origin "$scratch/origin.git"
git -C "$scratch/repo" fetch -q origin

# row <expected exit> <label> <runway words...>: runs the words in $DIR (default here), compares the exit code.
row() {
  local expected="$1" label="$2"
  shift 2
  local out code
  out="$(cd "${DIR:-.}" && env -u GITHUB_ENV -u GITHUB_ACTIONS "${RUNWAY[@]}" "$@" 2>&1)"
  code=$?
  if [ "$code" -eq "$expected" ]; then
    echo "PASS $label (exit $code)"
  else
    failed=1
    echo "FAIL $label (exit $code, expected $expected)"
    printf '%s\n' "$out" | tail -5 | sed 's/^/     /'
  fi
}

row 0 "--version" --version
row 0 "--help" --help
row 0 "plan" plan
row 0 "plan production --json" plan production --json
row 0 "validate" validate
row 0 "env check" env check
row 0 "secrets sync production --dry-run" secrets sync production --dry-run
DIR="$scratch/repo" row 0 "deploy --dry-run" deploy cloudflare-workers --dry-run
DIR="$scratch/repo" row 0 "promote <head> --dry-run" promote "$HEAD_SHA" --dry-run
DIR="$scratch/repo" row 2 "rollback <head> refused" rollback "$HEAD_SHA" --dry-run
row 0 "status --help" status --help
row 0 "drift --help" drift --help
row 1 "secrets decrypt refused without GITHUB_ENV" secrets decrypt --scope ci/deploy
row 1 "env orphans refused outside CI" env orphans production
row 2 "unknown command" no-such-command

echo "MATRIX_RC=$failed"
exit "$failed"
