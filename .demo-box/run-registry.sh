#!/usr/bin/env bash
# Box proof of ~/Projects/figentra/sandbox/console-demo exactly as it is: @stackra/console 0.6.1 from the registry.
set -euo pipefail
ROOT=$PWD
D=$(mktemp -d /tmp/console-demo.XXXX)
cp -R "$ROOT/.demo-box/app/." "$D/"
cd "$D"
grep -A3 dependencies package.json
echo "== npm install"
npm install --no-audit --no-fund 2>&1 | tail -3
npm ls @stackra/console @stackra/validation ink @clack/prompts 2>&1 | tail -8
chmod +x demo
echo "== typecheck"
npx tsc --noEmit && echo "typecheck: clean"
set +e
export COLUMNS=100
HAS_SCRIPT=1
command -v script >/dev/null && HAS_SCRIPT=1
# A scenario: the command line, then its output and exit code.
run() {
  printf '\n────────────────────────────────────────\n$ %s\n' "$1"
  bash -c "$1" 2>&1
  printf '[exit %s]\n' "$?"
}
# On a pseudo-terminal (colour, banner, spinners, Ink, prompts): args are the command, a delay before the keys, the
# keys, and how many trailing lines to keep. Escape sequences are stripped so the log reads as text.
tty() {
  printf '\n────────────────────────────────────────\n$ %s   # on a terminal\n' "$1"
  if [ "$HAS_SCRIPT" = 1 ]; then
    (
      sleep "${2:-0}"
      printf "${3:-}"
      sleep 4
    ) | script -qefc "$1" /dev/null 2>&1 | tr -d '\r' | sed 's/\x1b\[[0-9;?]*[A-Za-z]//g; s/\x1b\][^\x07]*\x07//g' | tail -n "${4:-60}"
    printf '[exit %s]\n' "${PIPESTATUS[1]}"
  else
    echo "(no script(1) on this box)"
  fi
}
# Counts the escape bytes a command writes.
escapes() {
  printf '\n────────────────────────────────────────\n$ %s   # escape bytes written\n' "$1"
  bash -c "$1" 2>&1 | tr -cd '\033' | wc -c
}

echo
echo "################ routing"
run "./demo | cat"
run "./demo --help"
run "./demo help deploy"
run "./demo deploy --help"
run "./demo --version"
run "./demo -V"
run "./demo stauts"
run "./demo deploy dev --nope"
run "./demo deploy dev --replicas 9"

echo
echo "################ tables, checklist, tree, key-value, problem"
run "./demo status"
run "./demo status --broken"
run "./demo status --json"
run "./demo status --broken --json"
run "COLUMNS=40 ./demo status"
run "./demo check"
run "./demo check --broken"
run "./demo check --broken --json"
run "./demo tree"
run "./demo tree --verbose"
run "./demo info"
run "./demo info 2>/dev/null"
run "./demo whoami"
run "./demo whoami --json"

echo
echo "################ prompts"
run "./demo deploy < /dev/null"
run "./demo deploy dev -n"
run "./demo deploy staging --name hotfix --regions eu-west-1 --regions me-central-1 --json"
run "./demo deploy dev --json < /dev/null"

echo
echo "################ tasks, the failure screen"
run "./demo deploy dev --fail -n"
run "./demo deploy dev --fail -n --verbose"
run "./demo deploy dev --fail --json"

echo
echo "################ live (Ink on a terminal)"
run "./demo watch"
run "./demo watch --broken"
run "./demo watch --json"

echo
echo "################ colour and plain"
escapes "script -qefc './demo status' /dev/null"
escapes "NO_COLOR=1 script -qefc './demo status' /dev/null"
escapes "script -qefc './demo status --no-ansi' /dev/null"
escapes "./demo status"
escapes "./demo status --ansi"

echo
echo "################ completions"
run "./demo completion zsh | head -20"
run "./demo completion bash | head -5"
run "./demo completion fish | head -5"
run "./demo complete -- d"
run "./demo complete -- deploy ''"
run "./demo complete -- deploy dev --re"
run "./demo completion powershell"

echo
echo "################ MCP tools from the commands"
run "./demo mcp"
run "./demo mcp --call check --input '{\"broken\":true}'"
run "./demo mcp --call deploy --input '{\"environment\":\"dev\"}'"
run "./demo mcp --call deploy --input '{}'"
run "./demo mcp --call nope"
run "printf '%s\n' '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-06-18\"}}' '{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}' '{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\"}' '{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"status\",\"arguments\":{\"broken\":true}}}' | ./demo mcp --serve"

echo
echo "################ passthrough"
run "./demo legacy hello world --upper"
run "./demo legacy -u"
run "./demo legacy --help"
run "./demo legacy --nope"


P="python3 $ROOT/.demo-box/pty-drive.py"
run() {
  printf '\n────────────────────────────────────────\n$ %s\n' "$1"
  bash -c "$1" 2>&1
  printf '[exit %s]\n' "$?"
}
term() {
  printf '\n────────────────────────────────────────\n$ %s   # on a 100-column terminal\n' "$1"
  $P "$@"
}

echo
echo "################ on a terminal"
term "./demo"
term "./demo deploy" "Where should the release go" '\x1b[B\r' "What should the release be called" 'hotfix\r' "Which regions" '\x1b[B \r'
term "./demo deploy staging" "What should the release be called" '\r' "Which regions" '\r'
term "./demo deploy" "Where should the release go" '\x03'
term "./demo deploy dev --regions eu-west-1 --regions me-central-1 -n"
term "./demo deploy dev --fail -n"
term "./demo watch"
term "./demo watch --broken"
term "./demo status"
term "./demo check --broken"
term "./demo info"
echo
echo DEMO-DONE
