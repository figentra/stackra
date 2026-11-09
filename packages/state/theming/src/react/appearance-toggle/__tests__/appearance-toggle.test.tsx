/**
 * Stackra file contract:
 * Purpose: proves the web AppearanceToggle offers the configured schemes as a named radio group with the chosen one
 *          checked, keeps a pick on the device and reports it, moves the choice with the arrow keys, only reports a
 *          pick when controlled, turns dark on and off as a switch, picks from a menu behind a named button, ties its
 *          help text to the control, refuses picks while disabled, and keeps its layout logical in Arabic.
 * Boundary: unit tier, jsdom, the real @stackra/ui components and a real `ColorSchemeService` (memory storage and
 *           system preference) in a container; the Arabic case renders under `dir="rtl"`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0060 (light, dark and right-to-left).
 */
// @vitest-environment jsdom
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import type { Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { ColorSchemeService, ThemingConfig } from "#core/index";
import { AppearanceToggle } from "#react/appearance-toggle/appearance-toggle";
import { fakeColorScheme } from "#testing/functions/fake-color-scheme.function";

const LABELS = { light: "Light", dark: "Dark", system: "System" };

/** A service over memory storage and a wrapper that binds it with the default configuration. */
async function setUp() {
  const config = buildConfig(ThemingConfig);
  const service = fakeColorScheme({ config });
  const container = await Container.create([], {
    overrides: new Map<Token, object>([
      [ThemingConfig, config],
      [ColorSchemeService, service],
    ]),
  });
  const wrap = (children: ReactNode, dir: "ltr" | "rtl" = "ltr") => (
    <ContainerProvider container={container}>
      <div dir={dir}>{children}</div>
    </ContainerProvider>
  );
  return { service, wrap };
}

describe("AppearanceToggle (web)", () => {
  beforeAll(() => {
    // jsdom has no layout; the menu scrolls its focused item into view (as in the Dropdown test).
    Object.defineProperty(Element.prototype, "scrollTo", {
      value: () => undefined,
      configurable: true,
    });
  });
  afterAll(() => {
    Reflect.deleteProperty(Element.prototype, "scrollTo");
  });
  afterEach(cleanup);

  it("offers the configured schemes as a named radio group with the chosen one checked", async () => {
    const { wrap } = await setUp();
    render(wrap(<AppearanceToggle label="Appearance" labels={LABELS} />));
    expect(screen.getByRole("radiogroup", { name: "Appearance" })).toBeTruthy();
    const names = screen.getAllByRole("radio").map((radio) => radio.closest("label")?.textContent);
    expect(names).toEqual(["Light", "Dark", "System"]);
    expect((screen.getByRole("radio", { name: "System" }) as HTMLInputElement).checked).toBe(true);
  });

  it("keeps a pick on the device and reports it", async () => {
    const { service, wrap } = await setUp();
    const onChange = vi.fn();
    render(wrap(<AppearanceToggle label="Appearance" labels={LABELS} onChange={onChange} />));
    act(() => {
      fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    });
    expect(service.scheme).toBe("dark");
    expect(onChange).toHaveBeenCalledWith("dark");
    expect((screen.getByRole("radio", { name: "Dark" }) as HTMLInputElement).checked).toBe(true);
  });

  it("moves the choice with the arrow keys", async () => {
    const { service, wrap } = await setUp();
    render(wrap(<AppearanceToggle label="Appearance" labels={LABELS} />));
    const light = screen.getByRole("radio", { name: "Light" });
    act(() => {
      fireEvent.click(light);
      light.focus();
      fireEvent.keyDown(light, { key: "ArrowRight" });
    });
    expect(service.scheme).toBe("dark");
  });

  it("only reports a pick when controlled", async () => {
    const { service, wrap } = await setUp();
    const onChange = vi.fn();
    render(
      wrap(
        <AppearanceToggle label="Appearance" labels={LABELS} value="light" onChange={onChange} />,
      ),
    );
    expect((screen.getByRole("radio", { name: "Light" }) as HTMLInputElement).checked).toBe(true);
    act(() => {
      fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    });
    expect(onChange).toHaveBeenCalledWith("dark");
    expect(service.scheme).toBe("system");
  });

  it("turns dark on and off as a switch", async () => {
    const { service, wrap } = await setUp();
    render(wrap(<AppearanceToggle variant="switch" label="Dark mode" labels={LABELS} />));
    const toggle = screen.getByRole("switch", { name: "Dark mode" }) as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    act(() => {
      fireEvent.click(toggle);
    });
    expect(service.scheme).toBe("dark");
    act(() => {
      fireEvent.click(toggle);
    });
    expect(service.scheme).toBe("light");
  });

  it("picks from a menu behind a button named with the current scheme", async () => {
    const { service, wrap } = await setUp();
    render(wrap(<AppearanceToggle variant="menu" label="Appearance" labels={LABELS} />));
    fireEvent.click(screen.getByRole("button", { name: "Appearance: System" }));
    const system = await screen.findByRole("menuitemradio", { name: "System" });
    expect(system.getAttribute("aria-checked")).toBe("true");
    await act(async () => {
      fireEvent.click(screen.getByRole("menuitemradio", { name: "Dark" }));
    });
    expect(service.scheme).toBe("dark");
    expect(screen.getByRole("button", { name: "Appearance: Dark" })).toBeTruthy();
  });

  it("ties its help text to the control", async () => {
    const { wrap } = await setUp();
    render(
      wrap(
        <AppearanceToggle label="Appearance" labels={LABELS} description="Saved on this device." />,
      ),
    );
    const group = screen.getByRole("radiogroup", { name: "Appearance" });
    const id = group.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(id.split(" ")[0] ?? "")?.textContent).toBe(
      "Saved on this device.",
    );
  });

  it("refuses picks while disabled", async () => {
    const { service, wrap } = await setUp();
    render(wrap(<AppearanceToggle label="Appearance" labels={LABELS} isDisabled />));
    const dark = screen.getByRole("radio", { name: "Dark" }) as HTMLInputElement;
    expect(dark.disabled).toBe(true);
    act(() => {
      fireEvent.click(dark);
    });
    expect(service.scheme).toBe("system");
  });

  it("keeps its layout logical in Arabic", async () => {
    const { wrap } = await setUp();
    render(
      wrap(
        <AppearanceToggle
          label="المظهر"
          labels={{ light: "فاتح", dark: "داكن", system: "النظام" }}
          description="يُحفظ على هذا الجهاز."
        />,
        "rtl",
      ),
    );
    const group = screen.getByRole("radiogroup", { name: "المظهر" });
    expect(screen.getByRole("radio", { name: "داكن" })).toBeTruthy();
    const root = group.parentElement;
    expect(root?.className).not.toMatch(/\b(text-left|text-right|ml-|mr-|pl-|pr-|left-|right-)/);
    expect(group.className).not.toMatch(/\b(text-left|text-right|ml-|mr-|pl-|pr-)/);
  });
});
