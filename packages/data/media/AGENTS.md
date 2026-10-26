# AGENTS — @stackra/media

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/media: where code goes, the package rules (the `Upload` wire schema gen relies on
         included), the rules that fail the build and PII.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0222; ADR 0294; ADR 0305; STA-1218.
-->

The `Bucket` kind, signed direct uploads and their claim, the media store and uploader ports with their drivers, and
the React hooks. Member at `packages/data/media` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305).
Entries `.`, `./contracts`, `./node`, `./react`, `./testing`.

## Where code goes

| You are writing…                   | It goes in…                                    |
| ---------------------------------- | ---------------------------------------------- |
| The store port or a type it speaks | `src/contracts/{ports,types}/`                 |
| The configuration                  | `src/config/media.config.ts`                   |
| An isomorphic driver               | `src/core/drivers/<name>.driver.ts`            |
| A server-only driver               | `src/node/drivers/<name>.driver.ts`            |
| An action, its input or output     | `src/node/{actions,schemas}/`                  |
| `MediaLibrary`                     | `src/core/services/`                           |
| A pure helper                      | `src/core/functions/`                          |
| React code                         | `src/react/<hook>/`                            |
| A test helper                      | `src/testing/`                                 |
| A test                             | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## This package

- The bytes never pass through a service (ADR 0222 decision 2). Never add an endpoint that takes a file body.
- A token carries the upload id only. The bucket key, media type and expiry are signed into the upload and read back
  from the store at claim. Never trust a bucket, type or size the client sends at claim time.
- Every stored path is built by the server from a registered key, a checked id and an enum media type. Never put
  client text into a path.
- `claim` refuses before it moves, and deletes a file its bucket does not take. A second claim must find nothing.
- Stored paths start with the visibility (`public/`, `private/`); the CDN serves `public/` only.
- No tenant vocabulary (R-59): isolation is the signed token and the unguessable id.
- `Upload.schema` is the wire schema gen writes for every `Upload<Bucket>` field (gen's `upload` kind, STA-1218), and
  gen's JSON Schema mirrors it (`{ id: "upl_…" }`). Change the token's wire form only together with gen's
  `jsonSchemaOf`.
- `./contracts` imports no other entry; `src/*/index.ts` are stand-in barrels until gen writes them (STA-339).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

| Data                  | Where                  | Handling                                                                      |
| --------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| Uploaded files        | the media store        | Never read, logged or put in an error by this package; a refusal names rules. |
| Signed upload URLs    | `upload.create` output | A short-lived credential for one object; returned to the caller only.         |
| Upload and bucket ids | refusal details, paths | Ids only.                                                                     |
