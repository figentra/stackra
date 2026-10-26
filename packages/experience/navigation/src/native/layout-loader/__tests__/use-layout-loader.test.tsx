/**
 * Stackra file contract:
 * Purpose: unit tests of `useLayoutLoader`: a redirect sets `redirected`, data arrives otherwise, a new `key` runs the
 *          loader again (signing in), and an error is kept.
 * Boundary: test only; React Native and the locale hook are replaced by stand-ins; the context member the layout
 *           reads is contributed with `contributeRouteContext`.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0294 (decision 16); ADR 0165.
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { Layout } from "#core/bases/layout.base";
import { ROUTE_CONTEXT_PARTS } from "#core/constants/route-context-parts.constant";
import { contributeRouteContext } from "#core/functions/contribute-route-context.function";
import type { LayoutContext } from "#core/types/layout-context.type";
import { useLayoutLoader } from "#native/layout-loader/use-layout-loader";

vi.mock("react-native", () => ({ Linking: { openURL: vi.fn(async () => undefined) } }));
vi.mock("@stackra/i18n/react", () => ({ useLocale: () => ({ locale: "en" }) }));

let signedIn = false;

class TabsLayout extends Layout {
  override loader(ctx: LayoutContext<this>) {
    const { session } = ctx as unknown as { session: string | null };
    return session === null
      ? ctx.redirect({ name: "sign_in" }, { resume: true })
      : { tenant: session };
  }
}

class BrokenLayout extends Layout {
  override loader(): never {
    throw new Error("storage locked");
  }
}

/** A wrapper with a real, empty container. */
async function wrapper() {
  const container = await Container.create([]);
  return ({ children }: { children: ReactNode }) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
}

afterEach(() => {
  ROUTE_CONTEXT_PARTS.clear();
  signedIn = false;
});

describe("useLayoutLoader", () => {
  it("is redirected without a session and loads again on a new key", async () => {
    contributeRouteContext(() => ({ session: signedIn ? "acme" : null }) as never);
    const { result, rerender } = renderHook(({ key }) => useLayoutLoader(TabsLayout, key), {
      wrapper: await wrapper(),
      initialProps: { key: "signed_out" },
    });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.redirected).toBe(true));
    signedIn = true;
    rerender({ key: "signed_in" });
    await waitFor(() => expect(result.current.data).toEqual({ tenant: "acme" }));
    expect(result.current.redirected).toBe(false);
  });

  it("keeps the loader's error", async () => {
    const { result } = renderHook(() => useLayoutLoader(BrokenLayout), {
      wrapper: await wrapper(),
    });
    await waitFor(() => expect(result.current.error).toEqual(new Error("storage locked")));
    expect(result.current.isLoading).toBe(false);
  });
});
