#!/bin/sh
# Stackra file contract:
# Purpose: install as `~/.local/bin/ci-box`: maps the old `ci-box run|status|unlock|ip|ssh|sync` calls to
#          `stackra testbed ...` so every session keeps working during the migration (plan.md phases 5 and 6). `run`
#          passes `--no-wait`; when it exits 75 (no healthy testbed box) or 73 (every slot busy) the call goes to box 1's
#          script, kept as `~/.local/bin/ci-box.legacy`, with the testbed-only flags dropped (that script takes
#          positionals only and prints no JSON line). Every run appends one line to ~/.ci-box-shim.log.
#          `put-env` is retired: tokens come from Infisical.
# Boundary: POSIX sh; starts only `stackra` and the legacy script; reads and prints no secret. Deleted with the legacy
#           script at phase 7 (runbook step 25 removes the --no-wait fallback first).
# Runtime: sh
# Governing contract: ADR 0484 (the testbed), as amended by ADR 0522; STA-1626; runbook step 20.
set -u
# The Session Manager plugin is mise-installed but not on PATH outside core and testbed: stackra testbed needs it for SSM.
PATH=$HOME/.local/share/mise/installs/aqua-aws-session-manager-plugin/latest/sessionmanager-bundle/bin:$HOME/Library/pnpm/bin:$PATH
LEGACY="${CI_BOX_LEGACY:-$HOME/.local/bin/ci-box.legacy}"
box=
if [ "${1:-}" = -b ]; then
  box=${2:?ci-box: -b needs a box number}
  shift 2
fi
verb=${1:-}
[ $# -gt 0 ] && shift
case "$verb" in
  run)
    stackra testbed run --no-wait "$@"
    code=$?
    fb=no
    # shortcut: a job command that itself exits 73 or 75 also falls back; accepted until step 25 ends the fallback.
    if { [ "$code" -eq 73 ] || [ "$code" -eq 75 ]; } && [ -x "$LEGACY" ]; then fb=yes; fi
    printf '%s run exit=%s fallback=%s\n' "$(date -u +%FT%TZ)" "$code" "$fb" >>"$HOME/.ci-box-shim.log"
    if [ "$fb" = yes ]; then
      echo "ci-box: no free testbed slot (exit $code), using box 1; its output is plain, with no JSON line" >&2
      # Box 1's script takes positionals only: drop every testbed flag, wherever it sits, and the value of those with one.
      n=$#
      while [ "$n" -gt 0 ]; do
        a=$1
        shift
        n=$((n - 1))
        case $a in
          --preset | --ref | --region | --regions | --box | --slot | --serve)
            if [ "$n" -gt 0 ]; then
              shift
              n=$((n - 1))
            fi
            ;;
          --*) ;;
          *) set -- "$@" "$a" ;;
        esac
      done
      exec "$LEGACY" run "$@"
    fi
    exit "$code"
    ;;
  status)
    stackra testbed status "$@"
    [ -x "$LEGACY" ] && "$LEGACY" status
    exit 0
    ;;
  unlock | ip | sync)
    if [ -n "$box" ]; then exec stackra testbed "$verb" --box "$box" "$@"; fi
    exec stackra testbed "$verb" "$@"
    ;;
  ssh)
    if [ -n "$box" ]; then set -- --box "$box" -- "$@"; elif [ $# -gt 0 ]; then set -- -- "$@"; fi
    exec stackra testbed ssh "$@"
    ;;
  put-env)
    echo "ci-box: put-env is retired; testbed jobs get their tokens from Infisical (ADR 0484)" >&2
    exit 2
    ;;
  *)
    echo 'usage: ci-box run "<session> <what>" <dir> "<cmd>" | status | [-b N] unlock|ip|ssh [cmd]|sync <dir>' >&2
    exit 1
    ;;
esac
