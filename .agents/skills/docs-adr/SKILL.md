---
name: docs-adr
description: Write or supersede an Architecture Decision Record in the house format and keep the ADR index consistent. Use whenever a rule, boundary, technology, or process decision changes. Next number = highest in apps/docs/src/adr + 1.
---
# ADR

1. Next number: the highest in `apps/docs/src/adr/` + 1. File: `apps/docs/src/adr/NNNN-<kebab-slug>.mdx` (copy `template.mdx`) with Mintlify frontmatter (`title`, `description`).
2. Header line: `**Status:** Proposed|Accepted|Deferred|Superseded by [ADR NNNN](…) · **Date:** YYYY-MM-DD · **Deciders:** … · **Supersedes/Amends/Companion:** …`.
3. Sections in order: `## Context` (forces, numbers) · `## Decision` (D1, D2… one bold sentence each, then detail) · `## Rationale` · `## Rejected alternatives` (table: option | why not) · `## Consequences` · optional `## Revival triggers` / `## References`.
4. Supersession: edit the old ADR's **header only** (`Superseded by … (date — one-line why)`); never rewrite its body.
5. Projection: if the decision changes a rule, update `CLAUDE.md`, the matching `.agents/rules/*.md`, and the affected `AGENTS.md` in the same change; if enforceable, add the hook/lint/test that enforces it.
6. Add the index row in `apps/docs/src/adr/index.mdx` and the nav entry in `apps/docs/src/docs.json`.
