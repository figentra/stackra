/**
 * Stackra file contract:
 * Purpose: proves every icon name the web components draw by themselves (the copy and check marks of a property list,
 *          the chevrons of pagination) is in the package's own registry and draws a real SVG with no app registry, so
 *          a component never renders a labelled button with an empty face.
 * Boundary: jsdom with the real registry and real lucide-react; unlike the component tests, nothing is mocked.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 10); ADR 0313 (decisions 1 and 4); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-052 sta-350:FR-132 sta-350:FR-142 sta-350:FR-158
import { render } from "@testing-library/react";

import { Icon } from "#react/icon/icon";
import { UI_ICONS } from "#react/icon/ui-icons.constant";

describe("UI_ICONS (web)", () => {
  it.each([
    "copy",
    "check",
    "chevron-left",
    "chevron-right",
    "chevron-down",
    "panel-left-open",
    "panel-left-close",
    "eye",
    "eye-off",
    // The quantity stepper's minus once drew an empty grey button: no registry held it.
    "minus",
    "plus",
    "trash",
  ] as const)("draws %s without the app registering it", (name) => {
    expect(UI_ICONS[name]).toBeDefined();
    const { container } = render(<Icon name={name} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
