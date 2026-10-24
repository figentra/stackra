/**
 * Stackra file contract:
 * Purpose: unit tests of `usePrefs()`: it returns the `prefs` area of the container's `Storage`, so a write through it
 *          lands in that area, and it throws outside a `ContainerProvider` and when no storage is bound.
 * Boundary: test only; renders with react-dom/server (no DOM needed) and writes during render only to observe the
 *           area, which components must not do.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0256 (decision 2).
 */
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { Storage } from "#contracts/ports/storage.port";
import type { StorageAreaHandle } from "#contracts/types/storage-area-handle.type";
import { MemoryStorageDriver } from "#core/drivers/memory-storage.driver";
import { usePrefs } from "#react/prefs/use-prefs";

/** Writes `value` under `console.ui` through the hook's area. */
function Saving({ value }: { readonly value: string }) {
  usePrefs().set("console.ui", value);
  return null;
}

describe("usePrefs", () => {
  it("returns the prefs area of the nearest container's Storage", async () => {
    const storage = new MemoryStorageDriver();
    const container = await Container.create([], { overrides: new Map([[Storage, storage]]) });
    renderToString(
      <ContainerProvider container={container}>
        <Saving value="compact" />
      </ContainerProvider>,
    );
    expect(storage.prefs.get("console.ui")).toBe("compact");
    expect(storage.session.has("console.ui")).toBe(false);
    expectTypeOf(usePrefs).returns.toEqualTypeOf<StorageAreaHandle>();
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderToString(<Saving value="x" />)).toThrow(/ContainerProvider/);
  });

  it("throws when the container binds no Storage", async () => {
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <Saving value="x" />
        </ContainerProvider>,
      ),
    ).toThrow();
  });
});
