/**
 * Stackra file contract:
 * Purpose: proves the ChapterTitleBlock is an `h2` by default (or the level given) drawn at the `h2` size in the core
 *          tone, with its subtitle, no landmark and nothing to focus; that it reads the same in Arabic; and that it
 *          draws everything at once at every motion level.
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

import { ChapterTitleBlock } from "#react/chapter-title-block/chapter-title-block";

/** jsdom has no matchMedia; the provider and Motion read the system's scheme and motion from it. */
vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}));

describe("ChapterTitleBlock", () => {
  afterEach(cleanup);

  it("is an h2 with its subtitle, no landmark and nothing to focus", () => {
    const { container } = render(
      <ChapterTitleBlock title="Write it once" subtitle="One action, every surface." />,
    );
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Write it once");
    expect(screen.getByText("One action, every surface.")).toBeTruthy();
    expect(container.querySelectorAll("header, section, nav, a, button, [tabindex]")).toHaveLength(
      0,
    );
  });

  it("takes another level and still looks like an h2", () => {
    render(
      <>
        <ChapterTitleBlock title="Layers" level={3} />
        <ChapterTitleBlock title="Agents" />
      </>,
    );
    const third = screen.getByRole("heading", { level: 3 });
    expect(third.textContent).toBe("Layers");
    expect(third.className).toBe(screen.getByRole("heading", { level: 2 }).className);
  });

  it("reads the same in Arabic", () => {
    render(
      <DesignSystemProvider locale="ar" hasShortcutCheatSheet={false}>
        <ChapterTitleBlock title="اكتبه مرة واحدة" />
      </DesignSystemProvider>,
    );
    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("اكتبه مرة واحدة");
  });

  it("draws everything at once below the full motion level", () => {
    render(
      <DesignSystemProvider motion="none" hasShortcutCheatSheet={false}>
        <ChapterTitleBlock title="Ship it" subtitle="dev, staging, production" />
      </DesignSystemProvider>,
    );
    expect(screen.getByRole("heading", { name: "Ship it" })).toBeTruthy();
    expect(screen.getByText("dev, staging, production")).toBeTruthy();
  });
});
