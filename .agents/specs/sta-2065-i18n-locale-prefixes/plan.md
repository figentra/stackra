# Implementation Plan: `#stackra/i18n` locale prefixes from I18nConfig

**Spec**: `.agents/specs/sta-2065-i18n-locale-prefixes/spec.md` · **Linear**: STA-2065 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-2065-i18n-locale-prefixes/spec.md`

## Summary

`emitI18n` writes one more export into `.stackra/gen/i18n.ts`: `prefixes`, each configured locale's URL prefix
(`""` for the default locale under `prefix_except_default`, else `/` plus the lowercase tag). It reads `locales`,
`defaultLocale` and `urlStrategy` from the member's I18nConfig override through a small shared lookup,
`configuredDefault`, lifted out of `emitExpoConfig`'s local `configured` closure so both emitters read the override the
same way. Base defaults stay mirrored in gen, in one `CONFIG_DEFAULTS` constant both emitters share.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); the gen golden runner (`src/node/__tests__/golden.test.ts`)
- **Storage**: none
- **Runtime target**: a library (gen's build-time emitters)

## Constitution Check

| Law                                   | Result | Note                                                            |
| ------------------------------------- | ------ | --------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen writes text; it imports no `@stackra/i18n` code             |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                      |
| Security                              | N/A    | build-time text; no request, cookie or header is read           |
| HTTP and events                       | N/A    | no endpoint or event changes                                    |
| Tenancy                               | N/A    | no tenant data                                                  |
| Delegation                            | PASS   | one session, one worktree                                       |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                          |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/` beside each subject                       |
| Versions and catalogs                 | PASS   | no dependency added; `pnpm-lock.yaml` unchanged                 |
| Deploy modes (ADR 0076)               | PASS   | build-time output, same in all three                            |
| Licence tier (ADR 0077)               | PASS   | free                                                            |
| Docs and ADRs                         | PASS   | gen README rows; no ADR change (ADR 0297 decision 4 as written) |

## Deploy modes

| Mode       | Behaviour                                  |
| ---------- | ------------------------------------------ |
| SaaS       | same generated file; no runtime difference |
| On-prem    | same                                       |
| Air-gapped | same                                       |

## Correctness properties

- **P-001**: the keys of `prefixes` equal the configured locales, in the configured order, each once — Validates:
  FR-001
- **P-002**: every value is `""` or matches `^/[a-z0-9-]+$` (what `toRoot` accepts), and only the default locale under
  `prefix_except_default` is `""` — Validates: FR-002
- **P-003**: a field the override sets wins; a field it leaves out takes the base default; with no override the output
  is `{ "en": "" }` — Validates: FR-003
- **P-004**: `emitExpoConfig` output is unchanged by the shared lookup (its existing tests pass as they are) —
  Validates: FR-004

## Architecture overview

Discovery already records a member's config overrides as `config` shapes whose `base` is the package class
(`{ kind: "package", name: "I18nConfig", from: "@stackra/i18n" }`) with each field's constant default
(`FieldDefault.value`, enum cases as wire values). `emitI18n` reads three of those fields, falls back to the base
defaults, and prints `prefixes` as JSON after `locales`. Nothing else in the pipeline changes; the router tree (wp-70)
will import `prefixes` from `#stackra/i18n` for `toRoot`.

## Components and responsibilities

- `configuredDefault(ir, base, from, field)` (new, gen): the host override's own default of `base.field`, or its base
  default from `CONFIG_DEFAULTS` when the member has no override, the override does not set that field, or sets it to
  a value of another type. Same matching rule as today's closure (the package name or a subpath of it).
- `CONFIG_DEFAULTS` (new, gen): the base default of each config field the emitters read, moved out of
  `emitExpoConfig`'s `DEFAULTS`.
- `emitExpoConfig` (gen): calls `configuredDefault` in place of its `configured` closure and `DEFAULTS`.
- `emitI18n` (gen): reads `locales`, `defaultLocale`, `urlStrategy`; writes `prefixes`; header and contract mention it.

## Files and folders

- `packages/developer/gen/src/core/functions/configured-default.function.ts` (new) and
  `__tests__/configured-default.function.test.ts`
- `packages/developer/gen/src/core/functions/emit-expo-config.function.ts` (use the shared lookup)
- `packages/developer/gen/src/core/functions/emit-i18n.function.ts` and `__tests__/emit-i18n.function.test.ts`
- `packages/developer/gen/__golden__/i18n-packages/input/packages/customers/src/config/i18n.config.ts.golden` (new:
  `locales` `en` and `ar-SA`); a stand-in `input/_modules/@stackra/i18n/` (package.json and a declaration with
  `I18nConfig`, `Locale`, `LocaleUrlStrategy`) only if the real package does not resolve from the golden workspace;
  expected output refreshed with `UPDATE_GOLDEN=1` and reviewed (`i18n.ts` gains `prefixes`; any other file the new
  config shape changes is reviewed line by line); the fixture row in `__golden__/README.md`
- `packages/developer/gen/README.md`
- `.changeset/sta-2065-i18n-locale-prefixes.md`

## Data models and migrations

none

## Contracts

- `#stackra/i18n` (generated), additive:
  `export const prefixes = { "en": "", "ar-SA": "/ar-sa" } as const;` — locale tag to `""` or `/<lowercase tag>`.
- `configuredDefault(ir: MemberIR, base: string, from: string, field: string): unknown` (gen internal, exported from
  `#core/index` only if `emitExpoConfig`'s module boundary needs it; otherwise imported by path like its siblings).

## Error handling

No new refusal. A value gen cannot read as a constant, or of the wrong type (not a string array, not a string), takes
the base default, as `emitExpoConfig` does today. A default locale outside the configured list gets no entry; the
config's own cross-field rule (`checkI18nOptions` in `I18nConfig$`) refuses it at boot.

## Security and tenancy

none

## Testing strategy

- AC-001: `emit-i18n.function.test.ts` with an override of `en` and `ar-SA`; the `i18n-packages` golden fixture's
  expected `.stackra/gen/i18n.ts`.
- AC-002: `emit-i18n.function.test.ts` cases for `urlStrategy: "prefix"`, another `defaultLocale`, no override,
  `en-US` lowercased, and the unchanged no-file cases (no namespace, `@stackra/i18n` not declared).
- FR-004: `configured-default.function.test.ts` (override set, field unset, subpath `from`, no override) and the
  existing `emit-expo-config.function.test.ts` unchanged.
- All runs on ci-box: gen `test`, `typecheck`, `lint`, then `pnpm verify` for `@stackra/gen`.

## Rollout

none. Generated output changes on the next `stackra gen`; `.stackra/` is gitignored, so no member commits a change.

## Delegation and risk plan

One session in worktree `.claude/worktrees/sta-2065`. Every build, gen, typecheck and test runs on ci-box. Before
shipping, merge `origin/main` in (other gen packages are in flight in neighbouring files) and keep their behaviour.
`emitExpoConfig` gets a one-line change only. Budget: small (one PR).

## ADRs

ADR 0297 decision 4 (lowercase locale prefixes, no redirects), ADR 0305 rule 1 (overrides set field defaults only),
ADR 0294 decision 26 (defaults are constants), ADR 0080 decision 2 (launch default English): all Accepted.

## Docs

`packages/developer/gen/README.md` (the `emitI18n` row and the `.stackra/gen/i18n.ts` row).

## Complexity tracking

none
