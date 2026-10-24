# @stackra/csp

Stackra's Content Security Policy: one nonce-based baseline policy that every web and desktop target sends, a
configuration class a host adds sources to, a per-request nonce, and the React pieces that stamp the nonce on what a
server render writes.

**Tier:** `tier:lib` (`packages/security/csp`). Entries `.` and `./react`. Depends on `@stackra/config`,
`@stackra/contracts`, `@stackra/validation` and zod; React is an optional peer of `./react`.

## What is here

| Entry     | Symbol                  | Use                                                                                            |
| --------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| `.`       | `CspConfig`             | the configuration (key `csp`): `extraConnectSrc`, `extraFrameSrc`, `extraImgSrc`, `reportOnly` |
| `.`       | `contentSecurityPolicy` | `contentSecurityPolicy(csp, { connect, nonce })`: the header value                             |
| `.`       | `cspHeaderName`         | `Content-Security-Policy`, or `…-Report-Only` while `reportOnly` is on                         |
| `.`       | `createNonce`           | 128 random bits, base64, once per request                                                      |
| `.`       | `CspAdditions`          | type of the second argument of `contentSecurityPolicy`                                         |
| `./react` | `NonceProvider`         | puts the request's nonce under the server render                                               |
| `./react` | `useNonce`              | the nonce, or `undefined` outside a provider (the browser)                                     |
| `./react` | `Style`                 | a `<style>` element that carries the nonce                                                     |

## The baseline

```text
default-src 'self'; script-src 'self' 'nonce-…'; style-src 'self' 'nonce-…'; style-src-attr 'unsafe-inline';
img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none';
base-uri 'none'; form-action 'self'; frame-ancestors 'none'
```

Scripts and `<style>` elements load from the origin or carry the request's nonce; there is no `'unsafe-inline'` or
`'unsafe-eval'` for either. `style-src-attr 'unsafe-inline'` allows the inline `style` attributes server-rendered React
markup carries, nothing else. A host adds sources to `connect-src`, `frame-src` and `img-src` only; every other
directive is fixed. A source is one host or scheme source: a quoted keyword, a bare `*`, whitespace, `;` or `,` is
refused at boot by the schema and again by `contentSecurityPolicy`. A URL counts by its origin, so
`https://api.acme.example/v1` allows `https://api.acme.example`.

## Overriding the configuration

```ts
// src/config/csp.config.ts
import { CspConfig as BaseCspConfig } from "@stackra/csp";

export class CspConfig extends BaseCspConfig {
  override extraConnectSrc: string[] = ["https://eu.i.posthog.com"];
  override extraFrameSrc: string[] = ["https://challenges.cloudflare.com"];
  override reportOnly = true; // report violations, block nothing, until a release runs clean
}
```

## The server middleware and the render

```ts
const nonce = createNonce();
context.set(nonceContext, nonce);
const response = await next();
const csp = container.get(CspConfig);
response.headers.set(
  cspHeaderName(csp),
  contentSecurityPolicy(csp, { connect: [env.apiUrl], nonce }),
);
```

```tsx
<NonceProvider value={nonce}>
  <ServerRouter context={routerContext} url={request.url} nonce={nonce} />
</NonceProvider>;

// in the document shell and the layouts
const nonce = useNonce();
<Scripts nonce={nonce} />;
<Style data-brand>{css}</Style>;
```

The generated entries do this; app code only overrides `CspConfig` and renders `Style`.

Governing ADRs: 0237 (edge headers), 0251 (desktop hardening), 0294 (decisions 15, 19, 20 and 23), 0146 as amended,
0305 (rules 10 to 12), 0127 (2026-10-24 note).
