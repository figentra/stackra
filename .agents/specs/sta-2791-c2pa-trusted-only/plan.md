# Implementation Plan: the C2PA driver says trusted only for a trusted signer

**Spec**: `.agents/specs/sta-2791-c2pa-trusted-only/spec.md` · **Linear**: STA-2791 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2791-c2pa-trusted-only/spec.md`

## Summary

`ContentCredentials.read` now returns a reading with a trust state. The `c2pa` driver reads with a c2pa-rs `Context`
that holds the pinned C2PA trust list's anchors valid now and our own end-entity signing certificates valid now, turns
trust verification on and network fetches off, and maps the store to `trusted` (state `Trusted` plus
`signingCredential.trusted`), `unverified` or `invalid`. With no usable anchor it never says `trusted`.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/data/media`
- **Testing**: vitest; the mocked-engine unit tests run everywhere, the real c2pa-rs round trip on Linux x64
- **Storage**: none
- **Runtime target**: any host that binds the `c2pa` driver (`./node`)

## Constitution Check

| Law                                   | Result | Note                                                               |
| ------------------------------------- | ------ | ------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | `./contracts` imports nothing new; `./node` imports `./contracts`  |
| Secrets (ADR 0009, ADR 0173)          | PASS   | no new secret; `trustedSigners` is public certificates             |
| Security                              | PASS   | closes a provenance spoof; reading makes no network call           |
| HTTP and events                       | N/A    | no route, header or event                                          |
| Tenancy                               | PASS   | one global pinned list; no tenant input reaches the trust decision |
| Delegation                            | PASS   | Claude only                                                        |
| Not built yet (ADR 0011)              | N/A    | none                                                               |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                              |
| Versions and catalogs                 | PASS   | a minor changeset for `@stackra/media`; no dependency added        |
| Deploy modes (ADR 0076)               | PASS   | same in all three; the list is in the package, so air-gapped works |
| Licence tier (ADR 0077)               | PASS   | free, MIT; the C2PA trust list is public data                      |
| Docs and ADRs                         | PASS   | README, AGENTS.md, changeset; the CTO decision is on STA-2791      |

## Deploy modes

| Mode       | Behaviour                                                                |
| ---------- | ------------------------------------------------------------------------ |
| SaaS       | same read; the pinned list ships in the package                          |
| On-prem    | same                                                                     |
| Air-gapped | same; no trust list, remote manifest or OCSP fetch happens during a read |

## Correctness properties

- **P-001**: `trusted` needs `Trusted` plus `signingCredential.trusted`, no failure — Validates: FR-002, AC-001, AC-002
- **P-002**: no anchor or signer outside its validity, and no CA as a signer — Validates: FR-003, AC-005, EC-04, EC-05
- **P-003**: with no usable anchor the reading is never `trusted` — Validates: FR-004, AC-004
- **P-004**: a store that does not validate yields no credential — Validates: FR-001, AC-003
- **P-005**: the pinned list is the upstream file — Validates: FR-006, AC-007
- **P-006**: a read never fetches a remote manifest or an OCSP answer, and verifies trust — Validates: FR-005, AC-006
- **P-007**: the configuration takes only PEM certificates as trusted signers — Validates: FR-007, AC-002

## Architecture overview

`read(bytes, type)`:

1. `formatOf(type)` (unchanged refusal for other types).
2. Anchors: `certificatesIn(trustList())` parsed once (an unreadable or throwing list is none), filtered to those
   valid now. Signers: the first end-entity certificate of `c2paSigningCertificate` and of each `trustedSigners` entry,
   parsed once, filtered to those valid now.
3. `Reader.fromAsset(asset, new Context({ verify: { verifyTrust, verifyTimestampTrust, verifyAfterReading: true,
ocspFetch: false, remoteManifestFetch: false }, trust: { trustAnchors, allowedList } }))`; the `trust` section is
   left out when no anchor is usable (c2pa-rs drops an allowed list without anchors anyway).
4. `credentialTrustOf(store)`; `invalid` returns `{ trust }`; otherwise `credentialOf(store)` (null stays null) and the
   trust, capped at `unverified` when no anchor was usable.

## Components and responsibilities

- `ContentCredentialTrust` (enum, `./contracts`): `trusted`, `unverified`, `invalid`.
- `ContentCredentialReading` (type, `./contracts`): the discriminated union `read` returns.
- `credentialTrustOf` (pure): the store's trust state.
- `certificatesIn` (node): the readable X.509 certificates of a PEM text.
- `C2PA_TRUST_LIST`, `C2PA_TRUST_LIST_PIN` (node constants): the pinned upstream list and where it came from.
- `C2paContentCredentialsDriver.read` and its protected `trustList()` (the seam the fail-closed tests override).

## Files and folders

```text
packages/data/media/
  README.md
  AGENTS.md
  src/contracts/index.ts
  src/contracts/__tests__/index.test.ts
  src/contracts/enums/content-credential-trust.enum.ts
  src/contracts/enums/__tests__/content-credential-trust.enum.test.ts
  src/contracts/types/content-credential-reading.type.ts
  src/contracts/ports/content-credentials.port.ts
  src/contracts/ports/__tests__/text-extractor.port.test.ts
  src/core/schemas/media-options.schema.ts
  src/core/constants/media-config-schema.constant.ts
  src/core/constants/__tests__/media-config-schema.constant.test.ts
  src/node/constants/c2pa-trust-list.constant.ts
  src/node/constants/c2pa-trust-list-pin.constant.ts
  src/node/constants/__tests__/c2pa-trust-list.constant.test.ts
  src/node/functions/certificates-in.function.ts
  src/node/functions/credential-trust-of.function.ts
  src/node/functions/credential-of.function.ts
  src/node/functions/__tests__/certificates-in.function.test.ts
  src/node/functions/__tests__/credential-trust-of.function.test.ts
  src/node/types/c2pa-manifest-store.type.ts
  src/node/drivers/c2pa-content-credentials.driver.ts
  src/node/drivers/__tests__/c2pa-content-credentials.driver.test.ts
  src/node/drivers/__tests__/c2pa-round-trip.test.ts
  src/node/drivers/__tests__/c2pa-test-certificate.fixture.ts
  src/node/drivers/__tests__/png-chunk.fixture.ts
  src/node/drivers/__tests__/test-png.fixture.ts
  stackra.manifest.json
  package.json
.changeset/c2pa-read-trusted-only.md
```

The three fixtures come from STA-2781 (stackra#1083) unchanged, byte for byte. The build derives the
`media.ContentCredentialTrust` schema into `stackra.manifest.json`.

## Data models and migrations

None.

## Contracts

```ts
abstract read(bytes: Uint8Array, contentType: string): Promise<ContentCredentialReading | null>;

type ContentCredentialReading =
  | { readonly trust: "trusted" | "unverified"; readonly credential: ContentCredential }
  | { readonly trust: "invalid" };
```

- **Callers**: check `trust` before showing a credential as genuine; only `trusted` counts as proof.
- **Implementers**: return a reading; never `trusted` without a verified chain to an allowed anchor.
- **Operators**: rotate the signing certificate by moving the earlier one into `media.c2pa.trustedSigners`.

## Error handling

- An engine throw (no manifest, unparseable) is `null`, as before.
- An unreadable or throwing trust list is no anchor (fail closed), never an error.
- An unparseable `trustedSigners` entry is ignored at read; the config schema refuses a value without a PEM block.

## Security and tenancy

The trust decision takes no request or tenant input. The read makes no network call (no remote manifest, OCSP or trust
list fetch), so a crafted image cannot make the server fetch a URL. `trustedSigners` holds public certificates; keys
stay secrets.

## Testing strategy

- AC-001, AC-002, AC-003, AC-004, AC-005: `c2pa-round-trip.test.ts` on the real engine.
- AC-004, AC-006, P-002, EC-04, EC-05: `c2pa-content-credentials.driver.test.ts` (mocked engine, every platform).
- P-001, EC-03, EC-06: `credential-trust-of.function.test.ts`.
- AC-007: `c2pa-trust-list.constant.test.ts`; `certificates-in.function.test.ts`.
- AC-002, P-007: `media-config-schema.constant.test.ts` (a `trustedSigners` entry without a PEM block is refused).
- Revert checks: with `credentialTrustOf` accepting `Valid` as trusted, and with the no-anchor cap, the expiry filter,
  the CA filter or `remoteManifestFetch: false` removed, the round trip and unit tests fail (recorded in the PR).

## Rollout

- A minor changeset for `@stackra/media` that names the break.
- No data migration.
- Roll back by reverting the release; nothing is stored.

## Known risks

- R-1 to R-3 in spec.md (the TSA list, an ageing pinned list, expired anchors).
- STA-2781 (stackra#1083) adds the same three fixtures byte for byte and an older `c2pa-round-trip.test.ts`; whichever
  lands second keeps this branch's round-trip test (it is 1083's file extended with the trust cases).

## Delegation and risk plan

Claude only; one wave. R2: normal review plus one strict read (an authenticity claim), per the CTO decision.

## ADRs

- Implements the CTO decision of 2026-11-25 on STA-2791; within ADR 0245 (AI outputs) and ADR 0173 (secrets).

## Docs

- `packages/data/media/README.md`, `packages/data/media/AGENTS.md`, `.changeset/c2pa-read-trusted-only.md`.

## Complexity tracking

None.
