/**
 * Stackra file contract:
 * Purpose: runs `describeConsentProofStoreConformance` against `MemoryConsentProofStoreDriver`, so the suite itself is
 *          exercised on every unit run and the memory driver keeps to the port the Postgres driver keeps to.
 * Boundary: test only; the Postgres driver runs the same suite in its integration test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); STA-2818.
 */
import { MemoryConsentProofStoreDriver } from "#core/drivers/memory-consent-proof-store.driver";
import { describeConsentProofStoreConformance } from "#testing/functions/describe-consent-proof-store-conformance.function";

describeConsentProofStoreConformance(
  "MemoryConsentProofStoreDriver",
  () => new MemoryConsentProofStoreDriver(),
);
