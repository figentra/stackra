/**
 * Stackra file contract:
 * Purpose: proves the native `NumberTicker` counts from `from` to its value in the provider's locale, labels itself
 *          with the final value for VoiceOver and TalkBack, and shows the value at once below the full motion level.
 * Boundary: React Native does not render in vitest: the native Text is a plain DOM stand-in, and
 *           `requestAnimationFrame` is driven by hand.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { NumberTicker } from "#native/number-ticker/number-ticker";

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement(
        "span",
        { "aria-label": props["accessibilityLabel"] },
        props["children"] as ReactNode,
      ),
  };
});

const frames: ((time: number) => void)[] = [];

describe("NumberTicker (native)", () => {
  beforeEach(() => {
    frames.length = 0;
    vi.stubGlobal("requestAnimationFrame", (callback: (time: number) => void) =>
      frames.push(callback),
    );
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("counts to the value and is labelled with it", () => {
    const { container } = render(
      <DesignSystemContext value={{ locale: "de-DE", resolvedMotion: "full" } as DesignSystemState}>
        <NumberTicker value={12_500} from={100} duration={1000} />
      </DesignSystemContext>,
    );
    const text = container.querySelector("span");
    expect(text?.textContent).toBe("100");
    expect(text?.getAttribute("aria-label")).toBe("12.500");
    act(() => frames.shift()?.(0));
    act(() => frames.shift()?.(1000));
    expect(text?.textContent).toBe("12.500");
  });

  it("shows the value at once at the none level", () => {
    const { container } = render(
      <DesignSystemContext value={{ locale: "en", resolvedMotion: "none" } as DesignSystemState}>
        <NumberTicker value={7} />
      </DesignSystemContext>,
    );
    expect(container.textContent).toBe("7");
  });
});
