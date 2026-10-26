/**
 * Stackra file contract:
 * Purpose: unit tests of `ValkeyRealtimeFanoutDriver`: it is the `RealtimeFanout` port; it refuses to start without
 *          the `REALTIME_VALKEY_URL` secret; `publish` sends JSON on the channel; the first `subscribe` opens one
 *          subscriber connection on the channel, hands each parsed message to every receiver, drops what does not
 *          parse or arrives on another channel, and disconnects when the last receiver stops.
 * Boundary: test only; `iovalkey` is mocked, so no server runs. The URL is made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 1); ADR 0173.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RealtimeConfig } from "#config/realtime.config";
import { RealtimeFanout } from "#contracts/ports/realtime-fanout.port";
import type { FanoutMessage } from "#contracts/types/fanout-message.type";
import { ValkeyRealtimeFanoutDriver } from "#node/drivers/valkey-realtime-fanout.driver";

const server = vi.hoisted(() => ({
  published: [] as [string, string][],
  subscribed: [] as string[],
  handlers: [] as ((channel: string, text: string) => void)[],
  disconnected: 0,
}));

vi.mock("iovalkey", () => {
  class Client {
    async publish(channel: string, text: string) {
      server.published.push([channel, text]);
      return 1;
    }

    duplicate() {
      return new Client();
    }

    on(_event: string, handler: (channel: string, text: string) => void) {
      server.handlers.push(handler);
    }

    async subscribe(channel: string) {
      server.subscribed.push(channel);
    }

    disconnect() {
      server.disconnected += 1;
    }
  }
  return { default: Client };
});

class FanoutSecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "REALTIME_VALKEY_URL" ? "redis://:pw@valkey.test:6379" : undefined;
  }
}

const MESSAGE: FanoutMessage = {
  kind: "broadcast",
  broadcast: { permission: "p", message: { channel: "tenant.t.m", name: "m.e.v1", id: "evt_1" } },
};

describe(ValkeyRealtimeFanoutDriver, () => {
  it("needs its secret", () => {
    expect(() => new ValkeyRealtimeFanoutDriver(buildConfig(RealtimeConfig))).toThrow(
      /REALTIME_VALKEY_URL/,
    );
  });

  it("publishes JSON and delivers what the channel carries", async () => {
    const fanout = new ValkeyRealtimeFanoutDriver(
      buildConfig(RealtimeConfig, { values: { fanout: "valkey" }, secrets: new FanoutSecrets() }),
    );
    expect(fanout).toBeInstanceOf(RealtimeFanout);
    await fanout.publish(MESSAGE);
    expect(server.published).toEqual([["realtime:fanout", JSON.stringify(MESSAGE)]]);
    const seen: FanoutMessage[] = [];
    const stopA = fanout.subscribe((message) => seen.push(message));
    const stopB = fanout.subscribe(() => undefined);
    expect(server.subscribed).toEqual(["realtime:fanout"]);
    const deliver = server.handlers[0];
    deliver?.("realtime:fanout", JSON.stringify(MESSAGE));
    deliver?.("realtime:fanout", "not json");
    deliver?.("other", JSON.stringify(MESSAGE));
    expect(seen).toEqual([MESSAGE]);
    stopA();
    expect(server.disconnected).toBe(0);
    stopB();
    expect(server.disconnected).toBe(1);
  });
});
