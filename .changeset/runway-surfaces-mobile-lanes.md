---
"@stackra/runway": minor
---

The root runway gains `surfaces` (each web surface's shell line, preset, packages, hosts with one canonical, and a
landing site's `content`; `ops` holds only a declarative `contributes`, so a component, entry, script or module-path
block fails) and `mobile` (template line, packages, `assets` and `store` paths under `assets/`, identity, capability
flags, tablet, store accounts, EAS project and per-tenant `whiteLabel`), ADR 0441 and 0439. `environments.dev.lanes`
gains the repository index table (`repos`, no index shared) and `worktrees`; `checkPorts(root, members)` and `PortIssue`
report every duplicate effective dev port across the lanes, naming both owners (STA-863). An app runway's
`release.mobile.whiteLabel` takes `true` or the `whiteLabel` block. The shipped `schema/root.json` and `schema/app.json`
carry the same change, byte-identical to `tools/schemas/runway-root.schema.json` and `runway-app.schema.json`.
