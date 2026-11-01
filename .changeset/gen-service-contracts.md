---
"@stackra/gen": minor
"@stackra/skills": minor
"@stackra/repo-checks": patch
"@stackra/cli": patch
---

Gen reads a consumed service from a sibling folder or from a dependency whose `package.json` has `stackra.kind`
`contract` (a producer's published `stackra.manifest.json`, OpenAPI and lang, no source) and whose manifest `member` is
the service, never by matching a dependency's member name, which could pick a package's manifest for a service of the
same name. A contract package is never hosted. Its client and lang are generated; a listener of its events is refused
with `client_event_remote_transport` until the event-transport ADR. `StackraKind` gains `contract` (a new kind, so
skills is minor); `stackra add` does not offer it; repo-checks asks a contract package only for its kind and manifest.
