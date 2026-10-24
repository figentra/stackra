/**
 * Stackra file contract:
 * Purpose: proves the web ChatLoader announces its loading state from `label`, maps `size` to HeroUI Pro, stays
 *          decorative without a label, passes unknown props through, carries HeroUI Pro's skeleton parts, and
 *          refuses a size outside sm, md and lg.
 * Boundary: jsdom with real HeroUI Pro; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { ChatLoader as HeroChatLoader } from "@heroui-pro/react/chat-loader";
import { render, screen } from "@testing-library/react";

import { ChatLoader } from "#react/chat-loader/chat-loader";

describe("ChatLoader (web)", () => {
  it.each(["Dots", "Pulse", "Spinner", "Skeleton"] as const)(
    "%s announces its loading state as a status named by label",
    (part) => {
      const Part = ChatLoader[part];
      render(<Part label="Loading the reply" />);
      const status = screen.getByRole("status", { name: "Loading the reply" });
      expect(status.getAttribute("aria-label")).toBe("Loading the reply");
    },
  );

  it.each(["Dots", "Pulse", "Spinner"] as const)(
    "%s is hidden from assistive technology without a label",
    (part) => {
      const Part = ChatLoader[part];
      render(<Part data-testid="loader" />);
      expect(screen.queryByRole("status")).toBeNull();
      expect(screen.getByTestId("loader").getAttribute("aria-hidden")).toBe("true");
    },
  );

  it("passes the size and unknown props through, and leaves HeroUI Pro's default size without one", () => {
    const { rerender } = render(
      <ChatLoader.Dots size="lg" id="d" className="extra" data-testid="loader" />,
    );
    const sized = screen.getByTestId("loader");
    expect(sized.id).toBe("d");
    expect(sized.classList.contains("extra")).toBe(true);
    const large = sized.className;
    rerender(<ChatLoader.Dots data-testid="loader" className="extra" />);
    expect(screen.getByTestId("loader").className).not.toBe(large);
    rerender(<HeroChatLoader.Dots size="lg" data-testid="loader" className="extra" />);
    expect(screen.getByTestId("loader").className).toBe(large);
  });

  it("draws a skeleton from HeroUI Pro's parts", () => {
    render(
      <ChatLoader.Skeleton label="Loading" data-testid="skeleton">
        <ChatLoader.SkeletonAvatar data-testid="avatar" />
        <ChatLoader.SkeletonBlock>
          <ChatLoader.SkeletonLine data-testid="line" />
        </ChatLoader.SkeletonBlock>
      </ChatLoader.Skeleton>,
    );
    expect(screen.getByTestId("skeleton").getAttribute("aria-busy")).toBe("true");
    expect(screen.getByTestId("avatar")).toBeTruthy();
    expect(screen.getByTestId("line")).toBeTruthy();
  });

  it("carries HeroUI Pro's own skeleton parts and refuses a size outside sm, md and lg", () => {
    for (const part of ["SkeletonAvatar", "SkeletonBlock", "SkeletonLine"] as const) {
      expect(ChatLoader[part]).toBe(HeroChatLoader[part]);
    }
    // @ts-expect-error a size is sm, md or lg
    void (<ChatLoader.Dots size="xl" />);
  });
});
