/**
 * Stackra file contract:
 * Purpose: integration tests of `ValkeyBrokerPublisherDriver` on a real Valkey: each message is one entry of its
 *          topic's stream with its id and JSON body (an absent body as `null`), in publish order; a consumer group of
 *          its own reads every message once and acknowledges it; and `MAXLEN ~` keeps a busy stream near its length
 *          instead of growing without end.
 * Boundary: integration tier (`.int`): needs Docker for the Testcontainers Valkey (`useValkey`). Each test publishes to
 *           a topic of its own.
 * Runtime: node (vitest)
 * Governing contract: ADR 0148 (decision 3); ADR 0150 (the Valkey client); ADR 0182 (integration tier); STA-2802.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { describe, expect, it } from "@stackra/testing";

import { BrokerConfig } from "#config/broker.config";
import { useValkey } from "#node/__tests__/fixtures/valkey.fixture";
import { ValkeyBrokerPublisherDriver } from "#node/drivers/valkey-broker-publisher.driver";

const valkey = useValkey();

/** The fixture's server as the `QUEUE_BROKER_VALKEY_URL` secret. */
class BrokerSecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "QUEUE_BROKER_VALKEY_URL" ? valkey.url : undefined;
  }
}

/** A publisher over the fixture's server trimming at `maxLength`; closed after the file. */
const publisher = (maxLength = 1000): ValkeyBrokerPublisherDriver =>
  valkey.track(
    new ValkeyBrokerPublisherDriver(
      buildConfig(BrokerConfig, {
        values: { driver: "valkey", valkey: { keyPrefix: "it:broker:", maxLength } },
        secrets: new BrokerSecrets(),
      }),
    ),
  );

/** An entry's fields as an object. */
const fieldsOf = (fields: readonly string[]): Record<string, string> =>
  Object.fromEntries(
    Array.from({ length: fields.length / 2 }, (_, index) => [
      fields[index * 2] as string,
      fields[index * 2 + 1] as string,
    ]),
  );

describe(ValkeyBrokerPublisherDriver, () => {
  it("appends each message to its topic's stream in order, with its id and JSON body", async () => {
    const broker = publisher();
    await broker.publish("orders.order.paid.v1", { id: "evt_1", body: { orderId: "ord_1" } });
    await broker.publish("orders.order.paid.v1", { id: "evt_2", body: undefined });
    const entries = await valkey.client.xrange("it:broker:orders.order.paid.v1", "-", "+");
    expect(entries.map(([, fields]) => fieldsOf(fields))).toEqual([
      { id: "evt_1", body: '{"orderId":"ord_1"}' },
      { id: "evt_2", body: "null" },
    ]);
  });

  it("hands every message once to a consumer group, which acknowledges it", async () => {
    const stream = "it:broker:billing.invoice.sent.v1";
    await valkey.client.xgroup("CREATE", stream, "billing", "$", "MKSTREAM");
    const broker = publisher();
    await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        broker.publish("billing.invoice.sent.v1", { id: `evt_${index}`, body: { index } }),
      ),
    );
    const read = (await valkey.client.xreadgroup(
      "GROUP",
      "billing",
      "worker-1",
      "COUNT",
      "10",
      "STREAMS",
      stream,
      ">",
    )) as [string, [string, string[]][]][];
    const entries = read[0]?.[1] ?? [];
    const ids = entries.map(([, fields]) => fieldsOf(fields)["id"]);
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts the array built just above; toSorted is ES2023
    expect(ids.sort()).toEqual(["evt_0", "evt_1", "evt_2", "evt_3", "evt_4"]);
    expect(
      await valkey.client.xack(stream, "billing", ...entries.map(([entryId]) => entryId)),
    ).toBe(5);
    const again = await valkey.client.xreadgroup(
      "GROUP",
      "billing",
      "worker-2",
      "COUNT",
      "10",
      "STREAMS",
      stream,
      ">",
    );
    expect(again).toBeNull();
  });

  it("keeps a busy stream near its length", async () => {
    const broker = publisher(10);
    for (let index = 0; index < 500; index += 1)
      // oxlint-disable-next-line no-await-in-loop -- one publish after another, as a relay sends them
      await broker.publish("busy.topic.v1", { id: `evt_${index}`, body: index });
    const length = await valkey.client.xlen("it:broker:busy.topic.v1");
    // `~` trims whole stream nodes (100 entries each by default), so the stream stays within one node of the cap.
    expect(length).toBeGreaterThanOrEqual(10);
    expect(length).toBeLessThan(10 + 100);
  });
});
