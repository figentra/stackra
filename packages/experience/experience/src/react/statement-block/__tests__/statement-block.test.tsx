/**
 * Stackra file contract:
 * Purpose: proves the StatementBlock draws `*`-marked words as steel `strong` text and leaves an unpaired `*` as
 *          written, lists its facts, adds nothing focusable, reads the same in Arabic, and draws everything at once at
 *          every motion level.
 * Boundary: unit tier, jsdom, the real @stackra/ui components; matchMedia is a stand-in, and the locale and the
 *           motion level come from `DesignSystemProvider`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { DesignSystemProvider } from "@stackra/ui/react";
import { cleanup, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { StatementBlock } from "#react/statement-block/statement-block";

/** jsdom has no matchMedia; the provider and Motion read the system's scheme and motion from it. */
vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}));

describe("StatementBlock", () => {
  afterEach(cleanup);

  it("draws the marked words in steel and lists the facts, with nothing to focus", () => {
    const { container } = render(
      <StatementBlock
        text="Write an *action* once; gen makes the *endpoint*."
        facts={["MIT licensed", "Arabic first"]}
      />,
    );
    const marked = [...container.querySelectorAll("strong")];
    expect(marked.map((element) => element.textContent)).toEqual(["action", "endpoint"]);
    expect(marked[0]?.className).toContain("text-accent");
    expect(container.querySelector("p")?.textContent).toBe(
      "Write an action once; gen makes the endpoint.",
    );
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "MIT licensed",
      "Arabic first",
    ]);
    expect(container.querySelectorAll("a, button, [tabindex]")).toHaveLength(0);
  });

  it("leaves an unpaired mark as written and draws no list without facts", () => {
    const { container } = render(<StatementBlock text="One *pair* and *one" />);
    expect([...container.querySelectorAll("strong")].map((each) => each.textContent)).toEqual([
      "pair",
    ]);
    expect(container.querySelector("p")?.textContent).toBe("One pair and *one");
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("reads the same in Arabic", () => {
    const { container } = render(
      <DesignSystemProvider locale="ar" hasShortcutCheatSheet={false}>
        <StatementBlock text="اكتب *الإجراء* مرة واحدة." />
      </DesignSystemProvider>,
    );
    expect(document.documentElement.dir).toBe("rtl");
    expect(container.querySelector("strong")?.textContent).toBe("الإجراء");
  });

  it("draws everything at once below the full motion level", () => {
    render(
      <DesignSystemProvider motion="none" hasShortcutCheatSheet={false}>
        <StatementBlock text="One *backend*." facts={["MIT licensed"]} />
      </DesignSystemProvider>,
    );
    expect(screen.getByText("backend")).toBeTruthy();
    expect(screen.getByRole("listitem").textContent).toBe("MIT licensed");
  });
});
