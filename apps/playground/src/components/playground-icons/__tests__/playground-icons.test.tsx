/**
 * Stackra file contract:
 * Purpose: proves the playground's registry draws the icons its pages use by name, and nothing else: a name outside
 *          it draws no icon, so the entry never carries the whole Lucide set.
 * Boundary: jsdom with the real web Icon; no theme CSS is loaded.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 10); ADR 0183 (budgets); ADR 0022 (test placement).
 */
// @covers sta-350:FR-054
import { Icon } from "@stackra/ui/react";
import { render } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";

describe("PlaygroundIcons", () => {
  it.each(["check", "chevron-right", "settings", "trash", "circle-x", "building", "bell"])(
    "draws %s by name",
    (name) => {
      const { container } = render(
        <PlaygroundIcons>
          <Icon name={name as "check"} />
        </PlaygroundIcons>,
      );
      expect(container.querySelector("svg.lucide")).toBeTruthy();
    },
  );

  it("draws nothing for an icon no page uses, so the full set is not bundled", () => {
    const { container } = render(
      <PlaygroundIcons>
        <Icon name="anchor" />
      </PlaygroundIcons>,
    );
    expect(container.querySelector("svg")).toBeNull();
  });
});
