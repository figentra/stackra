/**
 * Stackra file contract:
 * Purpose: `axe(view)`, the accessibility check of a rendered React Native tree in a unit test: every pressable has an
 *          accessible name, every image a label, every heading a name; `expect(await axe(view)).toHaveNoViolations()`.
 * Boundary: reads the host tree a render returned (its `container`) and asserts nothing itself. A subtree hidden from
 *           assistive technology (`aria-hidden`, `accessibilityElementsHidden`, `importantForAccessibility:
 *           "no-hide-descendants"`) is skipped; an image marked `accessible={false}` is decorative. Resolves, like the
 *           web check, so a test reads the same on both targets.
 * Runtime: react-native
 * Governing contract: ADR 0269 (decision 6).
 */
import type { AxeNode } from "#native/axe/axe-node.type";
import type { AxeResult } from "#native/axe/axe-result.type";

/** Roles a user activates. */
const PRESSABLE_ROLES = new Set([
  "button",
  "checkbox",
  "link",
  "menuitem",
  "radio",
  "switch",
  "tab",
  "togglebutton",
]);

/** Roles of an image. */
const IMAGE_ROLES = new Set(["image", "img"]);

/** Roles of a heading. */
const HEADING_ROLES = new Set(["header", "heading"]);

/** Whether `props` hide the node and its subtree from assistive technology. */
const isHidden = (props: AxeNode["props"]): boolean =>
  props["aria-hidden"] === true ||
  props["accessibilityElementsHidden"] === true ||
  props["importantForAccessibility"] === "no-hide-descendants";

/** The label `props` give their node, trimmed; empty without one. */
const labelOf = (props: AxeNode["props"]): string => {
  const label = props["aria-label"] ?? props["accessibilityLabel"] ?? props["alt"];
  return typeof label === "string" ? label.trim() : "";
};

/** What the subtree under `node` reads out: each child's label, else its text. */
const textOf = (node: AxeNode): string =>
  node.children
    .map((child) => {
      if (typeof child === "string") return child;
      if (isHidden(child.props)) return "";
      return labelOf(child.props) || textOf(child);
    })
    .join("");

/**
 * The accessibility violations of the tree `view` rendered.
 *
 * @example
 * const view = await render(<Home />);
 * expect(await axe(view)).toHaveNoViolations();
 */
// shortcut: three rules over the host tree (pressable names, image labels, heading names), not axe-core's rule set,
// which has no React Native runner: no `aria-labelledby`, input labels, contrast or touch-target size; replace with a
// full rule engine when one exists for the test renderer.
export function axe(view: { readonly container: AxeNode }): Promise<AxeResult> {
  const violations: AxeResult["violations"][number][] = [];
  const visit = (node: AxeNode): void => {
    const { props } = node;
    if (isHidden(props)) return;
    const role = String(props["role"] ?? props["accessibilityRole"] ?? "");
    const named = labelOf(props) !== "" || textOf(node).trim() !== "";
    if (node.type === "Image" || IMAGE_ROLES.has(role)) {
      if (props["accessible"] !== false && labelOf(props) === "")
        violations.push({
          rule: "image-alt",
          message: `${node.type} has no accessibilityLabel, aria-label or alt`,
          node,
        });
    } else if (
      PRESSABLE_ROLES.has(role) ||
      typeof props["onPress"] === "function" ||
      typeof props["onClick"] === "function"
    ) {
      if (!named)
        violations.push({
          rule: "pressable-name",
          message: `pressable ${node.type} has no label and no text`,
          node,
        });
    } else if (HEADING_ROLES.has(role) && !named) {
      violations.push({
        rule: "heading-name",
        message: `heading ${node.type} has no label and no text`,
        node,
      });
    }
    for (const child of node.children) if (typeof child !== "string") visit(child);
  };
  visit(view.container);
  return Promise.resolve({ violations });
}
