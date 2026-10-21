---
title: Naming and casing
always: true
description: One naming convention for Stackra. Files kebab-case, TS words with acronym allow-list, machine codes snake_case, namespace lookups with ::, env and secrets SCREAMING_SNAKE.
---

# Naming and casing

Every name follows ADR 0231 (`/adr/0231-naming-and-casing-standard`). The summary is below. A name that no row covers needs an ADR before use.

- **Code style**: whole words; acronyms cased as words (`userId`, `ApiClient`, `loadHttpUrl`); no `I` prefix; abbreviations only `id`, `url`, `api`, `db`, `i18n`, `ui`; booleans `is`, `has`, `can`; handlers `on` or `handle`; hooks `use`; module-level constants SCREAMING_SNAKE.
- **Files**: kebab-case with a kind suffix (ADR 0006). **Packages**: `@stackra/<kebab>`; services `@figentra/service-<kebab>`.
- **Public ids**: `<prefix>_<26 characters>`. **Branches**: `figentra/sta-<n>-<slug>`.
- **Action keys**: `billing.invoice.refund@1`. **Permissions**: `billing.invoice.refund`. **Events**: `billing.invoice.paid.v1`. Wire identifiers keep dots.
- **Machine codes** (categories, error codes, refusal codes, event reasons): snake_case.
- **URL paths**: kebab-case, plural. **JSON keys and query parameters**: camelCase.
- **Database**: snake_case plural tables; `idx_` and `fk_` names for indexes and foreign keys.
- **Environment variables and secrets**: SCREAMING_SNAKE. Public values use `VITE_`, `EXPO_PUBLIC_` or `RENDERER_VITE_` and never hold a secret. Server values use `STACKRA_`, `FIGENTRA_` or `MAIN_VITE_`. Secrets are `<PROVIDER>_<PURPOSE>`. Tool-reserved prefixes are `ENCORE_`, `TURBO_`, `NODE_`, `CI`, `GITHUB_`, `INFISICAL_`, `EAS_`.
- **Namespace lookups** (i18n keys, assets, templates, stubs) use `<module>::<path>`, for example `billing::invoice.refund_confirm` and `flags::public/images/eg.svg`.
- **DI tokens**: a class is its own token, so a local class is injected by its type and needs no token constant (ADR 0263). `defineToken` is only for a port with several drivers, a constant with a `<module>.<TypeName>` key: `export const INVOICE_STORAGE = defineToken<InvoiceStorage>("billing.InvoiceStorage")`. String injection is banned.

Enforcement: planned — oxlint `unicorn/filename-case` (kebab-case files), the house lint rules of ADR 0129, the public-prefix lint, and the validator checks named in ADR 0231.
