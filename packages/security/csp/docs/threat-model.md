# Threat model: @stackra/csp

<!--
Stackra file contract:
Purpose: the threat model of @stackra/csp: the Content-Security-Policy every web and desktop target sends, the
         per-request nonce, the security headers, frame ancestors and the HTML sanitising policy.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC10; ADR 0237; ADR 0251; ADR 0294 (decisions 15, 19, 20, 23); ADR 0207 (amendment
                    of 2026-11-26: the ASVS level); STA-316.
-->

ASVS level: L1 for every chapter; V5 (output encoding) and V14.4 (HTTP security headers) are this package's own (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

This package holds no data. It decides what a browser may load and run for a Stackra page, so its threats are script
injection, clickjacking and leaks through headers, and its controls are the policy text and the headers it builds.

## Assets

| Asset                                 | Where it lives                                                  | Class      |
| ------------------------------------- | --------------------------------------------------------------- | ---------- |
| The baseline policy and headers       | `CSP_BASELINE`, `securityHeaders` in this package               | `internal` |
| The host's extra sources              | `CspConfig.extraConnectSrc`, `extraFrameSrc`, `extraImgSrc`     | `internal` |
| The per-request nonce                 | request context, `NonceProvider`; 128 random bits, never stored | `internal` |
| The pages and the user data they show | the browser, protected by the policy                            | `pii`      |

## Trust boundaries

1. The server render to the browser: the headers and nonces this package writes.
2. Host configuration to this package: sources a deployment adds.
3. Tenant or user HTML to the page: markup the platform renders but did not write.

## Threats and controls

| Threat                                                            | Control today                                                                                                                                 | Open work                                      |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Injected script runs in a user's session (XSS)                    | `script-src 'self' 'nonce-…'` with no `unsafe-inline` or `unsafe-eval`; `object-src 'none'`, `base-uri 'none'`                                | Rich text sanitised in `@stackra/ui`, STA-2583 |
| A host weakens the policy through configuration                   | Only `connect-src`, `frame-src` and `img-src` take additions; a quoted keyword, `*`, `;` or `,` is refused at boot and again when building    | —                                              |
| A nonce is guessed or reused                                      | `createNonce` draws 128 random bits per request; it is never cached                                                                           | —                                              |
| The page is framed by another site (clickjacking)                 | `frame-ancestors 'none'` and `X-Frame-Options: DENY` by default; an embed allows only listed origins through `frameAncestors`                 | —                                              |
| Downgrade, MIME sniffing or referrer leaks                        | HSTS (two years), `nosniff`, strict `Referrer-Policy`, `Cross-Origin-Opener-Policy: same-origin`; a host cannot drop nosniff, COOP or framing | —                                              |
| Tenant HTML smuggles script or event handlers into email or pages | `sanitizeHtml` with the rich-text policy in this package                                                                                      | Email bodies sanitised, STA-2582               |
| Powerful browser features used by injected code                   | `Permissions-Policy` turns camera, microphone, geolocation, payment, device buses and screen capture off unless the host allows one           | —                                              |
