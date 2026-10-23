/**
 * Stackra file contract:
 * Purpose: proves the web DesignSystemProvider puts the colour scheme, `lang` and `dir` on the document element,
 *          follows the system scheme, hands React Aria the locale, and that useDesignSystem reads and sets the state.
 * Boundary: jsdom with a stubbed matchMedia; React Aria's I18nProvider is real.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-007 sta-350:FR-008 sta-350:P-006
import { useLocale } from "react-aria-components";
import { act, render, screen } from "@testing-library/react";

import { DesignSystemProvider, useDesignSystem } from "#react/index";

/** A matchMedia stand-in whose `prefers-color-scheme: dark` answer the test flips. */
function stubSystemScheme(dark: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    get matches() {
      return dark;
    },
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  };
  vi.stubGlobal("matchMedia", () => query);
  return (next: boolean) => {
    dark = next;
    for (const listener of listeners) listener();
  };
}

function Probe() {
  const state = useDesignSystem();
  const aria = useLocale();
  return (
    <>
      <output data-testid="state">
        {[
          state.colorScheme,
          state.resolvedColorScheme,
          state.locale,
          state.direction,
          state.theme,
        ].join(" ")}
      </output>
      <output data-testid="aria">{`${aria.locale} ${aria.direction}`}</output>
      <button type="button" onClick={() => state.setColorScheme("dark")}>
        dark
      </button>
      <button type="button" onClick={() => state.setLocale("ar")}>
        ar
      </button>
    </>
  );
}

const root = document.documentElement;

describe("DesignSystemProvider (web)", () => {
  beforeEach(() => {
    stubSystemScheme(false);
    root.className = "";
    root.removeAttribute("data-theme");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("applies a light scheme and a left-to-right locale by default", () => {
    render(
      <DesignSystemProvider>
        <Probe />
      </DesignSystemProvider>,
    );
    expect(screen.getByTestId("state").textContent).toBe("system light en ltr stackra");
    expect(root.dataset["theme"]).toBe("light");
    expect(root.classList.contains("light")).toBe(true);
    expect(root.classList.contains("dark")).toBe(false);
    expect(root.lang).toBe("en");
    expect(root.dir).toBe("ltr");
    expect(screen.getByTestId("aria").textContent).toBe("en ltr");
  });

  it("applies a dark scheme and derives right-to-left from an Arabic locale", () => {
    render(
      <DesignSystemProvider colorScheme="dark" locale="ar-EG">
        <Probe />
      </DesignSystemProvider>,
    );
    expect(root.dataset["theme"]).toBe("dark");
    expect(root.classList.contains("dark")).toBe(true);
    expect(root.classList.contains("light")).toBe(false);
    expect(root.lang).toBe("ar-EG");
    expect(root.dir).toBe("rtl");
    expect(screen.getByTestId("aria").textContent).toBe("ar-EG rtl");
  });

  it("lets a given direction win over the locale, in the document and in React Aria", () => {
    const { unmount } = render(
      <DesignSystemProvider locale="ar-EG" direction="ltr">
        <Probe />
      </DesignSystemProvider>,
    );
    expect(root.dir).toBe("ltr");
    expect(root.lang).toBe("ar-EG");
    expect(screen.getByTestId("aria").textContent).toBe("ar-Latn-EG ltr");
    unmount();

    render(
      <DesignSystemProvider locale="en" direction="rtl">
        <Probe />
      </DesignSystemProvider>,
    );
    expect(root.dir).toBe("rtl");
    expect(screen.getByTestId("aria").textContent).toBe("en-Arab rtl");
  });

  it("hands React Aria the locale unchanged when the direction agrees with it", () => {
    render(
      <DesignSystemProvider locale="ar" direction="rtl">
        <Probe />
      </DesignSystemProvider>,
    );
    expect(screen.getByTestId("aria").textContent).toBe("ar rtl");
  });

  it("follows the system scheme while the scheme is system", () => {
    const setSystemDark = stubSystemScheme(true);
    render(
      <DesignSystemProvider>
        <Probe />
      </DesignSystemProvider>,
    );
    expect(root.dataset["theme"]).toBe("dark");
    act(() => setSystemDark(false));
    expect(root.dataset["theme"]).toBe("light");
    expect(screen.getByTestId("state").textContent).toBe("system light en ltr stackra");
  });

  it("sets the scheme and locale when uncontrolled, and reports both", () => {
    const onColorSchemeChange = vi.fn();
    const onLocaleChange = vi.fn();
    render(
      <DesignSystemProvider
        onColorSchemeChange={onColorSchemeChange}
        onLocaleChange={onLocaleChange}
        theme="acme"
      >
        <Probe />
      </DesignSystemProvider>,
    );
    act(() => screen.getByRole("button", { name: "dark" }).click());
    act(() => screen.getByRole("button", { name: "ar" }).click());
    expect(screen.getByTestId("state").textContent).toBe("dark dark ar rtl acme");
    expect(root.dir).toBe("rtl");
    expect(onColorSchemeChange).toHaveBeenCalledWith("dark");
    expect(onLocaleChange).toHaveBeenCalledWith("ar");
  });

  it("keeps a controlled scheme until its owner changes it", () => {
    render(
      <DesignSystemProvider colorScheme="light">
        <Probe />
      </DesignSystemProvider>,
    );
    act(() => screen.getByRole("button", { name: "dark" }).click());
    expect(root.dataset["theme"]).toBe("light");
  });

  it("leaves <html> as it found it when it unmounts", () => {
    root.classList.add("light");
    root.dataset["theme"] = "light";
    root.lang = "en";
    root.removeAttribute("dir");
    const { unmount } = render(
      <DesignSystemProvider colorScheme="dark" locale="ar">
        <Probe />
      </DesignSystemProvider>,
    );
    expect([root.className, root.dataset["theme"], root.lang, root.dir]).toEqual([
      "dark",
      "dark",
      "ar",
      "rtl",
    ]);
    unmount();
    expect([root.className, root.dataset["theme"], root.lang, root.hasAttribute("dir")]).toEqual([
      "light",
      "light",
      "en",
      false,
    ]);
  });

  it("refuses useDesignSystem outside a provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow("needs a DesignSystemProvider");
  });
});
