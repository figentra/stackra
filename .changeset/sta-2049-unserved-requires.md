---
"@stackra/runway": minor
"@stackra/repo-checks": minor
---

`checkRequires(root, service)` reports each `valkey` entry of a service runway's `requires` that no environment's cache driver serves, at `requires.<name>`; `stackra validate` (`checkRunwayFiles`) now runs it for every service runway against the root (STA-2049).
