/**
 * Stackra file contract:
 * Purpose: unit tests of the `./native` `renderHook`: the library receives the hook, its `initialProps` and one wrapper
 *          nesting the providers, nothing extra when none is given, and its cleanup runs when the test finishes.
 * Boundary: test only. React Native does not run in vitest, so React Native Testing Library is a recording stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";
import { createElement, type ReactElement, type ReactNode } from "react";
import { vi } from "vitest";

import { renderHook } from "#native/render-hook/render-hook.function";

const library = vi.hoisted(() => {
  // Vitest 5 clears mock calls before each test, so cleanups across tests are counted here.
  const cleanups = { count: 0 };
  return {
    renderHook: vi.fn(async (hook: unknown, options: unknown) => ({ hook, options })),
    cleanups,
    cleanup: vi.fn(async () => {
      cleanups.count++;
    }),
    userEvent: { setup: vi.fn(() => ({})) },
  };
});

vi.mock("@testing-library/react-native/pure", () => library);

/** Provides nothing but a marker element. */
function Frame({ children }: { readonly children?: ReactNode }) {
  return createElement("section", null, children);
}

/** A hook with props. */
const double = (n: number) => n * 2;

/** A hook without props. */
const plain = () => "plain";

describe(renderHook, () => {
  it("hands the library the hook, its initial props and the composed wrapper", async () => {
    await renderHook(double, { initialProps: 2, providers: [Frame] });
    const [given, options] = library.renderHook.mock.calls.at(-1) ?? [];
    expect(given).toBe(double);
    const { initialProps, wrapper } = options as {
      initialProps: number;
      wrapper: (props: { children: ReactNode }) => ReactElement;
    };
    expect(initialProps).toBe(2);
    expect(wrapper({ children: null }).type).toBe(Frame);
  });

  it("passes no options it was not given", async () => {
    await renderHook(plain);
    expect(library.renderHook).toHaveBeenLastCalledWith(plain, {});
  });

  it("cleaned up when the earlier tests finished", () => {
    expect(library.cleanups.count).toBe(2);
  });
});
