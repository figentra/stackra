/**
 * Stackra file contract:
 * Purpose: unit tests of `revocationPlan`: a copy is deleted only when its kind's terms say delete and no legal hold
 *          covers it; a held copy and a copy of an unlisted kind are kept.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0343 (decision 5); ADR 0134.
 */
import { describe, expect, it } from "@stackra/testing";

import { RevokedCopy } from "#core/enums/revoked-copy.enum";
import { revocationPlan } from "#core/functions/revocation-plan.function";

const items = {
  invoice: { onRevoke: RevokedCopy.Keep, receiverWritable: false },
  document: { onRevoke: RevokedCopy.Delete, receiverWritable: false },
};

describe("revocationPlan", () => {
  it("deletes by the terms, keeps held copies and unlisted kinds", () => {
    const plan = revocationPlan({ items }, [
      { id: "inv_1", kind: "invoice", held: false },
      { id: "doc_1", kind: "document", held: false },
      { id: "doc_2", kind: "document", held: true },
      { id: "msg_1", kind: "message", held: false },
    ]);
    expect(plan.map((step) => [step.copy.id, step.action])).toEqual([
      ["inv_1", RevokedCopy.Keep],
      ["doc_1", RevokedCopy.Delete],
      ["doc_2", RevokedCopy.Keep],
      ["msg_1", RevokedCopy.Keep],
    ]);
  });
});
