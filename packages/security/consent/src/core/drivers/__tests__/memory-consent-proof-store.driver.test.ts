/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryConsentProofStoreDriver`: it is a `ConsentProofStore`, appends, reads the latest proof
 *          per subject and document, and lists a subject's proofs oldest first.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; owner round 3 #29.
 */
import { describe, expect, it } from "@stackra/testing";

import { ConsentProofStore } from "#contracts/ports/consent-proof-store.port";
import { MemoryConsentProofStoreDriver } from "#core/drivers/memory-consent-proof-store.driver";

const RANA = "usr_01j9z3k4m5n6p7q8r9s0t1v2r1";
const base = { subject: RANA, givenBy: RANA, document: "terms", granted: true } as const;

describe("MemoryConsentProofStoreDriver", () => {
  it("appends, reads the latest and lists", async () => {
    const store = new MemoryConsentProofStoreDriver();
    expect(store).toBeInstanceOf(ConsentProofStore);
    await store.append({ ...base, version: "1", at: "2026-01-01T00:00:00.000Z" });
    await store.append({ ...base, version: "2", at: "2026-10-01T00:00:00.000Z" });
    expect((await store.latest(RANA, "terms"))?.version).toBe("2");
    expect(await store.latest(RANA, "privacy")).toBeUndefined();
    expect((await store.list(RANA)).map((proof) => proof.version)).toEqual(["1", "2"]);
  });
});
