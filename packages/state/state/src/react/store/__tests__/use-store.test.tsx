/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useStore(Class)`: the instance the container binds, typed as the class; a re-render
 *          after a method changes it and after it hydrates; the server render; and the throws outside a provider and
 *          for a class the container does not bind.
 * Boundary: test only; jsdom with Testing Library's `renderHook`; the store instance is given to the container as an
 *           override, as the runtime's binding would hand it out.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0079 (decision 2); ADR 0294 (decisions 16 and 17).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { Store } from "#core/bases/store.base";
import { hydrateStore } from "#core/functions/hydrate-store.function";
import { registerStores } from "#core/functions/register-stores.function";
import { useStore } from "#react/store/use-store";

class PaletteStore extends Store {
  isOpen = false;

  query = "";

  open(): void {
    this.set({ isOpen: true });
  }

  setQuery(query: string): void {
    this.set({ query });
  }
}

class TabsStore extends Store({ persist: "prefs" }) {
  lastTab = "home";
}

class UnboundStore extends Store {
  value = 0;
}

registerStores([[TabsStore, "mobile.tabs"]]);

/** A provider over a container that hands out `instances` for their classes. */
async function wrapperFor(...instances: Store[]) {
  const container = await Container.create([], {
    overrides: new Map(
      instances.map((instance) => [instance.constructor as AnyClass, instance] as const),
    ),
  });
  return function Wrapper({ children }: { readonly children?: ReactNode }) {
    return <ContainerProvider container={container}>{children}</ContainerProvider>;
  };
}

describe("useStore", () => {
  it("returns the bound instance, typed as the class", async () => {
    const palette = new PaletteStore();
    const { result } = renderHook(() => useStore(PaletteStore), {
      wrapper: await wrapperFor(palette),
    });
    expect(result.current).toBe(palette);
    expectTypeOf(result.current).toEqualTypeOf<PaletteStore>();
  });

  it("re-renders after a method changes the store", async () => {
    const palette = new PaletteStore();
    let renders = 0;
    const { result } = renderHook(
      () => {
        renders += 1;
        return useStore(PaletteStore).isOpen;
      },
      { wrapper: await wrapperFor(palette) },
    );
    expect(result.current).toBe(false);
    act(() => palette.open());
    expect(result.current).toBe(true);
    const before = renders;
    act(() => palette.open());
    expect(renders).toBe(before);
  });

  it("re-renders after the store hydrates", async () => {
    let resolve: ((saved: object) => void) | undefined;
    const saved = new Promise<object>((settle) => {
      resolve = settle;
    });
    const tabs = new TabsStore({ area: () => ({ get: () => saved, set: () => undefined }) });
    const { result } = renderHook(() => useStore(TabsStore).lastTab, {
      wrapper: await wrapperFor(tabs),
    });
    expect(result.current).toBe("home");
    await act(async () => {
      resolve?.({ lastTab: "orders" });
      await hydrateStore(tabs);
    });
    expect(result.current).toBe("orders");
  });

  it("renders on the server", async () => {
    const palette = new PaletteStore();
    palette.setQuery("orders");
    const Wrapper = await wrapperFor(palette);
    function Query() {
      return <span>{useStore(PaletteStore).query}</span>;
    }
    expect(
      renderToString(
        <Wrapper>
          <Query />
        </Wrapper>,
      ),
    ).toBe("<span>orders</span>");
  });

  it("throws outside a ContainerProvider and for a class nothing binds", async () => {
    expect(() => renderHook(() => useStore(PaletteStore))).toThrow(/ContainerProvider/);
    const wrapper = await wrapperFor(new PaletteStore());
    expect(() => renderHook(() => useStore(UnboundStore), { wrapper })).toThrow(/UnboundStore/);
  });
});
