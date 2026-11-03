#!/usr/bin/env bash
# Why does `./demo deploy staging` on a terminal never show its name prompt to the driver?
set -euo pipefail
ROOT=$PWD
D=$(mktemp -d /tmp/console-demo.XXXX)
cp -R "$ROOT/.demo-box/app/." "$D/"
cd "$D"
npm install --no-audit --no-fund > /tmp/demo-npm.log 2>&1 || tail -20 /tmp/demo-npm.log
chmod +x demo
set +e
P="python3 $ROOT/.demo-box/pty-drive.py"
echo "== staging, no keys (30 s), raw tail printed"
$P "./demo deploy staging" "NEVER-MATCHES" ''
echo "== staging, the scenario as written"
$P "./demo deploy staging" "What should the release be called" '\r' "Which regions" '\r'
echo "== staging given as --flag form is not possible; env via the prompt instead"
$P "./demo deploy" "Where should the release go" '\x1b[B\r' "What should the release be called" '\r' "Which regions" '\r'
echo DEBUG-DONE
