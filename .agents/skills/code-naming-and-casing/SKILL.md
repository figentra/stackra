---
name: code-naming-and-casing
description: Name and shape TypeScript in Stackra - the naming and casing table (files, packages, public ids, action keys, permissions, events, machine codes, URLs, JSON, tables, env vars, branches, tokens, namespace keys), # subpath imports only, kind suffixes, const-object enums, private not #private, component folders, docblocks. Use when writing or reviewing any source file, and when code-standards findings appear.
---

# Naming, casing and code conventions

One table, enforced by the house lint plugin and the validator as they land (ADR 0129). Replaces the retired
`typescript-patterns` skill.

## The table (ADR 0231)

| Thing                                       | Convention                                         | Example                                                     |
| ------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| Files                                       | kebab-case with a kind suffix (ADR 0006)           | `refund-invoice.action.ts`, `invoice.model.ts`              |
| Packages                                    | `@stackra/<kebab>`; services `@figentra/service-<kebab>` | `@stackra/vite-plugin`, `@figentra/service-identity`   |
| Public ids                                  | `<prefix>_<26 characters>` (ADR 0135)              | `inv_01jh4q...`                                             |
| Action keys                                 | `<module>.<resource>.<verb>@<version>`             | `billing.invoice.refund@1`                                  |
| Permissions                                 | `<module>.<resource>.<action>`                     | `billing.invoice.refund`                                    |
| Events                                      | `<module-key>.<aggregate>.<verb>.v<n>`             | `billing.invoice.paid.v1`                                   |
| Machine codes (errors, refusals, reasons)   | snake_case                                         | `not_found`, `step_up_required`                             |
| URL paths                                   | kebab-case, plural resources                       | `/invoices/:invoiceId/refunds`                              |
| JSON keys and query parameters              | camelCase                                          | `{ "invoiceId": "..." }`                                    |
| Database tables                             | snake_case, plural                                 | `invoice_lines`                                             |
| Indexes and foreign keys                    | `idx_` / `fk_` prefixes                            | `idx_invoice_lines_invoice_id`                              |
| Environment variables                       | SCREAMING_SNAKE; public prefixes `VITE_`, `EXPO_PUBLIC_`, `RENDERER_VITE_` never hold secrets | `STACKRA_PAYMENTS__TIMEOUT_MS` |
| Branches                                    | `figentra/sta-<n>-<slug>`                          | `figentra/sta-148-agent-roster-v2-tiers`                    |
| Design tokens                               | CSS property and dotted forms                      | `--color-ink-900`, `color.ink.900`                          |
| Asset, i18n, template, stub keys            | `<module>::<path>`                                 | `billing::invoice.refund_confirm`                           |
| DI token constants                          | SCREAMING_SNAKE, key `<module>.<TypeName>`          | `INVOICE_REPOSITORY`                                        |

## Code style

- Whole words; acronyms cased as words (`userId`, `ApiClient`, `loadHttpUrl`); abbreviations only `id`, `url`, `api`,
  `db`, `i18n`, `ui`. No `I` prefix on interfaces. Booleans read `is`, `has`, `can`. Handlers `on`/`handle`. Hooks `use`.
  Module-level constants SCREAMING_SNAKE.
- **Enums**: a const object plus a same-named union type in `<name>.enum.ts`; the `enum` keyword is banned (ADR 0128).

  ```ts
  export const InvoiceStatus = { Draft: "draft", Paid: "paid", Refunded: "refunded" } as const;
  export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];
  ```

- **Classes**: `private` keyword, never `#private`; injected dependencies are `private readonly`.
- **Components**: always a folder `x/{x.tsx, index.ts, __tests__/x.test.tsx}`; `XProps` exported from the component
  file. No story files (ADR 0128).
- **Kind folders** once a module has two files of a kind: `interfaces/`, `types/`, `constants/`, `tokens/`, `errors/`,
  `decorators/`.
- **Errors** extend `StackraError` (skill `backend-errors`).

## Imports (ADR 0233)

Each member declares aliases in the `imports` field of its `package.json` (generated, not hand-written):

```json
{ "imports": { "#core/*": "./src/core/*", "#contracts/*": "./src/contracts/*", "#assets/*": "./assets/*" } }
```

- Every import that leaves the current folder uses a `#` alias; `./` only for a file in the same folder.
- `../` is banned everywhere; tsconfig `paths` and `@/`-style aliases are banned.
- Exempt: package specifiers, non-code assets, generated output, plain Node scripts under `tools/` and
  `packages/tooling/*`.
- Barrels (`index.ts`) name each re-export and declare nothing; an entry never imports another entry (ADR 0126).

## Docblocks (ADR 0007)

Every source file opens with a file docblock (purpose, boundary, runtime); every export carries a JSDoc sentence that
says what it is for. A comment explains why, not what.

## Check

`pnpm lint`, `pnpm validate`, `pnpm knip`, then `pnpm verify`. Sweeps: `code-standards-steward`.
