---
title: Module boundary
description: Tier direction, placement test, service ownership, and factories-not-literals in shared packages.
always: false
applies_to: ["packages/**", "services/**", "apps/**", "**/package.json"]
manual: false
---

# Module boundary

- **Tiers** (`apps/*` app, `packages/<category>/*` lib, `packages/tooling/*` config, `services/*` service): config
  depends on nothing local; lib on config/lib; app on config/lib and reaches services over the wire only; service on
  config/lib. Never the reverse. See `workspace-layout`.
- **Placement test:** would a second, unrelated product still need this verbatim? Yes: a package in a category.
  It only composes packages into something that runs: an app or service. It would need renaming elsewhere: it
  belongs to the app or service that owns it.
- **No deep imports.** A package is used through its declared `exports`, never another package's `src/`.
- **Services are independent members.** A service never imports another service's source. Cross-service calls use
  a generated typed client or a published event; shared shapes live in a contract package
  (`/adr/0015-contract-packages`). A service may import another's event `Topic` and nothing else from it.
- **A service owns** its entry, database and migrations, topics, public API and tests. Reading another service's
  database is read-only and only where an ADR names the pair. No distributed transactions: order steps so a partial
  failure is safe and reconcilable.
- **Shared packages hold factories, apps hold definitions.** A package never hard-codes a product, brand, locale
  enumeration, project id or brand URL; it exposes `define*()` factories whose types are inferred from the app's
  definition. A convenience value is fine; a closed type is a finding.
- A feature used by two or more apps lives in a package; a feature used by one stays in that app.

Enforcement: `turbo boundaries`, `packages/tooling/oxlint/boundaries.jsonc` (`no-restricted-imports`),
`tools/scripts/validate-repository.mjs`; the literal-in-package rule is reviewer-checked (planned lint).
Docs: `apps/docs/src/constitution/boundaries.mdx`, `/adr/0003-tier-dependency-direction`,
`/adr/0010-services-are-independent-workspace-members`.
