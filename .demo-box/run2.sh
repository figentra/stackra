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
run "./demo deploy staging --name hotfix --regions eu-west-1 --regions me-central-1 --json"
run "COLUMNS=40 ./demo status"
run "./demo help deploy"
echo
echo "DEMO-DONE"
