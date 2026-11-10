# @stackra/csp

## 0.33.0

### Patch Changes

- Updated dependencies [82c2718]
- Updated dependencies [93d63bb]
  - @stackra/config@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [9ddce28]
  - @stackra/config@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- @stackra/config@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Patch Changes

- @stackra/config@0.30.0
  - @stackra/validation@0.30.0

## 0.29.0

### Patch Changes

- @stackra/config@0.29.0
  - @stackra/validation@0.29.0

## 0.28.0

### Patch Changes

- @stackra/config@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- @stackra/config@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- @stackra/config@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- @stackra/config@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- @stackra/config@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- @stackra/config@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Minor Changes

- 2dd98e6: `sanitizeHtml(html, policy?)` makes rich-text HTML safe to render, with no DOM and no new dependency. It rebuilds the
  output from parsed parts against an allowlist (`RICH_TEXT_HTML_POLICY`: the editor's paragraphs, headings, lists,
  quotes, code, marks and links). Scripts, styles and their content, event handlers, `style`, comments and unknown tags
  are dropped, and a link keeps its `href` only for http(s), mailto, relative or fragment URLs once entities and control
  characters are taken out. `HtmlPolicy` narrows it.
  
  A floor holds under any `HtmlPolicy`: event handlers, `style`, `srcdoc`, `formaction` and the like are never kept,
  script-capable elements always go with their content, and `base`, `meta`, `link`, `embed` and form controls always go.
- 1d5d185: `CspConfig.thirdPartyScripts` is the per-surface third-party script allowlist: each exact https origin with the
  consent category that gates it. A `necessary` script (a payment SDK) always loads; any other (an ad pixel under
  `marketing`) is added to `script-src` only when `CspAdditions.consent` grants its category, so without consent only
  `necessary` scripts load and an unlisted script never does. Wildcards, paths and http are refused at boot.

### Patch Changes

- @stackra/config@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Minor Changes

- e871d59: `frameAncestorsEntry(config, path)` is exported: the `frameAncestors` entry that governs a path (an exact key, else the
  longest `/*` prefix). A runtime uses it to ask its resolver only on a `"request"` path, as the edge Worker does.

### Patch Changes

- Updated dependencies [a785356]
  - @stackra/validation@0.21.0
  - @stackra/config@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [667a3b5]
  - @stackra/validation@0.20.0
  - @stackra/config@0.20.0

## 0.19.0

### Minor Changes

- 581af77: `CspConfig.frameAncestors` lets a path be framed: an exact path or a `/*` prefix maps to `self` and https origins, or
  to `"request"` for framers the runtime resolves per request and passes as `CspAdditions.frameAncestors` with
  `CspAdditions.path`. Every framer must be exactly one origin; a wildcard is refused in configuration and in a
  resolver's output alike. Every other path keeps `frame-ancestors 'none'` and `X-Frame-Options: DENY`;
  `securityHeaders` now takes the same additions and drops `X-Frame-Options` only where a framer is allowed.

### Patch Changes

- 3a894fa: While `reportOnly` is on, `securityHeaders` keeps `X-Frame-Options: DENY` on every path, framed ones included:
  browsers never enforce `frame-ancestors` from a report-only header, so dropping it left a framed path open to every
  site during a rollout. `frameAncestorOrigin` is now exported, so a host can refuse a stored framer (a merchant's embed
  origin) at write time with the same rule the header uses.
- Updated dependencies [cb26737]
  - @stackra/config@0.19.0
  - @stackra/validation@0.19.0

## 0.18.1

### Patch Changes

- @stackra/config@0.18.1
  - @stackra/validation@0.18.1

## 0.18.0

### Patch Changes

- @stackra/config@0.18.0
  - @stackra/validation@0.18.0

## 0.17.2

### Patch Changes

- @stackra/config@0.17.2
  - @stackra/validation@0.17.2

## 0.17.1

### Patch Changes

- @stackra/config@0.17.1
  - @stackra/validation@0.17.1

## 0.17.0

### Patch Changes

- @stackra/config@0.17.0
  - @stackra/validation@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/config@0.16.0

## 0.15.0

### Patch Changes

- @stackra/config@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- @stackra/config@0.14.4
  - @stackra/validation@0.14.4

## 0.14.3

### Patch Changes

- @stackra/config@0.14.3
  - @stackra/validation@0.14.3

## 0.14.2

### Patch Changes

- @stackra/config@0.14.2
  - @stackra/validation@0.14.2

## 0.14.1

### Patch Changes

- @stackra/config@0.14.1
  - @stackra/validation@0.14.1

## 0.14.0

### Patch Changes

- @stackra/config@0.14.0
  - @stackra/validation@0.14.0

## 0.13.0

### Patch Changes

- @stackra/config@0.13.0
  - @stackra/validation@0.13.0

## 0.12.0

### Patch Changes

- @stackra/config@0.12.0
  - @stackra/validation@0.12.0

## 0.11.1

### Patch Changes

- @stackra/config@0.11.1
  - @stackra/validation@0.11.1

## 0.11.0

### Patch Changes

- @stackra/config@0.11.0
  - @stackra/validation@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
  - @stackra/config@0.10.0
  - @stackra/validation@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [e80a99b]
  - @stackra/validation@0.9.0
  - @stackra/config@0.9.0

## 0.8.0

### Patch Changes

- @stackra/config@0.8.0
  - @stackra/validation@0.8.0

## 0.7.1

### Patch Changes

- @stackra/config@0.7.1
  - @stackra/validation@0.7.1

## 0.7.0

### Patch Changes

- @stackra/config@0.7.0
  - @stackra/validation@0.7.0

## 0.6.1

### Patch Changes

- @stackra/config@0.6.1
  - @stackra/validation@0.6.1

## 0.6.0

### Patch Changes

- @stackra/config@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- @stackra/config@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- @stackra/config@0.5.0
  - @stackra/validation@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [0b660e0]
- Updated dependencies [3c30885]
  - @stackra/validation@0.4.0
  - @stackra/config@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [d22a5eb]
  - @stackra/config@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- @stackra/config@0.2.0
  - @stackra/validation@0.2.0

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
