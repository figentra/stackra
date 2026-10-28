/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useAccessibility()`: a client render reads the `SystemAccessibility` driver the
 *          nearest container binds and re-renders when a setting changes; a server render shows the defaults; it
 *          throws outside a provider.
 * Boundary: test only; jsdom with React Testing Library for the client, react-dom/server for the server render.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0302 (decision 3, 2026-10-29 note).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { SystemAccessibility } from "#contracts/index";
import type { AccessibilitySettings } from "#contracts/index";
import { MemorySystemAccessibilityDriver } from "#core/index";
import { useAccessibility } from "#react/accessibility/use-accessibility";

/** Shows the settings as text. */
function Probe() {
  const { reduceMotion, boldText, highContrast, fontScale } = useAccessibility();
  return <output>{[reduceMotion, boldText, highContrast, fontScale].join(" ")}</output>;
}

/** A memory driver and a provider that binds it. */
async function setUp() {
  const system = new MemorySystemAccessibilityDriver();
  const container = await Container.create([], {
    overrides: new Map([[SystemAccessibility, system]]),
  });
  const wrap = (children: ReactNode) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
  return { system, wrap };
}

describe("useAccessibility", () => {
  it("reads the driver and re-renders on a change", async () => {
    const { system, wrap } = await setUp();
    render(wrap(<Probe />));
    expect(screen.getByRole("status").textContent).toBe("false false false 1");
    act(() => {
      system.set({ reduceMotion: true, highContrast: true, fontScale: 1.3 });
    });
    expect(screen.getByRole("status").textContent).toBe("true false true 1.3");
    expectTypeOf(useAccessibility).returns.toEqualTypeOf<AccessibilitySettings>();
  });

  it("server-renders the defaults whatever the device says", async () => {
    const { system, wrap } = await setUp();
    system.set({ reduceMotion: true });
    expect(renderToString(wrap(<Probe />))).toContain("false false false 1");
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderToString(<Probe />)).toThrow(/ContainerProvider/);
  });
});
