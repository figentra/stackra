# @stackra/csp

## 0.1.0

### Minor Changes

- 2787c1e: Add `@stackra/csp`: one nonce-based Content Security Policy baseline for every web and desktop target.
  `contentSecurityPolicy(csp, { connect, nonce })` prints it with the request's nonce on `script-src` and `style-src`
  and the runtime's and configuration's origins on `connect-src`, `frame-src` and `img-src`; every other directive is
  fixed, and a source that would loosen the policy (a quoted keyword, a bare `*`, a separator) is refused at boot and per
  response. `CspConfig` (key `csp`) holds a host's additions and `reportOnly`, which `cspHeaderName` turns into the
  `Content-Security-Policy-Report-Only` header. `createNonce()` mints 128 random bits per request with Web Crypto. The
  `./react` entry adds `NonceProvider`, `useNonce` and `Style`, a `<style>` element that carries the nonce.
- ffce16f: Add `securityHeaders`, on by default: HSTS (two years, subdomains), `X-Content-Type-Options: nosniff`, a strict
  `Referrer-Policy`, a `Permissions-Policy` that turns powerful features off, `Cross-Origin-Opener-Policy: same-origin`
  and `X-Frame-Options: DENY`. `CspConfig` gains `hstsMaxAgeSeconds`, `hstsIncludeSubDomains`, `hstsPreload`,
  `referrerPolicy` and `permissionsAllow`; the schema refuses values that would loosen the baseline.

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [59ac846]
- Updated dependencies [150fa18]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
  - @stackra/config@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
