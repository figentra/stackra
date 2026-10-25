/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/realtime`
 *          (`RealtimeConfig`, `RealtimeStatus`; the generated `RealtimeConfig$` and `MemoryRealtimeDriver`), the gen
 *          samples' other drivers and `liveQueryRoutes` are exported, nothing else is, the `$` name is the shipped
 *          schema, the ports stay in `./contracts`, and the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import type { BroadcastAudience } from "@stackra/events";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { RealtimeMessage } from "#contracts/index";
import { REALTIME_CONFIG_SCHEMA } from "#core/constants/realtime-config-schema.constant";
import * as realtime from "#core/index";
import type {
  BroadcastRoute,
  LiveQueryRefresh,
  RealtimeConnectionState,
  RealtimeDriverName,
  RealtimeEventRef,
  RealtimePeer,
  RealtimeSocket,
  RealtimeStatus,
  RealtimeToken,
  RealtimeTransportName,
} from "#core/index";

describe("@stackra/realtime", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(realtime).sort()).toEqual([
      "LocalRealtimeFanoutDriver",
      "MemoryRealtimeDriver",
      "MemoryRealtimeTransportDriver",
      "REALTIME_PATH",
      "REALTIME_ROOM_PATH",
      "RealtimeBroadcaster",
      "RealtimeConfig",
      "RealtimeConfig$",
      "RealtimeConnection",
      "RealtimeHub",
      "RealtimeOptions",
      "RealtimeRelay",
      "RealtimeRooms",
      "RealtimeStatus",
      "RoomLimitReachedError",
      "SseRealtimeDriver",
      "WebSocketRealtimeDriver",
      "WebsocketRealtimeTransportDriver",
      "liveQueryRoutes",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(realtime.RealtimeConfig$).toBe(REALTIME_CONFIG_SCHEMA);
  });

  it("resolves its public types", () => {
    expectTypeOf<RealtimeDriverName>().toEqualTypeOf<"sse" | "websocket" | "memory">();
    expectTypeOf<RealtimeTransportName>().toEqualTypeOf<"websocket" | "memory">();
    expectTypeOf<RealtimeConnectionState["status"]>().toEqualTypeOf<RealtimeStatus>();
    expectTypeOf<BroadcastRoute["audience"]>().toEqualTypeOf<BroadcastAudience>();
    expectTypeOf<RealtimeEventRef["eventName"]>().toEqualTypeOf<string>();
    expectTypeOf<LiveQueryRefresh["invalidateOn"]>().toEqualTypeOf<readonly RealtimeEventRef[]>();
    expectTypeOf<Parameters<RealtimePeer["deliver"]>[0]>().toEqualTypeOf<RealtimeMessage>();
    expectTypeOf<RealtimeSocket["send"]>().toEqualTypeOf<(data: string) => void>();
    expectTypeOf<RealtimeToken["expiresAt"]>().toEqualTypeOf<Date>();
  });

  it("accepts a generated event class as an event ref", () => {
    class OrderPaid {
      static readonly eventName = "orders.order.paid.v1";

      orderId!: string;
    }
    expectTypeOf(OrderPaid).toExtend<RealtimeEventRef<OrderPaid>>();
    // @ts-expect-error -- a class without a wire name is not an event ref
    const plain: RealtimeEventRef = class Plain {};
    expect(plain).toBeTypeOf("function");
  });
});
