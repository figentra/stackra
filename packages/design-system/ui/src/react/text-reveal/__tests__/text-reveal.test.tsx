/**
 * Stackra file contract:
 * Purpose: proves the web `TextReveal` draws one hidden box per word with the whole text read once, keeps a mixed
 *          Arabic and Latin text as one piece, and draws plain text at the `none` level or when not animated.
 * Boundary: jsdom with real Motion; the motion level comes from the context.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); ADR 0060; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { TextReveal } from "#react/text-reveal/text-reveal";

const at = (resolvedMotion: DesignSystemState["resolvedMotion"]) =>
  ({ resolvedMotion }) as DesignSystemState;

describe("TextReveal (web)", () => {
  it("reveals word by word and reads the whole text once", () => {
    const { container } = render(
      <DesignSystemContext value={at("full")}>
        <TextReveal>One system, every screen</TextReveal>
      </DesignSystemContext>,
    );
    expect(container.querySelectorAll("[aria-hidden] > span")).toHaveLength(4);
    expect(container.querySelector(".sr-only")?.textContent).toBe("One system, every screen");
  });

  it("keeps a mixed-direction text whole", () => {
    const { container } = render(
      <DesignSystemContext value={at("full")}>
        <TextReveal>نظام Stackra الموحّد</TextReveal>
      </DesignSystemContext>,
    );
    expect(container.querySelectorAll("[aria-hidden] > span")).toHaveLength(1);
  });

  it("draws plain text at none and when not animated", () => {
    const none = render(
      <DesignSystemContext value={at("none")}>
        <TextReveal>Plain</TextReveal>
      </DesignSystemContext>,
    );
    expect(none.container.innerHTML).toBe("Plain");
    expect(render(<TextReveal isAnimated={false}>Still</TextReveal>).container.innerHTML).toBe(
      "Still",
    );
  });
});
