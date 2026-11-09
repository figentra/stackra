---
"@stackra/repo-checks": minor
---

`stackra validate --repository` checks the skill and agent sources: a skill that teaches rejected technology (ADR 0227) without a reasoned allowance, and an agent that names a missing path, is told to run a command without Bash, sets
an OpenCode `allow`, names the retired `sdlc` plugin, or is routed to OpenCode at a tier OpenCode does not run. These
are the checks core's agents-sync script ran, moved here now that Flow projects `.agents/` (STA-2098 H6).
