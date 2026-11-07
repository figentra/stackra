---
"@stackra/runway": patch
---

The Encore deploy commit holds every service member as one Encore app at the repository root (STA-2194): it rewrites
each member's `#` imports to relative paths through the member's own package.json map (Encore resolves neither
`imports` nor a per-member tsconfig), drops the members' `__tests__` folders and writes `encore.app` at the root. A
product with several services (billing, pay, commerce, os) now deploys as one app, and the members' apps must name one
Encore app id.
Each service declares `encore.dev`, which Encore Cloud installs from the service's package.json.
