# Implementation Plan: tenant and client HTML in a mail body is sanitized

**Spec**: `.agents/specs/sta-2582-mail-rich-text/spec.md` · **Linear**: STA-2582 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2582-mail-rich-text/spec.md`

## Summary

`MailTools` gains `richText(html, policy?)`, built in the renderer's `toolsFor` as a `<div>` whose inner HTML is
`sanitizeHtml(html, policy)` from `@stackra/csp`. `@stackra/oxlint-config` adds a last override that sets
`react/no-danger` to error in `**/*.mail.tsx`, so a body never writes raw HTML. Renderer tests prove a hostile note is
cleaned, escaped elsewhere and carried into the text part; a lint test proves the rule fires on a mail body only.

## Technical Context

- **Language**: TypeScript (ESM), React server rendering (`react-dom/server`)
- **Members**: `packages/communication/notifications`, `packages/tooling/oxlint`, `packages/security/csp` (docs)
- **Testing**: vitest in `src/**/__tests__/`, on CI
- **Storage**: none
- **Runtime target**: every host that renders a `.mail.tsx` body (the sending Notifier driver, `renderMail` in
  `./testing`)

## Constitution Check

| Law                                   | Result | Note                                                              |
| ------------------------------------- | ------ | ----------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | notifications (lib) imports csp (lib); no cycle                   |
| Secrets (ADR 0009)                    | PASS   | none                                                              |
| Security                              | PASS   | the only raw-HTML sink is behind the allowlist sanitizer and lint |
| HTTP and events                       | N/A    | none                                                              |
| Tenancy                               | N/A    | nothing stored or read; the caller holds the recipient's HTML     |
| Delegation                            | PASS   | Claude only                                                       |
| Not built yet (ADR 0011)              | N/A    | none                                                              |
| Test placement (ADR 0022)             | PASS   | tests stay in `__tests__/`                                        |
| Versions and catalogs                 | PASS   | a minor changeset for notifications and oxlint-config             |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                 |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                         |
| Docs and ADRs                         | PASS   | READMEs and AGENTS.md of the three members                        |

## Deploy modes

| Mode       | Behaviour                                               |
| ---------- | ------------------------------------------------------- |
| SaaS       | mail bodies sanitize tenant HTML at render; no call out |
| On-prem    | the same; `sanitizeHtml` is pure and needs no service   |
| Air-gapped | the same; no network, no DOM, no third-party sanitizer  |

## Correctness properties

- **P-001**: `useMail()` inside a render returns a `richText` that yields a `ReactElement` — Validates: AC-001
- **P-002**: a hostile note through `richText` renders exactly
  `<div><p>Welcome <strong>team</strong>!</p><a>bad</a> <a href="https://club.example/kit">kit list</a></div>` and no
  script, img, iframe, handler, `javascript:`, `style=` or evil origin — Validates: AC-002
- **P-003**: the same note as a prop and an ICU value renders `&lt;script&gt;` and no live tag — Validates: AC-003
- **P-004**: the text part of a `richText` note is the sanitized text without the script — Validates: AC-004
- **P-005**: a policy allowing only `p` and `style` keeps `<p>Hi there</p>` and still drops `<style>` — Validates:
  AC-005
- **P-006**: oxlint over the mail fixtures reports `react(no-danger)` for `welcome.mail.tsx` and not for
  `welcome-card.tsx` — Validates: AC-006, AC-007

## Architecture overview

A mail body is a React component rendered to static markup by `renderMailBody`, which builds `MailTools` per render
(`toolsFor`) and provides it through the mail context that `useMail()` reads. `richText` is one more tool on that
object. Sanitizing happens at render, synchronously, on the HTML the body hands in; nothing is cached or stored. The
lint rule is the second wall: a body cannot bypass the tool with its own `dangerouslySetInnerHTML`.

## Components and responsibilities

- `MailTools.richText` (`mail-tools.type.ts`): the contract; documented as the only way HTML a body did not write gets
  into a mail.
- `toolsFor` (`render-mail-body.function.tsx`): builds `richText` as a `<div>` over `sanitizeHtml(html, policy)`.
- `sanitizeHtml` and `RICH_TEXT_HTML_POLICY` (`@stackra/csp`, unchanged): the allowlist and its floor.
- The `**/*.mail.tsx` override (`base.jsonc`): `react/no-danger` at error, last in the overrides list.

## Files and folders

```text
packages/communication/notifications/
  AGENTS.md
  README.md
  package.json
  src/react/mail/mail-tools.type.ts
  src/react/mail/render-mail-body.function.tsx
  src/react/mail/__tests__/render-mail-body.function.test.tsx
packages/tooling/oxlint/
  AGENTS.md
  README.md
  src/base.jsonc
  src/__tests__/no-danger-mail.test.ts
  src/__tests__/fixtures/mail/packages/communication/demo/src/react/welcome.mail.tsx
  src/__tests__/fixtures/mail/packages/communication/demo/src/react/welcome-card.tsx
packages/security/csp/AGENTS.md
.changeset/notifications-mail-rich-text-sanitized.md
pnpm-lock.yaml
```

## Data models and migrations

none

## Contracts

`MailTools.richText: (html: string, policy?: HtmlPolicy) => ReactElement`, reached through `useMail()` from
`@stackra/notifications/react`. `HtmlPolicy` is the existing type from `@stackra/csp`. The lint contract: in
`@stackra/oxlint-config`, `react/no-danger` is `error` for `**/*.mail.tsx`.

## Error handling

`sanitizeHtml` never throws on malformed markup: what its tokenizer does not recognise becomes escaped text and every
open tag is closed. `useMail()` still throws outside a mail render, as before.

## Security and tenancy

Tenant and client HTML is rebuilt from parsed parts against the allowlist before it reaches the markup, so no script,
handler, style, image or unsafe link reaches a mail client under the default policy. A host-supplied policy replaces
the default (see the spec's Risks); the floor still blocks script-capable content. No tenant data is read or stored.

## Testing strategy

- AC-001, AC-002: `render-mail-body.function.test.tsx`, "writes rich text back only as sanitizeHtml keeps it".
- AC-003: the same file, "escapes the HTML when a body passes it as a prop or an ICU value".
- AC-004: the same file, "keeps the sanitized rich text in the plain-text part, without the dropped script".
- AC-005: the same file, "narrows to a host's policy, and the floor holds under any policy".
- AC-006, AC-007: `no-danger-mail.test.ts` runs oxlint with the boundaries preset over the fixtures.
- The PR reports package tests, typecheck, oxlint and oxfmt passing, and the new tests failing with the change
  reverted.

## Rollout

A minor changeset for `@stackra/notifications` and `@stackra/oxlint-config`. Additive for consumers; a mail body that
writes raw HTML fails lint and moves to `richText(html)`.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2.

## ADRs

none new; implements ADR 0223 as amended by ADR 0294.

## Docs

The notifications README and AGENTS.md, the oxlint README and AGENTS.md, the csp AGENTS.md.

## Complexity tracking

none
