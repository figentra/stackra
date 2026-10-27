/**
 * Stackra file contract:
 * Purpose: unit tests of `LanRealtimeLocalRelayDriver`: it needs the venue key; a hosting device answers keyed probes,
 *          refuses a wrong key, streams every relayed refresh to linked devices and refuses a body that is not one;
 *          `discover` finds the first answering peer and answers null when none does; `stop` releases the port.
 * Boundary: test only; a real node:http server on a loopback port, fetched in-process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decisions 1 and 2); ADR 0173.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { RealtimeConfig } from "#config/realtime.config";
import { RealtimeLocalRelay } from "#contracts/ports/realtime-local-relay.port";
import { LanRealtimeLocalRelayDriver } from "#node/drivers/lan-realtime-local-relay.driver";

const PORT = 47_913;

const ORIGIN = `http://127.0.0.1:${PORT}`;

class VenueSecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "REALTIME_LOCAL_RELAY_KEY" ? "venue-key" : undefined;
  }
}

/** A relay driver with the venue key, on the test port, probing `peers`. */
function relayWith(peers: string[] = []): LanRealtimeLocalRelayDriver {
  return new LanRealtimeLocalRelayDriver(
    buildConfig(RealtimeConfig, {
      values: {
        localRelayPort: PORT,
        localRelayAddress: "127.0.0.1",
        localRelayPeers: peers,
        localRelayProbeMs: 500,
      },
      secrets: new VenueSecrets(),
    }),
  );
}

let hosting: LanRealtimeLocalRelayDriver | undefined;

afterEach(async () => {
  await hosting?.stop();
  hosting = undefined;
});

describe(LanRealtimeLocalRelayDriver, () => {
  it("needs the venue key", async () => {
    const relay = new LanRealtimeLocalRelayDriver(buildConfig(RealtimeConfig));
    expect(relay).toBeInstanceOf(RealtimeLocalRelay);
    await expect(relay.host()).rejects.toThrow(TypeError);
    await expect(relay.discover()).rejects.toThrow(TypeError);
  });

  it("hosts a keyed relay that streams every relayed refresh", async () => {
    hosting = relayWith();
    await expect(hosting.host()).resolves.toEqual({ origin: ORIGIN, token: "venue-key" });
    const wrong = await fetch(`${ORIGIN}/realtime`, {
      method: "HEAD",
      headers: { authorization: "Bearer nope" },
    });
    expect(wrong.status).toBe(401);
    const stream = await fetch(`${ORIGIN}/realtime?token=venue-key`);
    expect(stream.headers.get("content-type")).toContain("text/event-stream");
    const reader = stream.body?.getReader();
    await reader?.read(); // ": open"
    const message = { channel: "tenant.scp_1.floor", name: "floor.table.seated.v1", id: "evt_1" };
    const posted = await fetch(`${ORIGIN}/realtime`, {
      method: "POST",
      headers: { authorization: "Bearer venue-key" },
      body: JSON.stringify(message),
    });
    expect(posted.status).toBe(202);
    const text = new TextDecoder().decode((await reader?.read())?.value);
    expect(text).toBe(`id: evt_1\nevent: refresh\ndata: ${JSON.stringify(message)}\n\n`);
    const bad = await fetch(`${ORIGIN}/realtime`, {
      method: "POST",
      headers: { authorization: "Bearer venue-key" },
      body: "{}",
    });
    expect(bad.status).toBe(400);
    await reader?.cancel();
  });

  it("discovers the first answering peer, or none", async () => {
    hosting = relayWith();
    await hosting.host();
    await expect(relayWith(["http://127.0.0.1:1", ORIGIN]).discover()).resolves.toEqual({
      origin: ORIGIN,
      token: "venue-key",
    });
    await hosting.stop();
    await expect(relayWith([ORIGIN]).discover()).resolves.toBeNull();
  });
});
