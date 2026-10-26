/**
 * Stackra file contract:
 * Purpose: unit tests of `checkCustomization`: it returns a customization of unlocked, known, distinct steps, defaults
 *          missing lists to empty, and refuses a locked, unknown or repeated step at its path.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0424 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { CHECKLIST_TEMPLATE_SCHEMA } from "#core/constants/checklist-template-schema.constant";
import { ChecklistInvalidError } from "#core/errors/checklist-invalid.error";
import { checkCustomization } from "#core/functions/check-customization.function";

const TEMPLATE = CHECKLIST_TEMPLATE_SCHEMA.parse({
  key: "workflow-template:commerce:onboarding",
  version: "1.0.0",
  steps: [
    { key: "connect_payments", label: "commerce::onboarding.connect_payments", locked: true },
    { key: "add_product", label: "commerce::onboarding.add_product" },
    { key: "invite_staff", label: "commerce::onboarding.invite_staff" },
  ],
});

describe(checkCustomization, () => {
  it("returns a customization of unlocked steps, lists defaulting to empty", () => {
    expect(checkCustomization(TEMPLATE, { hidden: ["add_product"] })).toEqual({
      hidden: ["add_product"],
      order: [],
    });
  });

  it("refuses a locked, unknown or repeated step at its path", () => {
    try {
      checkCustomization(TEMPLATE, {
        hidden: ["connect_payments", "nope"],
        order: ["invite_staff", "invite_staff"],
      });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ChecklistInvalidError);
      expect((error as ChecklistInvalidError).fieldErrors).toEqual({
        "hidden.0": "step_locked",
        "hidden.1": "step_unknown",
        "order.1": "step_duplicate",
      });
    }
  });
});
