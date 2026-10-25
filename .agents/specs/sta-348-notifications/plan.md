# Plan: `@stackra/notifications` wave 4

**Spec**: `.agents/specs/sta-348-notifications/spec.md`

## Design

- Four entries through stand-in barrels (STA-339 replaces them): `.` from `src/core/`, `./contracts` from
  `src/contracts/` (the leaf), `./react` from `src/react/`, `./testing` from `src/testing/`. `.` and `./contracts`
  import no React.
- Groups: `bases/` (`Notification` with its instance base), `enums/` (`NotificationCategory`), `values/` (`Recipient`,
  `MailMessage`), `ports/` (`Notifier`, here because its signature is the kind's), `drivers/` (`MemoryNotifierDriver`),
  `functions/` (the internal `prepareNotification` and `htmlToText`), `schemas/` and `constants/` (the options shape and
  its shipped schema), `types/`; `src/config/` holds `NotificationsConfig`.
- `Notification` is `createKind("notification", NotificationBase, read)`, called only. The base declares `recipients`
  alone, because TypeScript requires every abstract member (optional ones too) and a declared member forces
  `override`; `prepareNotification` finds `data` and `mail` by name and calls them as methods.
- `prepareNotification` reads the category from the kind registry, dedupes recipients by principal or scope id, reads
  `data` once (or uses the event), builds the `MailMessage` and checks its subject, and freezes each delivery.
- Rendering lives in `./react`: `renderMailBody` puts the recipient's `MailTools` (built from the locale, the merged
  catalogues, `I18nConfig.rtl` and `numerals`, `Money` and the asset resolver) in a React context and renders the
  compiled body with `renderToStaticMarkup`, then derives the text part with `htmlToText`. `useMail` reads the context.
- `renderMail` (testing) reads `assets/lang/<base>/*.json` then the regional overlay from the working directory,
  merged per namespace with `mergeCatalogues`, unless the test passes catalogues.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                  |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/communication/notifications`; imports only lower `@stackra/*` packages through their entries; no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged; provider keys belong to the service's transport drivers                                                          |
| Security                              | PASS   | recipients are checked as `Recipient` values; bodies are React-escaped markup; no address or body is stored or logged                                 |
| HTTP and events                       | N/A    | no endpoint and no event; gen's listener calls the `Notifier` once per event id                                                                       |
| Tenancy                               | PASS   | no tenant vocabulary: a scope recipient keeps the scope's id only (R-59)                                                                              |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                |
| Not built yet (ADR 0227)              | PASS   | no runtime template engine (R-26), no rejected or deferred technology                                                                                 |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                             |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                     |
| Deploy modes (ADR 0076)               | PASS   | a library with no network, identical in SaaS, on-prem and air-gapped                                                                                  |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                    |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand, open items listed in the spec                                                         |

- Boundaries: runtime edges to assets, config, container, contracts, i18n, money and validation; React as an optional
  peer; dev-only `@stackra/testing` and the tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: the kind base is `Notification`, with no `define` prefix (0305 rule 3); the memory driver is
  `MemoryNotifierDriver`, the test double `MailTransportFake`.

## Properties

- **P-001**: `package.json` names `@stackra/notifications` at `packages/communication/notifications`, `exports` lists exactly `.`, `./contracts`, `./react` and `./testing`, and every dependency is `workspace:*` or `catalog:` — Validates: FR-001
- **P-002**: For every declared notification, `kindOf(X)` is `{ kind: "notification", options: { category } }`, every category outside `NotificationCategory` throws, and `.` exports exactly its listed values — Validates: FR-002
- **P-003**: For every event and recipient list, the deliveries are one per distinct recipient in first-seen order, `data` is called at most once and not at all for an empty list, and every delivery is frozen — Validates: FR-003
- **P-004**: For every sequence of `notify` calls, `sent()` returns every delivery in order and `sent(X)` exactly those whose notification is an `X`; `buildConfig(NotificationsConfig).driver` is `memory` — Validates: FR-004
- **P-005**: `./contracts` exports exactly `MailTransport`, and a driver of it must implement `send` — Validates: FR-005
- **P-006**: For every body, data and locale, the rendered HTML starts with the XHTML doctype, its `dir` follows `I18nConfig.rtl`, and the text equals `htmlToText(html)` — Validates: FR-006
- **P-007**: For every locale, `renderMail` without catalogues equals `renderMail` with the merged base and overlay catalogues of the working directory — Validates: FR-007

## Deploy modes

| Mode       | Behaviour                                                              |
| ---------- | ---------------------------------------------------------------------- |
| SaaS       | a library, bundled into the consumer's service; the memory driver only |
| On-prem    | identical: the same build, no SaaS-only code path                      |
| Air-gapped | identical: needs no network at build or run                            |
