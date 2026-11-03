---
"@stackra/cli": minor
---

`stackra gen` at a workspace root now writes Claude Code's `.claude/launch.json` and VS Code's `dev: <name>` tasks
from the runways: one server per web surface of the root runway (built, then `stackra preview serve`) and one per app
or Worker member with a dev port, each building first so it starts on a clean checkout. `stackra validate --repository`
refuses a hand-edited or stale file and two servers on one port; `stackra gen --check` fails on a stale one.
