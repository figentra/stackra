---
"@stackra/entitlements": minor
---

Entitlement bundles per edition (ADR 0335 decision 6, stackra-64): `bundleEditionCatalogue(edition, bundle, base)`
sells an edition's bundled base module entitlements (`EditionEntitlementBundle`, every tier or per tier) in its own
plan catalogue, so `tierPlan` grants them and never an unbundled base module.
