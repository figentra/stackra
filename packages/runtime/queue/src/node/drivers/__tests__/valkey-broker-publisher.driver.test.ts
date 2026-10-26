/**
 * Stackra file contract:
 * Purpose: unit tests of `ValkeyBrokerPublisherDriver`: it is the `BrokerPublisher` port; it refuses to start without
 *          the `QUEUE_BROKER_VALKEY_URL` secret, and each publish is one `XADD` on the prefixed stream with the trim,
 *          the id and the JSON body.
 * Boundary: test only; `iovalkey` is mocked, so no server runs. The URL is made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decision 3); ADR 0173.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { BrokerConfig } from "#config/broker.config";
import { BrokerPublisher } from "#contracts/index";
import { ValkeyBrokerPublisherDriver } from "#node/drivers/valkey-broker-publisher.driver";

const server = vi.hoisted(() => ({ calls: [] as unknown[][], urls: [] as unknown[] }));

vi.mock("iovalkey", () => ({
  default: class {
    constructor(...args: unknown[]) {
      server.urls.push(args[0]);
    }

    async xadd(...args: unknown[]) {
      server.calls.push(args);
      return "1-0";
    }
  },
}));

class BrokerSecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "QUEUE_BROKER_VALKEY_URL" ? "redis://:pw@valkey.test:6379" : undefined;
  }
}

describe(ValkeyBrokerPublisherDriver, () => {
  it("needs its secret", () => {
    expect(() => new ValkeyBrokerPublisherDriver(buildConfig(BrokerConfig))).toThrow(
      /QUEUE_BROKER_VALKEY_URL/,
    );
  });

  it("appends each message to the topic's stream", async () => {
    const broker = new ValkeyBrokerPublisherDriver(
      buildConfig(BrokerConfig, {
        values: { driver: "valkey", valkey: { keyPrefix: "b:", maxLength: 50 } },
        secrets: new BrokerSecrets(),
      }),
    );
    expect(broker).toBeInstanceOf(BrokerPublisher);
    expect(server.urls.at(-1)).toBe("redis://:pw@valkey.test:6379");
    await broker.publish("orders.order.paid.v1", { id: "evt_1", body: { a: 1 } });
    expect(server.calls).toEqual([
      ["b:orders.order.paid.v1", "MAXLEN", "~", "50", "*", "id", "evt_1", "body", '{"a":1}'],
    ]);
  });
});
