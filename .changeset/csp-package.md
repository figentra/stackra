---
"@stackra/csp": minor
---

Add `@stackra/csp`: one nonce-based Content Security Policy baseline for every web and desktop target.
`contentSecurityPolicy(csp, { connect, nonce })` prints it with the request's nonce on `script-src` and `style-src`
and the runtime's and configuration's origins on `connect-src`, `frame-src` and `img-src`; every other directive is
fixed, and a source that would loosen the policy (a quoted keyword, a bare `*`, a separator) is refused at boot and per
response. `CspConfig` (key `csp`) holds a host's additions and `reportOnly`, which `cspHeaderName` turns into the
`Content-Security-Policy-Report-Only` header. `createNonce()` mints 128 random bits per request with Web Crypto. The
`./react` entry adds `NonceProvider`, `useNonce` and `Style`, a `<style>` element that carries the nonce.
