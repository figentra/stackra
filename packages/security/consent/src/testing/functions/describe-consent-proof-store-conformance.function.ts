/**
 * Stackra file contract:
 * Purpose: `describeConsentProofStoreConformance(name, make)`, the port conformance suite of `ConsentProofStore`:
 *          `latest` answers the newest proof of a subject for a document whatever its version and nothing when there is
 *          none, `list` answers every proof of a subject oldest first with each field exactly as appended (no field
 *          added, none dropped), and one subject's proofs never show under another.
 * Boundary: test support. Every test mints fresh subject ids, so a driver over a shared real database runs the suite
 *           without clearing it; a driver over row-level security wraps its calls in one tenant's isolation run. The
 *           memory driver runs it here; the Postgres driver runs it against a real database in its integration test.
 *           Imports only types from this package's other entries.
 * Runtime: node
 * Governing contract: ADR 0454 (decision 5: the evidence trail is the rows as written); ADR 0269 (decision 3);
 *                     STA-2818.
 */
import { mintPublicId } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { ConsentVerificationMethod } from "#contracts/enums/consent-verification-method.enum";
import type { ConsentProofStore } from "#contracts/ports/consent-proof-store.port";
import type { ConsentProof } from "#contracts/types/consent-proof.type";

/** A proof `subject` gave themself to `version` of `document` at `at`. */
function ownProof(subject: PublicId, document: string, version: string, at: string): ConsentProof {
  return { subject, givenBy: subject, document, version, granted: true, at };
}

/**
 * Registers the `ConsentProofStore` conformance tests under `describe(name)`.
 *
 * @param name - the suite's name, usually the driver's.
 * @param make - a store to test; called once per test.
 * @example
 * describeConsentProofStoreConformance("MemoryConsentProofStoreDriver", () => new MemoryConsentProofStoreDriver());
 */
export function describeConsentProofStoreConformance(
  name: string,
  make: () => ConsentProofStore,
): void {
  describe(`${name} (ConsentProofStore conformance)`, () => {
    it("answers the newest proof for a document whatever its version, and nothing when there is none", async () => {
      const store = make();
      const subject = mintPublicId("usr");
      await store.append(ownProof(subject, "terms", "2026-01", "2026-01-01T00:00:00.000Z"));
      await store.append(ownProof(subject, "privacy", "3", "2026-02-01T00:00:00.000Z"));
      await store.append({
        ...ownProof(subject, "terms", "2026-10", "2026-10-01T00:00:00.000Z"),
        granted: false,
      });
      expect(await store.latest(subject, "terms")).toEqual({
        ...ownProof(subject, "terms", "2026-10", "2026-10-01T00:00:00.000Z"),
        granted: false,
      });
      expect((await store.latest(subject, "privacy"))?.version).toBe("3");
      expect(await store.latest(subject, "photos")).toBeUndefined();
      expect(await store.latest(mintPublicId("usr"), "terms")).toBeUndefined();
    });

    it("lists a subject's proofs oldest first, each exactly as appended", async () => {
      const store = make();
      const child = mintPublicId("usr");
      const parent = mintPublicId("usr");
      const own = ownProof(child, "terms", "1", "2026-03-01T10:00:00.000Z");
      const forChild: ConsentProof = {
        subject: child,
        givenBy: parent,
        relationship: "guardian",
        document: "photos",
        version: "2",
        contentHash: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
        granted: true,
        at: "2026-03-02T11:30:15.250Z",
        channel: "guardian_app",
        verificationMethod: "guardian_login" as ConsentVerificationMethod,
        verificationReference: "cgl_01j9z3k4m5n6p7q8r9s0t1v2g1",
      };
      await store.append(own);
      await store.append(forChild);
      const listed = await store.list(child);
      expect(listed).toEqual([own, forChild]);
      expect(new Set(Object.keys(listed[0] ?? {}))).toEqual(new Set(Object.keys(own)));
      expect(await store.list(parent)).toEqual([]);
    });

    it("keeps one subject's proofs apart from another's", async () => {
      const store = make();
      const first = mintPublicId("usr");
      const second = mintPublicId("usr");
      await store.append(ownProof(first, "terms", "1", "2026-04-01T00:00:00.000Z"));
      await store.append(ownProof(second, "terms", "2", "2026-04-02T00:00:00.000Z"));
      expect((await store.list(first)).map((proof) => proof.version)).toEqual(["1"]);
      expect((await store.latest(second, "terms"))?.version).toBe("2");
    });
  });
}
