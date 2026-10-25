# Plan: `@stackra/market-packs`

**Spec**: `.agents/specs/sta-348-market-packs/spec.md`

## Design

- Shape: `MARKET_PACK_SCHEMA` (exported as `MarketPack$`) and `SIGNED_PACK_SCHEMA` (`SignedPack$`); types are their
  outputs.
- Integrity: `canonicalJson` (keys sorted at every depth) → `contentHash` (SHA-256 hex) → `signPack` (Ed25519 over the
  hash) and `verifyPack` (shape, hash over the pack as shipped, key, signature). Refusal: `PackRejectedError`.
- Resolution: `pickPack` (highest accepted version under a pin) and `resolvePack` (walk `extends` to the root, sections
  beside each base on its major line, cycle check). Refusal: `PackNotFoundError`.
- Values: `valuesOn` (per layer, the entry in force with the latest start; later layers win) and the views `valueOf`,
  `floorsOn`, `factsOn`.
- Gate: `unreviewed` (keys without a sign-off) and `launchGate` (status, checklist per product, reviews).

## Constitution Check

| Law                                   | Result | Note                                                                        |
| ------------------------------------- | ------ | --------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib`; imports `@stackra/contracts`, `@stackra/errors` and `zod` only  |
| Secrets (ADR 0173)                    | PASS   | no secret read; the private key is the caller's `CryptoKey`                 |
| Security                              | PASS   | packs are verified (hash and signature) before use; shape checked by schema |
| HTTP and events                       | N/A    | none                                                                        |
| Tenancy                               | N/A    | no tenant data stored; pins are passed in                                   |
| Configuration over code (ADR 0363)    | PASS   | no market, value or law in code; floors are pack data                       |
| Not built yet (ADR 0227)              | PASS   | no new dependency; Web Crypto                                               |
| Test placement (ADR 0022)             | PASS   | every test in `src/**/__tests__/`                                           |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                           |
| Deploy modes (ADR 0076)               | PASS   | isomorphic, offline                                                         |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts, ADR 0370 (Proposed)                         |

## Deploy modes

| Mode       | Behaviour                                             |
| ---------- | ----------------------------------------------------- |
| SaaS       | a library bundled into services, apps and tills       |
| On-prem    | identical; the deployment configures its trusted keys |
| Air-gapped | identical: needs no network                           |
