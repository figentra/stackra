/**
 * Stackra file contract:
 * Purpose: unit tests of `CHECKLIST_TEMPLATE_SCHEMA` and `INDUSTRY_PROFILE_SCHEMA`: a template defaults each step to
 *          unlocked and scope-wide, and refuses a key outside `workflow-template:<product>:<name>`, a bad version, no
 *          steps and two steps with one key; a profile maps checklist keys to customizations.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0424 (decisions 1, 2 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { CHECKLIST_TEMPLATE_SCHEMA } from "#core/constants/checklist-template-schema.constant";
import { INDUSTRY_PROFILE_SCHEMA } from "#core/constants/industry-profile-schema.constant";

const STEP = { key: "add_product", label: "commerce::onboarding.add_product" };

const TEMPLATE = { key: "workflow-template:commerce:onboarding", version: "1.2.0", steps: [STEP] };

describe("CHECKLIST_TEMPLATE_SCHEMA", () => {
  it("defaults a step to unlocked and scope-wide", () => {
    expect(CHECKLIST_TEMPLATE_SCHEMA.parse(TEMPLATE).steps[0]).toEqual({
      ...STEP,
      locked: false,
      audience: "scope",
    });
  });

  it.each([
    { ...TEMPLATE, key: "commerce.onboarding" },
    { ...TEMPLATE, version: "1.2" },
    { ...TEMPLATE, steps: [] },
    { ...TEMPLATE, steps: [STEP, STEP] },
    { ...TEMPLATE, steps: [{ ...STEP, label: "Add a product" }] },
  ])("refuses %j", (template) => {
    expect(CHECKLIST_TEMPLATE_SCHEMA.safeParse(template).success).toBe(false);
  });
});

describe("INDUSTRY_PROFILE_SCHEMA", () => {
  it("maps checklist keys to customizations", () => {
    expect(
      INDUSTRY_PROFILE_SCHEMA.parse({
        key: "salon",
        label: "commerce::industries.salon",
        checklists: { [TEMPLATE.key]: { hidden: ["add_product"] } },
      }).checklists,
    ).toEqual({ [TEMPLATE.key]: { hidden: ["add_product"], order: [] } });
  });
});
