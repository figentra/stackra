/**
 * Stackra file contract:
 * Purpose: proves the web FeedbackIcon draws each tone's own icon at 16 px with nothing registered by the app, an
 *          element as given, a caller's named icon through the app's registry, and hides every icon from screen readers.
 * Boundary: jsdom with the real Icon and Lucide components.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 10); ADR 0312 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-113
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { Bell } from "@stackra/icons/react/lucide-icons";
import { render, screen } from "@testing-library/react";

import { Tone } from "#contracts/enums/tone.enum";
import { FEEDBACK_BY_TONE } from "#core/constants/feedback-by-tone.constant";
import { FeedbackIcon } from "#react/feedback-icon/feedback-icon";

describe("FeedbackIcon (web)", () => {
  it.each(Tone)("draws the %s tone's icon, 16 px and decorative", (tone) => {
    const { container } = render(<FeedbackIcon tone={tone} />);
    const icon = container.querySelector("svg");
    expect(icon?.classList.contains(`lucide-${FEEDBACK_BY_TONE[tone].icon}`)).toBe(true);
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
    expect([icon?.getAttribute("width"), icon?.getAttribute("height")]).toEqual(["16", "16"]);
  });

  it("draws an element as given", () => {
    const { container } = render(<FeedbackIcon tone="success" icon={<i data-testid="mine" />} />);
    expect(screen.getByTestId("mine")).toBeTruthy();
    expect(container.querySelector("svg")).toBeNull();
  });

  it("draws a named icon from the app's registry, beside the tone icons", () => {
    const { container } = render(
      <IconRegistryProvider registry={defineIconRegistry({ bell: Bell })}>
        <FeedbackIcon tone="danger" icon="bell" />
        <FeedbackIcon tone="danger" />
      </IconRegistryProvider>,
    );
    expect(container.querySelector("svg.lucide-bell")).toBeTruthy();
    expect(container.querySelector("svg.lucide-circle-alert")).toBeTruthy();
  });
});
