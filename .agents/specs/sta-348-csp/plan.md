# Plan: `@stackra/csp` wave 2

**Spec**: `.agents/specs/sta-348-csp/spec.md`

## Design

- `src/core/schemas/csp-options.schema.ts`: `CspOptions extends Schema` with the four fields; registers
  `CSP_OPTIONS_SCHEMA` (`src/core/constants/csp-options-schema.constant.ts`) on load, as `TableInput` does.
- `src/config/csp.config.ts`: `CspConfig extends Config({ schema: CspOptions })`, no env map (origins from env reach
  the policy through `CspAdditions.connect`).
- `src/core/constants/csp-baseline.constant.ts`: the twelve directives in header order. Inline `style`
  attributes are allowed (`style-src-attr`) because server-rendered React markup carries them; `<style>` elements
  stay nonce-only.
- `src/core/constants/csp-source-pattern.constant.ts` and `csp-nonce-pattern.constant.ts`: the two grammars.
- `src/core/functions/csp-source.function.ts` (internal): checks a source and reduces a URL to scheme and host.
- `src/core/functions/content-security-policy.function.ts`: baseline plus additions, deduplicated per directive.
- `src/core/functions/csp-header-name.function.ts`, `create-nonce.function.ts`.
- `src/react/nonce/`: `NonceContext` (internal), `NonceProvider`, `NonceProviderProps`, `useNonce` (no throw outside
  a provider). `src/react/style/`: `Style`, `StyleProps`.
- Stand-in barrels `src/core/index.ts` (`.`, re-exports `#config/csp.config`) and `src/react/index.ts`.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                      |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/security/csp`; workspace imports: `@stackra/config`, `@stackra/contracts`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                       |
| Security                              | PASS   | the package builds the Content-Security-Policy and its nonce; every added source must match one host or scheme source                                                     |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                              |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                            |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                    |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                          |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                 |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                         |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                           |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                        |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                   |

- Boundaries: runtime imports `@stackra/config`, `@stackra/validation`, `zod`, React (optional peer); dev-only
  `@stackra/testing` and the presets. `@stackra/contracts` for `definePackage`.
- Versions: catalogs and `workspace:*` only.
- Naming: function components for the Provider and `Style`, as `ContainerProvider` (the `Component` class base is
  gen's, app-side); Props in their own files (ADR 0305 rules 10 to 12).
- Not added (no consumer): `strict-dynamic`, a `report-uri`/`report-to` endpoint, script/style/font additions, a
  `frame-ancestors` addition.

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.` and `./react`, and `turbo.jsonc` carries the `tier:lib` tag — Validates: FR-001
- **P-002**: `.` exports `CspConfig`, `contentSecurityPolicy`, `createNonce`, `cspHeaderName` and the type `CspAdditions`, and no other value — Validates: FR-002
- **P-003**: `./react` exports `NonceProvider`, `Style`, `useNonce` and the types `NonceProviderProps` and `StyleProps`, and no other value — Validates: FR-003
- **P-004**: `CspConfig` has the key `csp`, with `extraConnectSrc`, `extraFrameSrc` and `extraImgSrc` defaulting to `[]` and `reportOnly` defaulting to `false`, and `CspOptions$` is shipped and registered with it — Validates: FR-004
- **P-005**: `contentSecurityPolicy` changes only `script-src`, `style-src` (nonce), `connect-src`, `frame-src` and `img-src` from the baseline, and every added source matches one host or scheme source — Validates: FR-005
- **P-006**: `createNonce` returns 128 random bits as base64 through Web Crypto, with no `node:` import, so it runs on Workers, Node and the browser — Validates: FR-006
