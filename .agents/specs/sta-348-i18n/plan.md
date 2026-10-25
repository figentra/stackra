# Plan: `@stackra/i18n` wave 2

**Spec**: `.agents/specs/sta-348-i18n/spec.md`

## Design

- `src/core/enums/`: `Locale` (BCP 47 codes, endonym case data), `NumberingSystem` (`latn`, `arab`, `user`: the Intl
  `nu` spellings), `LocaleUrlStrategy`.
- `src/core/schemas/i18n-options.schema.ts`: `I18nOptions`, the options shape with launch defaults.
- `src/core/constants/i18n-config-schema.constant.ts`: `I18nConfig$`, hand-written until gen compiles package
  schemas (shortcut, STA-339), with field rules only: gen's member override is `I18nConfig$.extend({...})` over the
  same keys, which zod refuses on an object with refinements.
- `src/core/functions/check-i18n-options.function.ts` (internal): the cross-field rules as a `superRefine` callback.
- `src/config/i18n.config.ts`: `I18nConfig extends Config({ schema: I18nOptions })`; registers
  `[I18nOptions, I18nConfig$.superRefine(checkI18nOptions)]` (registry gap G1 shortcut).
- `src/core/functions/keys.function.ts`: recursive builder, `<namespace>::<path>`, `_` lifts leaves, frozen;
  `KeysOf<T>` types it from a `const` type parameter.
- `src/core/functions/merge-catalogues.function.ts`: deep merge, later wins, leaves replace whole.
- `src/core/functions/format-message.function.ts`: nested lookup, `intl-messageformat` with `ignoreTag`, compiled
  messages cached by locale and text; a missing message throws.
- `src/core/functions/intl-locale.function.ts` (internal): the `-u-nu-` tag.
- `src/react/i18n-provider/`: context, provider (reads `useConfig(I18nConfig)`), `useI18nState` (internal).
- `src/react/{translation,locale,formatting}/`: the six hooks; `useLocaleChoice` on `useSyncExternalStore` with a
  `null` server snapshot over the configured cookie.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                           |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/foundation/i18n`; workspace imports: `@stackra/config`, `@stackra/contracts`, `@stackra/money`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                                            |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                                                          |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                                   |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                                 |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                         |
| Not built yet (ADR 0227)              | PASS   | no i18next or react-i18next; messages go through `intl-messageformat` behind `formatMessage`                                                                                                   |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                      |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only; the `intl-messageformat` pin is added by the owner (T010)                                                                                                   |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                             |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                        |

- Boundaries: runtime imports `@stackra/contracts`, `@stackra/config`, `@stackra/money`, `@stackra/validation`,
  `intl-messageformat`, `zod` and React (optional peer); `@stackra/container` only in tests.
- Versions: catalogs and `workspace:*` only; `intl-messageformat` needs its catalog pin from the owner.
- Naming: enum codes snake_case except the tool-owned BCP 47 and Intl `nu` spellings; `I18nConfig$` is gen's `X$`
  name.

## Properties

- **P-001**: For any catalogues `a`, `b`, every leaf path of `b` resolves in `mergeCatalogues([a, b])` to `b`'s value — Validates: FR-002
- **P-002**: For any key tree, every leaf of `keys(tree)` equals `<namespace>::<path to it>` — Validates: FR-002
- **P-003**: `package.json` `exports` lists exactly `.` and `./react` — Validates: FR-001
- **P-004**: `./react` exports `useDateTime`, `useLocale`, `useLocaleChoice`, `useMoney`, `useNumber`, `useTranslation`, `I18nProvider` and `I18nProviderProps` — Validates: FR-003
- **P-005**: `Enum.values(Locale)` lists BCP 47 tags (`en`, `en-US`, `ar`, `ar-SA`), and each case carries its endonym as case data — Validates: FR-004
- **P-006**: the exported `I18nConfig$` has no object-level refinement, so a member's `I18nConfig$.extend({ ... })` override loads, while `I18nConfig` keeps the cross-field rules — Validates: FR-005
- **P-007**: every formatter passes digits as the `-u-nu-` extension of the locale tag, and `NumberingSystem.User` adds none — Validates: FR-006
- **P-008**: `useLocaleChoice` returns `null` on the server and while hydrating, and no code reads the cookie to redirect — Validates: FR-007
- **P-009**: every non-test source file opens with the Stackra file contract and has one exported declaration, and every test sits in `__tests__/` and imports from `@stackra/testing` — Validates: FR-008

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |
