/**
 * Stackra file contract:
 * Purpose: proves the web KioskSurface's own voice and idle reset: with audio on and no `speak`, an announcement is
 *          spoken by the browser in the provider's locale, cutting off the one before; where the browser has no speech
 *          synthesis it is only shown; a child's `resetIdle` restarts the countdown; unmounting stops it.
 * Boundary: jsdom with fake timers; `speechSynthesis` and `SpeechSynthesisUtterance` are stand-ins, and the provider's
 *           state is given through `DesignSystemContext` with only the locale the surface reads.
 * Runtime: browser
 * Governing contract: ADR 0428 (decision 1); WCAG 2.2 SC 2.2.1 and 4.1.3; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { KioskSurface } from "#react/kiosk-surface/kiosk-surface";
import { useKiosk } from "#react/kiosk-surface/use-kiosk";

/** A child that announces, and one that keeps the kiosk awake. */
function Controls() {
  const kiosk = useKiosk();
  return (
    <>
      <button type="button" onClick={() => kiosk?.announce("Item added")}>
        Add
      </button>
      <button type="button" onClick={() => kiosk?.resetIdle()}>
        Still here
      </button>
    </>
  );
}

/** A provider stand-in carrying only the locale. */
const inLocale = (locale: string, children: ReactNode) => (
  <DesignSystemContext value={{ locale } as unknown as DesignSystemState}>
    {children}
  </DesignSystemContext>
);

/** Records what the browser was asked to say. */
class UtteranceStandIn {
  lang = "";

  constructor(readonly text: string) {}
}

describe("KioskSurface speech (web)", () => {
  const synthesis = { cancel: vi.fn(), speak: vi.fn() };

  beforeEach(() => {
    vi.useFakeTimers();
    synthesis.cancel.mockClear();
    synthesis.speak.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("speaks an announcement in the provider's locale, cutting off the one before", () => {
    vi.stubGlobal("speechSynthesis", synthesis);
    vi.stubGlobal("SpeechSynthesisUtterance", UtteranceStandIn);
    render(
      inLocale(
        "ar-SA",
        <KioskSurface idleTimeoutMs={1000} onIdle={vi.fn()} isAudioOn>
          <Controls />
        </KioskSurface>,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("status").textContent).toBe("Item added");
    expect(synthesis.cancel).toHaveBeenCalledTimes(1);
    const [spoken] = synthesis.speak.mock.calls[0] ?? [];
    expect(spoken).toEqual(expect.objectContaining({ text: "Item added", lang: "ar-SA" }));
  });

  it("leaves the language to the browser outside a provider", () => {
    vi.stubGlobal("speechSynthesis", synthesis);
    vi.stubGlobal("SpeechSynthesisUtterance", UtteranceStandIn);
    render(
      <KioskSurface idleTimeoutMs={1000} onIdle={vi.fn()} isAudioOn>
        <Controls />
      </KioskSurface>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(synthesis.speak.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ lang: "" }));
  });

  it("only shows the announcement where the browser cannot speak", () => {
    vi.stubGlobal("speechSynthesis", undefined);
    render(
      <KioskSurface idleTimeoutMs={1000} onIdle={vi.fn()} isAudioOn>
        <Controls />
      </KioskSurface>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("status").textContent).toBe("Item added");
  });

  it("restarts the countdown from a child's resetIdle and stops it when unmounted", () => {
    const onIdle = vi.fn();
    const { unmount } = render(
      <KioskSurface idleTimeoutMs={1000} onIdle={onIdle}>
        <Controls />
      </KioskSurface>,
    );
    act(() => vi.advanceTimersByTime(900));
    // A plain click fires no pointerdown or keydown, so only resetIdle can restart the countdown here.
    act(() => screen.getByRole("button", { name: "Still here" }).click());
    act(() => vi.advanceTimersByTime(900));
    expect(onIdle).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(100));
    expect(onIdle).toHaveBeenCalledOnce();
    unmount();
    act(() => vi.advanceTimersByTime(5000));
    expect(onIdle).toHaveBeenCalledOnce();
  });
});
