---
"@stackra/gen": minor
---

A service that declares `@stackra/versioning` gets a versioned adapter: each action and query runs inside `serveVersioned` with its output schema. A list whose items have a dated `Change` warns `versioned_items_not_applied`, since only the top-level output is downgraded. Every other member's generated files are unchanged.
