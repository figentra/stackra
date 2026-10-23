/**
 * Stackra file contract:
 * Purpose: proves the tone icons draw by name, each of the four a tone uses by default, and that they sit on top of the
 *          shell's icons instead of replacing them.
 * Boundary: jsdom with the real web Icon; no theme CSS is loaded.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 10); ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-105
import { Icon } from "@stackra/ui/react";
import { render } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { ToneIcons } from "#src/components/tone-icons";

describe("ToneIcons", () => {
  it.each(["info", "circle-check", "triangle-alert", "circle-alert"] as const)(
    "draws %s by name",
    (name) => {
      const { container } = render(
        <ToneIcons>
          <Icon name={name} />
        </ToneIcons>,
      );
      expect(container.querySelector("svg.lucide")).toBeTruthy();
    },
  );

  it("keeps the icons of the shell it sits in", () => {
    const { container } = render(
      <PlaygroundIcons>
        <ToneIcons>
          <Icon name="trash" />
        </ToneIcons>
      </PlaygroundIcons>,
    );
    expect(container.querySelector("svg.lucide-trash")).toBeTruthy();
  });
});
