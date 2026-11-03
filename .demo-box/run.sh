#!/usr/bin/env bash
# Box proof of ~/Projects/figentra/sandbox/console-demo against tarballs packed from main (0.6.0 is not published yet).
set -euo pipefail
ROOT=$PWD
T=$(mktemp -d /tmp/console-tarballs.XXXX)
D=$(mktemp -d /tmp/console-demo.XXXX)
echo "== build @stackra/console and its workspace dependencies"
pnpm turbo run build --filter=@stackra/console... --output-logs=errors-only | tail -5
echo "== pack"
for dir in $(pnpm --filter "@stackra/console..." exec pwd); do (cd "$dir" && pnpm pack --pack-destination "$T" >/dev/null); done
ls "$T"
cp -R "$ROOT/.demo-box/app/." "$D/"
cd "$D"
# Point every @stackra/* package at its tarball (the Mac copy keeps "0.6.0" from the registry).
node -e '
const fs = require("fs"), path = require("path");
const dir = process.argv[1];
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const local = {};
for (const file of fs.readdirSync(dir)) {
  const name = "@stackra/" + file.replace(/^stackra-/, "").replace(/-\d+\.\d+\.\d+.*\.tgz$/, "");
  local[name] = "file:" + path.join(dir, file);
}
for (const name of Object.keys(pkg.dependencies)) if (local[name]) pkg.dependencies[name] = local[name];
pkg.overrides = local;
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
console.log(JSON.stringify(local, null, 2));
' "$T"
echo "== npm install"
npm install --no-audit --no-fund 2>&1 | tail -3
chmod +x demo
echo "== typecheck"
npx tsc --noEmit && echo "typecheck: clean"

set +e
export COLUMNS=100
HAS_SCRIPT=0
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
tty "./demo"
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
run "COLUMNS=60 ./demo status"
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
run "./demo deploy staging --name hotfix --regions eu-west-1,me-central-1 --json"
run "./demo deploy dev --json < /dev/null"
tty "./demo deploy" 2 '\033[B\r'
tty "./demo deploy" 2 '\033[B\r'"hotfix"'\r \033[B \r'

echo
echo "################ tasks, the failure screen"
run "./demo deploy dev --fail -n"
run "./demo deploy dev --fail -n --verbose"
run "./demo deploy dev --fail --json"
tty "./demo deploy dev -n"
tty "./demo deploy dev --fail -n"

echo
echo "################ live (Ink on a terminal)"
run "./demo watch"
run "./demo watch --broken"
run "./demo watch --json"
tty "./demo watch" 0 "" 80
tty "./demo watch --broken" 0 "" 80

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
echo
echo "DEMO-DONE"
