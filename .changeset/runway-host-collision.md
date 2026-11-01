---
"@stackra/runway": patch
---

Two surfaces whose hosts resolve to one name in an environment are refused as `host_collision`, naming the host, the
environment and both surfaces: `checkHosts(root)`, applied by `parseRunway("root")` (so `stackra validate` and
`runway plan` fail) and by `platformRows`, where the second surface used to overwrite the first one's edge KV row
(STA-1796).
