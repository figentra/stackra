/**
 * Stackra file contract:
 * Purpose: unit tests of the `SystemColorScheme` port: a class that implements it is a port instance whose preference
 *          and subscription callers read through the port type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: ports are abstract classes).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import type { ResolvedColorScheme } from "@stackra/ui/contracts";

import { SystemColorScheme } from "#contracts/ports/system-color-scheme.port";

describe("SystemColorScheme", () => {
  it("is a port a driver implements", () => {
    const listeners: (() => void)[] = [];
    class DarkSystem extends SystemColorScheme {
      current(): ResolvedColorScheme {
        return "dark";
      }

      subscribe(listener: () => void): () => void {
        listeners.push(listener);
        return () => undefined;
      }
    }
    const system: SystemColorScheme = new DarkSystem();
    expect(system).toBeInstanceOf(SystemColorScheme);
    expect(system).toBeInstanceOf(Port);
    expect(system.current()).toBe("dark");
    const stop = system.subscribe(() => undefined);
    expect(listeners).toHaveLength(1);
    expect(stop).toBeTypeOf("function");
  });

  it("types the preference as a resolved scheme", () => {
    expectTypeOf<ReturnType<SystemColorScheme["current"]>>().toEqualTypeOf<"light" | "dark">();
  });
});
