/**
 * Stackra file contract:
 * Purpose: unit tests of `axe`: a labelled pressable, a labelled image and a named heading pass; a nameless pressable,
 *          an unlabelled image and an empty heading are reported in tree order; a child's label names a pressable;
 *          hidden subtrees and decorative images are skipped.
 * Boundary: test only; the trees are plain host nodes shaped like the test renderer's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6).
 */
import "#native/axe/to-have-no-violations.matcher";

import { describe, expect, it } from "@stackra/testing";

import { axe } from "#native/axe/axe.function";
import type { AxeNode } from "#native/axe/axe-node.type";

/** A host node. */
const node = (
  type: string,
  props: Readonly<Record<string, unknown>> = {},
  ...children: (AxeNode | string)[]
): AxeNode => ({ type, props, children });

const press = () => undefined;

describe(axe, () => {
  it("passes a labelled pressable, a labelled image and a named heading", async () => {
    const container = node(
      "View",
      {},
      node("View", { role: "button", onClick: press }, node("Text", {}, "Scan")),
      node("Image", { accessibilityLabel: "Acme" }),
      node("Text", { role: "heading" }, "Orders"),
    );
    expect(await axe({ container })).toHaveNoViolations();
  });

  it("reports a nameless pressable, an unlabelled image and an empty heading in tree order", async () => {
    const result = await axe({
      container: node(
        "View",
        {},
        node("View", { onClick: press }),
        node("Image"),
        node("Text", { accessibilityRole: "header" }),
      ),
    });
    expect(result.violations.map((violation) => violation.rule)).toEqual([
      "pressable-name",
      "image-alt",
      "heading-name",
    ]);
    expect(result).not.toHaveNoViolations();
  });

  it("names an icon button by its image's label", async () => {
    const container = node(
      "View",
      { accessibilityRole: "button" },
      node("Image", { "aria-label": "Close" }),
    );
    expect(await axe({ container })).toHaveNoViolations();
  });

  it("skips hidden subtrees and decorative images", async () => {
    const container = node(
      "View",
      {},
      node("View", { importantForAccessibility: "no-hide-descendants" }, node("Image")),
      node("View", { "aria-hidden": true }, node("View", { onClick: press })),
      node("Image", { accessible: false }),
    );
    expect(await axe({ container })).toHaveNoViolations();
  });
});
