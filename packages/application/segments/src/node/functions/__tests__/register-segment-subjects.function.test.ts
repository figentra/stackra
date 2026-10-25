/**
 * Stackra file contract:
 * Purpose: unit tests of `registerSegmentSubjects`: a row records the subject by model key and watches the model's rows
 *          with `SubjectChangeService`; registering it again changes nothing; a malformed key, a key taken by another
 *          class and a model already registered under another key are refused.
 * Boundary: test only; the outbox's `registerChangeConsumers` is mocked, so the outbox's registry stays untouched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0332 (decisions 1 and 3); ADR 0221 (decision 5).
 */
import type { AnyClass } from "@stackra/container";
import { registerChangeConsumers } from "@stackra/outbox";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { SegmentSubject } from "#contracts/index";
import { SEGMENT_SUBJECTS } from "#node/constants/segment-subjects.constant";
import { registerSegmentSubjects } from "#node/functions/register-segment-subjects.function";
import { SubjectChangeService } from "#node/services/subject-change.service";

vi.mock("@stackra/outbox", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  registerChangeConsumers: vi.fn(),
}));

/** The models and subject classes of the cases. */
class Company {}
class Lead {}
class CompanySegmentSubject {}
class OtherSegmentSubject {}
const COMPANY = CompanySegmentSubject as unknown as AnyClass<SegmentSubject>;
const OTHER = OtherSegmentSubject as unknown as AnyClass<SegmentSubject>;

describe("registerSegmentSubjects", () => {
  it("records the subject and watches its model's rows", () => {
    registerSegmentSubjects([{ key: "crm.company", model: Company, type: COMPANY }]);
    expect(SEGMENT_SUBJECTS.get("crm.company")).toEqual({ model: Company, type: COMPANY });
    expect(registerChangeConsumers).toHaveBeenCalledWith([[Company, SubjectChangeService]]);
    expect(() =>
      registerSegmentSubjects([{ key: "crm.company", model: Company, type: COMPANY }]),
    ).not.toThrow();
  });

  it("refuses a malformed key, a taken key and a model under two keys", () => {
    expect(() => registerSegmentSubjects([{ key: "Company", model: Lead, type: OTHER }])).toThrow(
      TypeError,
    );
    expect(() =>
      registerSegmentSubjects([{ key: "crm.company", model: Company, type: OTHER }]),
    ).toThrow(/already registered/);
    expect(() =>
      registerSegmentSubjects([{ key: "crm.organisation", model: Company, type: COMPANY }]),
    ).toThrow(/already the subject crm.company/);
    expect(SEGMENT_SUBJECTS.has("crm.organisation")).toBe(false);
  });
});
