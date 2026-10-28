/**
 * Stackra file contract:
 * Purpose: unit tests of `REALTIME_CONFIG_SCHEMA`: every field defaults so `.parse({})` is complete, each field
 *          unwraps for a host's `.extend(...)`, and the rules refuse a pathful origin, an unknown realm, a short token
 *          lifetime, out-of-range seconds and a `maxBackoff` under a second. `maxBackoff` replaced `maxBackoffSeconds`
 *          in stackra-223; its default stays 30 seconds.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26).
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { REALTIME_CONFIG_SCHEMA } from "#core/constants/realtime-config-schema.constant";

describe("REALTIME_CONFIG_SCHEMA", () => {
  it("parses an empty object to the full defaults", () => {
    expect(REALTIME_CONFIG_SCHEMA.parse({})).toEqual({
      driver: "memory",
      origin: "",
      channelRealms: ["platform", "tenant", "customer"],
      subscribeTokenTtl: Duration.minutes(15),
      reconnectOnForeground: false,
      backgroundGraceSeconds: 60,
      maxBackoff: Duration.seconds(30),
      fanout: "local",
      fanoutValkeyUrl: "",
      fanoutChannel: "realtime:fanout",
      rooms: {
        maxMembers: 50,
        countAcrossInstances: true,
        maxMessageBytes: 65_536,
        maxMessagesPerSecond: 20,
        idleCloseSeconds: 60,
      },
      localRelay: "lan",
      localRelayKey: "",
      localRelayPort: 4790,
      localRelayAddress: "",
      localRelayPeers: [],
      localRelayProbeMs: 1500,
      health: { timeout: Duration.seconds(2), critical: true },
    });
  });

  it("gives each call a fresh realms array", () => {
    const first = REALTIME_CONFIG_SCHEMA.parse({});
    first.channelRealms.pop();
    expect(REALTIME_CONFIG_SCHEMA.parse({}).channelRealms).toHaveLength(3);
  });

  it("accepts an origin without a path", () => {
    expect(REALTIME_CONFIG_SCHEMA.parse({ origin: "http://localhost:4000" }).origin).toBe(
      "http://localhost:4000",
    );
  });

  it("refuses values outside the rules", () => {
    for (const values of [
      { origin: "api.acme.example" },
      { origin: "https://api.acme.example/realtime" },
      { channelRealms: ["staff"] },
      { subscribeTokenTtl: Duration.seconds(9) },
      { subscribeTokenTtl: "5 minutes" },
      { backgroundGraceSeconds: -1 },
      { backgroundGraceSeconds: 1.5 },
      { maxBackoff: Duration.parse("500ms") },
      { maxBackoff: 30 },
      { fanout: "redis" },
      { rooms: { maxMembers: 0 } },
    ])
      expect(REALTIME_CONFIG_SCHEMA.safeParse(values).success).toBe(false);
  });
});
