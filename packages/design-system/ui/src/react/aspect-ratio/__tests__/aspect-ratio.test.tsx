/**
 * Stackra file contract:
 * Purpose: proves the web AspectRatio holds the ratio it is given (1 by default) and renders its media.
 * Boundary: jsdom.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { AspectRatio } from "#react/aspect-ratio/aspect-ratio";

describe("AspectRatio (web)", () => {
  it("keeps the ratio and renders the media", () => {
    const { container, rerender } = render(
      <AspectRatio ratio={16 / 9}>
        <img src="/abaya.jpg" alt="Linen abaya" />
      </AspectRatio>,
    );
    const box = container.querySelector<HTMLElement>("[data-slot=aspect-ratio]");
    expect(box?.style.aspectRatio).toMatch(/^1\.777/);
    expect(screen.getByRole("img", { name: "Linen abaya" })).toBeTruthy();
    rerender(<AspectRatio />);
    expect(
      container.querySelector<HTMLElement>("[data-slot=aspect-ratio]")?.style.aspectRatio,
    ).toMatch(/^1( \/ 1)?$/);
  });
});
