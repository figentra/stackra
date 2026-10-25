/**
 * Stackra file contract:
 * Purpose: unit tests of `SubjectChangeService`: a committed change of a registered subject model's row recomputes that
 *          subject under the model's key, a deleted row included; a change of another model is ignored.
 * Boundary: test only; the segment service is an in-test fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0332 (decision 3); ADR 0221 (decision 5).
 */
import type { AnyClass } from "@stackra/container";
import { RowChangeKind } from "@stackra/outbox/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { SegmentSubject } from "#contracts/index";
import { SEGMENT_SUBJECTS } from "#node/constants/segment-subjects.constant";
import type { SegmentService } from "#node/services/segment.service";
import { SubjectChangeService } from "#node/services/subject-change.service";

/** A subject model and its subject class. */
class Contact {}
class ContactSegmentSubject {}
SEGMENT_SUBJECTS.set("crm.contact", {
  model: Contact,
  type: ContactSegmentSubject as unknown as AnyClass<SegmentSubject>,
});

/** A consumer over a fake segment service. */
function setup() {
  const segments = { recomputeSubject: vi.fn(async (_subject: object) => undefined) };
  return { consumer: new SubjectChangeService(segments as unknown as SegmentService), segments };
}

describe(SubjectChangeService, () => {
  it("recomputes a changed subject under its model key", async () => {
    const { consumer, segments } = setup();
    await consumer.consume({
      model: "Contact",
      id: "con_1",
      kind: RowChangeKind.Updated,
      fields: ["email"],
    });
    await consumer.consume({
      model: "Contact",
      id: "con_2",
      kind: RowChangeKind.Deleted,
      fields: [],
    });
    expect(segments.recomputeSubject.mock.calls).toEqual([
      [{ model: "crm.contact", id: "con_1" }],
      [{ model: "crm.contact", id: "con_2" }],
    ]);
  });

  it("ignores a change of a model no subject names", async () => {
    const { consumer, segments } = setup();
    await consumer.consume({
      model: "Invoice",
      id: "inv_1",
      kind: RowChangeKind.Created,
      fields: [],
    });
    expect(segments.recomputeSubject).not.toHaveBeenCalled();
  });
});
