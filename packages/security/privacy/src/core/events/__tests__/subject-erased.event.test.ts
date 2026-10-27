/**
 * Stackra file contract:
 * Purpose: unit tests of `SubjectErased`: an integration event named `privacy.subject_erased` that carries the receipt
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
  erased: [{ kind: "Address", method: "delete" as const, count: 2 }],
  kept: [{ kind: "Customer", reason: "hold" as const, count: 1 }],
  shredded: false,
  at: "2026-10-28T00:00:00.000Z",
};

describe("SubjectErased", () => {
  it("is the privacy.subject_erased integration event", () => {
    expect(kindOf(SubjectErased)?.kind).toBe("integration_event");
    expect(kindOf(SubjectErased)?.options["name"]).toBe("privacy.subject_erased");
  });

  it("carries the receipt", () => {
    expect({ ...SubjectErased.create(RECEIPT) }).toMatchObject(RECEIPT);
  });

  it("refuses an unknown method", () => {
    expect(() =>
      SubjectErased.create({
        ...RECEIPT,
        erased: [{ kind: "Address", method: "burn" as never, count: 1 }],
      }),
    ).toThrow();
  });
});
