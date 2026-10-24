# AGENTS — @stackra/csp

The Content Security Policy baseline, its configuration, nonces and the React nonce pieces. Member at
`packages/security/csp` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./react`.

## Where code goes

| You are writing…                | It goes in…                                    |
| ------------------------------- | ---------------------------------------------- |
| The configuration (`CspConfig`) | `src/config/csp.config.ts`                     |
| Its schema and shipped `X$`     | `src/core/schemas/`, `src/core/constants/`     |
| A function, a type, a constant  | `src/core/{functions,types,constants}/`        |
| React code                      | `src/react/<name>/`                            |
| A test                          | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## Entries and barrels

- `src/{core,react}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new public
  file to its barrel and to that entry's `index.test.ts`. `CspConfig` lives in `src/config/` and is exported from `.`.
- The baseline, the grammars, `cspSource`, `CspOptions` and `NonceContext` stay internal.

## This package

- Additions only. A host adds sources to `connect-src`, `frame-src` and `img-src`; it never edits a fixed directive
  and never adds a keyword. Widening the baseline is a security change: it changes `csp-baseline.constant.test.ts`
  and needs review.
- Every added source passes `CSP_SOURCE_PATTERN` twice: the schema at boot, `cspSource` per response.
- A nonce is minted once per request by `createNonce` (Web Crypto) and never cached, reused or derived.
- `useNonce` returns `undefined` outside a provider on purpose: the browser has no nonce after hydration.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII and secrets

None. The configuration holds deploy-time origins; the nonce is a per-request random value, not a secret to store.
