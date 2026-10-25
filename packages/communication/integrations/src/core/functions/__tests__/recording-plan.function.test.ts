/**
 * Stackra file contract:
 * Purpose: unit tests of `recordingPlan` and `RecordingConsent`: no wish means nothing; each consent rule's plan; an
 *          explicit rule records only after a yes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; PUT-216.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RecordingConsent } from "#contracts/enums/recording-consent.enum";
import { recordingPlan } from "#core/functions/recording-plan.function";

describe("recordingPlan", () => {
  it("follows the Market's rule", () => {
    expect(Enum.values(RecordingConsent)).toEqual(["not_required", "notice", "explicit"]);
    expect(recordingPlan({ rule: RecordingConsent.Notice, wanted: false })).toEqual({
      record: false,
      notice: false,
      ask: false,
    });
    expect(recordingPlan({ rule: RecordingConsent.NotRequired, wanted: true })).toEqual({
      record: true,
      notice: false,
      ask: false,
    });
    expect(recordingPlan({ rule: RecordingConsent.Notice, wanted: true })).toEqual({
      record: true,
      notice: true,
      ask: false,
    });
    expect(recordingPlan({ rule: RecordingConsent.Explicit, wanted: true })).toEqual({
      record: false,
      notice: false,
      ask: true,
    });
    expect(
      recordingPlan({ rule: RecordingConsent.Explicit, wanted: true, consented: true }).record,
    ).toBe(true);
    expect(
      recordingPlan({ rule: RecordingConsent.Explicit, wanted: true, consented: false }).record,
    ).toBe(false);
  });
});
