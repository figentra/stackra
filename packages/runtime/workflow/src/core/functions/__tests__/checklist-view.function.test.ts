/**
 * Stackra file contract:
 * Purpose: unit tests of `checklistView`: locked steps keep their template place, unlocked ones follow the scope's
 *          order and hide; a hidden or ordered key the template no longer has, or now locks, is ignored; done and
 *          complete count the visible steps only.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0424 (decisions 1 and 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { CHECKLIST_TEMPLATE_SCHEMA } from "#core/constants/checklist-template-schema.constant";
import { checklistView } from "#core/functions/checklist-view.function";

const TEMPLATE = CHECKLIST_TEMPLATE_SCHEMA.parse({
  key: "workflow-template:commerce:onboarding",
  version: "1.0.0",
  steps: [
    {
      key: "verify_email",
      label: "commerce::onboarding.verify_email",
      locked: true,
      audience: "user",
    },
    { key: "add_product", label: "commerce::onboarding.add_product" },
    { key: "connect_payments", label: "commerce::onboarding.connect_payments", locked: true },
    { key: "invite_staff", label: "commerce::onboarding.invite_staff" },
    { key: "pick_theme", label: "commerce::onboarding.pick_theme" },
  ],
});

const keysOf = (view: ReturnType<typeof checklistView>): string[] =>
  view.steps.map((step) => step.key);

describe(checklistView, () => {
  it("shows the template as it is without a customization", () => {
    const view = checklistView(TEMPLATE, { hidden: [], order: [] }, new Set());
    expect(keysOf(view)).toEqual([
      "verify_email",
      "add_product",
      "connect_payments",
      "invite_staff",
      "pick_theme",
    ]);
    expect(view).toMatchObject({ key: TEMPLATE.key, done: 0, complete: false });
  });

  it("keeps locked steps in place, orders and hides unlocked ones", () => {
    const view = checklistView(
      TEMPLATE,
      { hidden: ["invite_staff"], order: ["pick_theme"] },
      new Set(["verify_email"]),
    );
    expect(keysOf(view)).toEqual(["verify_email", "pick_theme", "connect_payments", "add_product"]);
    expect(view.steps[0]).toMatchObject({ locked: true, audience: "user", done: true });
  });

  it("ignores keys the template no longer has or now locks", () => {
    const view = checklistView(
      TEMPLATE,
      { hidden: ["connect_payments", "gone"], order: ["gone"] },
      new Set(),
    );
    expect(keysOf(view)).toContain("connect_payments");
    expect(view.steps).toHaveLength(5);
  });

  it("is complete when every visible step is done", () => {
    const view = checklistView(
      TEMPLATE,
      { hidden: ["add_product", "invite_staff", "pick_theme"], order: [] },
      new Set(["verify_email", "connect_payments"]),
    );
    expect(view).toMatchObject({ done: 2, complete: true });
  });
});
