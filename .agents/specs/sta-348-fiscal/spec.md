# Feature Specification: `@stackra/fiscal`, e-invoicing and till fiscal drivers chosen by market-pack data

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/fiscal` (commerce) covering two rows of `stackra-package-needs.md`: `@stackra/fiscal`
(ZATCA Phase 2, Egypt ETA with item codes and a cloud seal, UAE tax invoices and Peppol through an ASP, EU Peppol,
Factur-X/ZUGFeRD hybrid PDF, receipt QR, CSID per till) and "EU till fiscal drivers" (German TSE, French NF525, Belgian
FDM, Italian RT, Austrian RKSV, Spanish Verifactu, the ZATCA device CSID; offline signing and journal export), drivers
selected by market-pack data.

## Impact

- **Apps touched**: none (ADR 0364 added in `apps/docs/src/adr`; the integrator adds the index row)
- **Services touched**: none (OS invoicing, devices and Commerce tills consume it later)
- **Packages touched**: `packages/commerce/fiscal` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none stored by the package; the host's `FiscalJournal` binding stores records
- **Secrets**: none read; keys, credentials and CSID secrets stay behind host ports
- **ADR needed**: yes, ADR 0364 (Proposed): owner approval (questionnaire #21) and the till-driver scope
- **New dependencies**: none new; `zod` from the default catalog
- **Deploy modes**: same in all; isomorphic, offline sealing
- **Licence tier**: free (MIT)
- **Lane**: full (a new package)
- **Change risk**: R3 (legal documents: a wrong hash, chain or field is a compliance defect)

## Conflicts settled (handover "Conflicts to settle", recommended options)

- #3 device registry and pairing stay in `@stackra/devices`; fiscal hardware is reached through its `FiscalDevice` port.
- #4 the e-signature port is `@stackra/documents`'; fiscal signing is its own `FiscalSigner` port (fiscal seals, not
  e-signatures), and the hybrid PDF is the `HybridPdf` port `@stackra/documents` binds.
- #1, #2, #5, #6 do not touch this package.

## User Scenarios & Testing

### User Story 1 - Seal a sale offline under the market's till rule (P1)

A till in any market seals each sale through `FiscalService.seal(document, { market, channel: "till", unitId })`; the
pack names the driver; the record is chained and carries the receipt QR and marks; no network is needed.

### User Story 2 - Submit when online, in order (P1)

`submitPending` hands sealed records to the authority in sequence order, stores each answer, and stops at an
unreachable authority. `offlineStatus` reports the backlog against the pack's reporting window.

### User Story 3 - Issue a B2B e-invoice under the market's mandate (P1)

An invoice is sealed in the `invoice` channel by the pack's mandate driver (clearance, Peppol through an access point
or ASP, ETA batch, Factur-X hybrid PDF).

### User Story 4 - Onboard a till's CSID (P2)

Device pairing calls `ZatcaOnboarding.compliance`, `check` and `production`; issued secrets go to the host store only.

### User Story 5 - Export a unit's journal for an auditor (P2)

`exportJournal` returns the mandate's export (device archive, DEP file, JSON lines).

## Requirements

- **FR-001**: member `@stackra/fiscal` at `packages/commerce/fiscal`, `tier:lib`, entries `.`, `./contracts`, `./testing`.
- **FR-002**: one `FiscalDriver` port; drivers `zatca`, `eta`, `peppol`, `factur-x`, `tse`, `nf525`, `fdm`, `rt`, `rksv`,
  `verifactu`, each selected by the key a pack names.
- **FR-003**: every market value (endpoint, version, profile, mapping, slot, bucket, time zone, window, retention) is a
  pack option validated by the driver's schema with no default in code.
- **FR-004**: sealing is offline-capable and idempotent per (unit, document); the chain has no gaps; a race is
  `FiscalChainConflictError`.
- **FR-005**: submission runs in sequence order and leaves records sealed when the authority is unreachable.
- **FR-006**: keys, credentials, hardware and PDF embedding are host ports; no secret is read, returned or logged.
- **FR-007**: receipt QR: ZATCA TLV, TSE QR, RKSV machine-readable code, Verifactu verification URL.
- **FR-008**: CSID per till through `ZatcaOnboarding`.
- **FR-009**: journal export per driver.
- **FR-010**: every source file has the file contract and one declaration; every public symbol has a test in
  `__tests__/` beside it.

## Acceptance criteria

- **SC-001**: the files of FR-001 exist; the barrels export exactly what their index tests list.
- **SC-002**: the package's tests, typecheck and build pass in the separate testing workflow (not run here, owner mode).
- **SC-003**: no file under `src/` outside tests and fixtures names a market, a rate or an endpoint.
