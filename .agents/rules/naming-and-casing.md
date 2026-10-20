---
title: Naming and casing
always: true
description: One casing per kind of name in Stackra. Files kebab-case, types PascalCase, machine codes snake_case, env and secrets SCREAMING_SNAKE.
---

# Naming and casing

Every name in the repository follows the table in ADR 0231 (`/adr/0231-naming-and-casing-standard`). The summary is below. A name that no row
covers needs an ADR before it is used.

- **Files and folders** under `src/`, and documents and rule files: kebab-case. One exported declaration per file, with a kind suffix (ADR 0006).
- **Types, interfaces, classes, enum objects, React components**: PascalCase. Enums are a const object plus a same-named union (ADR 0128).
- **Functions, methods, variables, parameters**: camelCase, functions verb-first.
- **Constants**: SCREAMING_SNAKE for fixed tables; camelCase for computed values. DI tokens are SCREAMING_SNAKE (`LOGGER`).
- **Machine codes** (error categories and codes, refusal codes, event reasons, STK and domain codes): snake_case (ADR 0137, 0140).
- **Event names**: `ns.entity.verb.vN`, lowercase (ADR 0141). **Permission keys**: `resource:verb` (ADR 0132).
- **Database tables and columns**: snake_case. **URL path segments**: kebab-case. **HTTP headers**: Title-Case as sent.
- **Environment variables and secret names**: SCREAMING_SNAKE. Config overrides use `STACKRA_<PKG>__<PATH>` (ADR 0146).
- **Package names**: `@stackra/<name>` with a kebab-case name. **Branch names**: `figentra/sta-<n>-<slug>`.
- **Imports** across folders use `#` aliases from `package.json` `imports`, never `../` (ADR 0233).
- **Files shipped with a package** live in `assets/`. "Resource" means `@Resource` only (ADR 0234, ADR 0164).

Enforcement: planned — oxlint `unicorn/filename-case` (kebab-case files), the house lint rules of ADR 0129, and the validator checks named in ADR 0231.
