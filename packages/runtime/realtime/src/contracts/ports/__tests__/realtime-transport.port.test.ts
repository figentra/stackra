/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `RealtimeTransport` port: a port a client driver implements, keyed so that
 *          `DriverName<RealtimeTransport>` is exactly this package's driver names (`websocket`, `memory`).
 * Boundary: test only; the registry entry comes from this package's own augmentation, loaded through the core types.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 4).
 */
import type { DriverName } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { RealtimeTransport } from "#contracts/ports/realtime-transport.port";
import type { RealtimeLink } from "#contracts/types/realtime-link.type";
import type { RealtimeLinkHandlers } from "#contracts/types/realtime-link-handlers.type";
import type { RealtimeTarget } from "#contracts/types/realtime-target.type";
import type { RealtimeTransportName } from "#core/types/realtime-transport-name.type";

describe("RealtimeTransport", () => {
  it("is a port a client driver implements", () => {
    const targets: RealtimeTarget[] = [];
    class ImmediateTransport extends RealtimeTransport {
      open(target: RealtimeTarget, handlers: RealtimeLinkHandlers): RealtimeLink {
        targets.push(target);
        handlers.onOpen();
        return { close: () => undefined };
      }
    }
    const transport = new ImmediateTransport();
    let opened = false;
    const link = transport.open(
      { origin: "https://api.acme.example", token: "t1" },
      { onOpen: () => (opened = true), onMessage: () => undefined, onClose: () => undefined },
    );
    link.close();
    expect(opened).toBe(true);
    expect(targets).toEqual([{ origin: "https://api.acme.example", token: "t1" }]);
    expect(transport).toBeInstanceOf(RealtimeTransport);
    expect(transport).toBeInstanceOf(Port);
  });

  it("narrows DriverName to this port's drivers", () => {
    expectTypeOf<DriverName<RealtimeTransport>>().toEqualTypeOf<RealtimeTransportName>();
    expectTypeOf<RealtimeTransportName>().toEqualTypeOf<"websocket" | "memory">();
    const name: DriverName<RealtimeTransport> = "websocket";
    // @ts-expect-error -- not a driver of this port
    const other: DriverName<RealtimeTransport> = "sse";
    expect([name, other]).toEqual(["websocket", "sse"]);
  });
});
