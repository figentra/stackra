---
"@stackra/cli": minor
---

Add `stackra testbed <verb>` (STA-1626, ADR 0484), the replacement of the Mac script `ci-box`: `run "<session> <what>"
<dir> "<cmd>"` runs heavy work on a free shared test box (claim, rsync, run under the slot's lock, another box on exit
75, one retry of a light job after a lost box, the group's desired count raised after two busy minutes), plus
`status`, `unlock`, `ip`, `ssh`, `sync`, `scale` and `image`. With no healthy box, `run --preset
verify|e2e|integration --ref <ref>` dispatches the GitHub fallback workflow; `--no-wait` exits 75 instead of waiting.
