/**
 * Stackra file contract:
 * Purpose: unit tests of `SubjectErased`: an integration event named `subject.erased` (wire name
 *          `privacy.subject.erased.v1`) that carries the receipt
 *          and refuses an unknown erasure method.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0141; STA-1375.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { SubjectErased } from "#core/events/subject-erased.event";

/** A receipt as the saga records it. */
const RECEIPT = {
  erasureId: "era_1",
  subject: "usr_1",
  erased: [{ kind: "crm.address", method: "delete" as const, count: 2 }],
  kept: [{ kind: "crm.customer", reason: "hold" as const, count: 1 }],
  shredded: false,
  at: "2026-10-28T00:00:00.000Z",
};

describe("SubjectErased", () => {
  it("is the subject.erased integration event", () => {
    expect(kindOf(SubjectErased)?.kind).toBe("integration_event");
    expect(kindOf(SubjectErased)?.options["name"]).toBe("subject.erased");
  });

  it("carries the receipt", () => {
    expect({ ...SubjectErased.create(RECEIPT) }).toMatchObject(RECEIPT);
  });

  it("refuses an unknown method", () => {
    expect(() =>
      SubjectErased.create({
        ...RECEIPT,
        erased: [{ kind: "crm.address", method: "burn" as never, count: 1 }],
      }),
    ).toThrow();
  });
});
