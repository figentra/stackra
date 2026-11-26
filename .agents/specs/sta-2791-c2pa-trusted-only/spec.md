# Feature Specification: the C2PA driver says trusted only for a trusted signer

**Feature Branch**: `figentra/sta-2791-c2pa-trusted-only`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2791

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: `@stackra/media`'s `c2pa` content-credentials driver returned a credential whenever c2pa-rs did not call
the manifest `Invalid`. A manifest signed by any certificate, including one from a self-made CA, came back exactly like
a genuine one: c2pa-rs marks that case `Valid` but not `Trusted`, and `credentialOf` refused only `Invalid`. Anyone
could therefore produce an image whose credential reads back as verified. The CTO ruled on 2026-11-25 (STA-2791):
"genuine" means `Trusted` (the manifest validates and the signer chains to an allowed anchor); the anchors are the
official C2PA trust list, pinned in the repo and updated by PR, never fetched at run time, plus our own signing
certificates; three states (`trusted`, `unverified`, `invalid`); fail closed (an empty or unreadable list, or an
expired anchor, is never `trusted`).

### Sources

- `packages/data/media/src/node/drivers/c2pa-content-credentials.driver.ts` and
  `packages/data/media/src/node/functions/credential-of.function.ts` (the read before this change)
- `packages/data/media/src/contracts/ports/content-credentials.port.ts` (the port before and after)
- The STA-2791 issue and the CTO decision of 2026-11-25 recorded on it
- `c2pa-org/conformance-public` `trust-list/C2PA-TRUST-LIST.pem` at commit `c68494b5954bcd19ec528d092377665ae9f62879`
- `@contentauth/c2pa-node` 0.9.10 and `@contentauth/c2pa-utilities` 0.3.2 (`Context`, `TrustSettings`,
  `VerifySettings`), probed on Linux x64 (box 2): an empty or unreadable anchor list and a self-made CA give `Valid`
  with `signingCredential.untrusted`; an anchor or an allowed end-entity certificate gives `Trusted` with
  `signingCredential.trusted`; the allowed list is dropped when no anchor list is given
- STA-2781 (stackra#1083): the certificate and PNG fixtures and the real-engine round trip this change reuses

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/data/media (the `ContentCredentials` port, a new `ContentCredentialTrust` enum and
  `ContentCredentialReading` type in `./contracts`, the `c2pa` driver, new `credentialTrustOf` and `certificatesIn`
  functions, the pinned `C2PA_TRUST_LIST` and `C2PA_TRUST_LIST_PIN` constants, `MediaOptions` / `MediaConfig$`
  `c2pa.trustedSigners`, tests, README, AGENTS.md)
- **Public contract change**: breaking. `ContentCredentials.read` returns `Promise<ContentCredentialReading | null>`
  instead of `Promise<ContentCredential | null>`. New exports `ContentCredentialTrust` (value and type) and
  `ContentCredentialReading` (type) from `@stackra/media/contracts`. New optional setting `media.c2pa.trustedSigners`
  (array of PEM certificates, default empty). Nothing removed or renamed.
- **Cross-service events**: none
- **Tenancy and data**: none. No storage; the trust list is global, never per tenant.
- **Security and privacy**: closes a provenance spoof: an untrusted signer's credential can no longer be presented as
  genuine. The read also stops fetching remote manifests and OCSP answers, so reading an image makes no network call.
  No personal data.
- **Secrets**: none added. `trustedSigners` holds public certificates only; the signing key stays the existing
  `MEDIA_C2PA_SIGNING_KEY` secret.
- **ADR needed**: no (implements the CTO decision of 2026-11-25 recorded on STA-2791, within ADR 0245 and COM-73 /
  COM-294)
- **New dependencies**: none (`@contentauth/c2pa-node`'s re-exported `Context` and `node:crypto`)
- **Deploy modes**: same in all three (the list is pinned in the package, so air-gapped reads need no network)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/data/media/README.md`, `packages/data/media/AGENTS.md`, a minor changeset for
  `@stackra/media`
- **Lane**: full (a public port's return type changes and an authenticity claim depends on it)
- **Change risk**: R2 (a breaking change to a public port and a security decision; normal review plus one strict read,
  as the CTO asked)

## Glossary _(full lane)_

- **Manifest**: the signed C2PA claim embedded in an image.
- **Anchor**: a certificate authority the reader trusts; a signer whose chain reaches one is trusted.
- **Allowed signer**: an end-entity certificate trusted directly (c2pa-rs `allowed_list`): our own signing certificates.
- **Trusted**: c2pa-rs's `Trusted` state with `signingCredential.trusted` on the active manifest.
- **Unverified**: the manifest validates (`Valid`) but no anchor vouches for the signer.
- **Invalid**: the manifest does not validate (hash mismatch, bad signature).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A spoofed credential is never shown as genuine (Priority: P1)

Someone signs an AI-made image with a certificate from a CA they made themselves and uploads it. The product reads its
credential and shows the claims as "unverified", never as a verified origin.

**Why this priority**: this is the spoof the issue reports.

**Independent Test**: sign a PNG on the real engine with a throwaway CA and read it back with a driver that does not
hold that signer.

**Acceptance Scenarios**:

1. **Given** an image signed by a self-made CA, **When** the driver reads it, **Then** the reading is
   `{ trust: "unverified", credential }` and c2pa-rs's own state is `Valid` with `signingCredential.untrusted`.

---

### User Story 2 - Our own media reads as trusted (Priority: P1)

The platform signs an image it generated and later reads it back: the reading is `trusted`, including after the
signing certificate is rotated, while the earlier certificate is kept in `media.c2pa.trustedSigners`.

**Independent Test**: sign and read with the same configured certificate; read with only `trustedSigners` set.

**Acceptance Scenarios**:

1. **Given** our signing certificate configured, **When** the driver reads an image it signed, **Then** the reading is
   `trusted`.
2. **Given** only `trustedSigners: [earlier certificate]`, **When** the driver reads an image the earlier certificate
   signed, **Then** the reading is `trusted`.

---

### User Story 3 - A changed image is invalid (Priority: P1)

**Acceptance Scenarios**:

1. **Given** an image our signer signed, **When** its pixels change after signing, **Then** the reading is
   `{ trust: "invalid" }` with no credential.

---

### User Story 4 - The read fails closed (Priority: P1)

**Acceptance Scenarios**:

1. **Given** an empty, unreadable or throwing trust list, **When** the driver reads our own signed image, **Then** the
   reading is `unverified`.
2. **Given** a signer that chains to a trust-list anchor, **When** the anchor has expired, **Then** the reading is
   `unverified` (and `trusted` while the anchor is valid).

---

### Edge Cases

- **EC-01**: An image with no manifest, or one c2pa-rs cannot parse, is `null` (unchanged).
- **EC-02**: A manifest that validates but states no generator or time is `null` (no credential to show).
- **EC-03**: A `Trusted` state without `signingCredential.trusted`, or with any failure code, is `unverified`.
- **EC-04**: A CA certificate in the signing chain or in `trustedSigners` is never allowed as a signer; only the
  end-entity certificate is.
- **EC-05**: An expired signing certificate is dropped from the allowed list, so its media read `unverified`.
- **EC-06**: A store with no validation state and no failure (older engine shape) is `unverified`, not `trusted`.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE `ContentCredentials.read` port SHALL return `ContentCredentialReading | null`, where a reading is
  `{ trust: "trusted" | "unverified", credential }` or `{ trust: "invalid" }`.
- **FR-002**: THE `c2pa` driver SHALL report `trusted` only when c2pa-rs's state is `Trusted`, the active manifest
  carries `signingCredential.trusted` and no failure code.
- **FR-003**: THE `c2pa` driver SHALL give c2pa-rs as anchors only the pinned C2PA trust list's certificates valid now,
  and as allowed signers only the end-entity certificates, valid now, of the configured signing chain and of
  `media.c2pa.trustedSigners`.
- **FR-004**: IF no anchor is usable (empty, unreadable or throwing list, or all expired) THEN THE `c2pa` driver SHALL
  never report `trusted`.
- **FR-005**: THE `c2pa` driver SHALL read with trust verification on and with remote-manifest and OCSP fetching off.
- **FR-006**: THE pinned list SHALL be the upstream file byte for byte, its SHA-256 recorded beside it and checked by a
  test.
- **FR-007**: THE `media` configuration SHALL accept `c2pa.trustedSigners` as PEM certificates only, default empty.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN the signer chains to no allowed anchor (a self-made CA) THE `c2pa` driver SHALL return
  `{ trust: "unverified", credential }`.
- **AC-002**: WHEN our configured signing certificate, or one in `trustedSigners`, signed the image THE `c2pa` driver
  SHALL return `{ trust: "trusted", credential }`.
- **AC-003**: WHEN the image changed after signing THE `c2pa` driver SHALL return `{ trust: "invalid" }`.
- **AC-004**: IF the trust list is empty, unreadable or throws THEN THE `c2pa` driver SHALL return `unverified`, even
  for our own signer.
- **AC-005**: IF the only anchor has expired THEN THE `c2pa` driver SHALL return `unverified`.
- **AC-006**: THE `c2pa` driver SHALL read with `verifyTrust` on and `remoteManifestFetch` and `ocspFetch` off.
- **AC-007**: THE pinned trust list's SHA-256 SHALL equal `C2PA_TRUST_LIST_PIN.sha256`, and every block in it SHALL
  parse as a CA certificate.

## Success Criteria _(mandatory)_

- **SC-001**: `c2pa-round-trip.test.ts` proves AC-001 to AC-005 on the real c2pa-rs engine (Linux x64), and fails with
  the trust decision reverted — verified by: unit (real engine)
- **SC-002**: `c2pa-content-credentials.driver.test.ts`, `credential-trust-of.function.test.ts`,
  `certificates-in.function.test.ts` and `c2pa-trust-list.constant.test.ts` prove FR-001 to FR-007 and AC-006, AC-007
  on every platform — verified by: unit
- **SC-003**: the `@stackra/media` tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- Callers of `ContentCredentials.read` move from `credential` to `reading?.credential` and must check
  `reading.trust === ContentCredentialTrust.Trusted` before showing a credential as genuine. No caller in this repo or
  the template reads it today.
- Behaviour change: an image signed by a CA on no trust list reads `unverified` (it read as a plain credential); a
  tampered image reads `{ trust: "invalid" }` (it was `null`).
- A deployment whose signing certificate is rotated adds the earlier certificate to `media.c2pa.trustedSigners`.

## Risks

- **R-1**: The C2PA time-stamp authority list is not pinned. If c2pa-rs marks a time-stamp from an unlisted TSA as
  untrusted, a genuine time-stamped image would read `unverified` (fail closed, never a false `trusted`). No real
  C2PA-list-signed, time-stamped sample was available to prove either way; a follow-up tests one.
- **R-2**: The pinned list ages: a CA added upstream reads `unverified` until a PR copies the newer list.
- **R-3**: An expired anchor drops media its CA vouched for while it was valid, even with a trusted time-stamp, as the
  CTO decision asks.

## Out of scope

- A per-tenant trust setting (ruled out by the CTO decision).
- Fetching the trust list at run time.
- Signing with a time-stamp authority: `attach` with `timestampUrl` set fails on c2pa-node 0.9.10 ("the sync http
  resolver is not implemented"), a separate defect found while probing.

## Assumptions

- c2pa-rs's `Trusted` state with `signingCredential.trusted` is the engine's statement that the chain reaches a given
  anchor or allowed certificate (probed on c2pa-node 0.9.10).

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2791 session) · written from the CTO decision of 2026-11-25 and the built change
- 2026-11-26 · Draft → Clarified · Claude (STA-2791 session) · clarifications complete (the CTO decision answers them)
- 2026-11-26 · Clarified → Planned · Claude (STA-2791 session) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-2791 session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-2791 session) · T001 to T007 built on the branch
