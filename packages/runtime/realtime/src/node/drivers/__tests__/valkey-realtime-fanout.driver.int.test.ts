/**
 * Stackra file contract:
 * Purpose: integration tests of `ValkeyRealtimeFanoutDriver` on a real Valkey pub/sub: a message one instance publishes
 *          reaches every subscribed instance, the publisher included, whole and in order; text that is not JSON and
 *          messages on another channel are dropped; a receiver that throws stops no other; the subscribe connection
 *          opens on the first subscriber and closes with the last, after which nothing more is delivered.
 * Boundary: integration tier (`.int`): needs Docker for the Testcontainers Valkey (`useValkey`). Each test uses a
 *           channel of its own; a subscription is ready once the server counts it (`PUBSUB NUMSUB`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0225 (decision 1); ADR 0346 (decision 5); ADR 0150 (the Valkey client); ADR 0182
 *                     (integration tier); STA-2802.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RealtimeConfig } from "#config/realtime.config";
import type { FanoutMessage } from "#contracts/types/fanout-message.type";
import { useValkey } from "#node/__tests__/fixtures/valkey.fixture";
import { ValkeyRealtimeFanoutDriver } from "#node/drivers/valkey-realtime-fanout.driver";

const valkey = useValkey();

/** The fixture's server as the `REALTIME_VALKEY_URL` secret. */
class FanoutSecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "REALTIME_VALKEY_URL" ? valkey.url : undefined;
  }
}

/** One instance's fan-out on `channel`; its publishing connection closes after the file. */
const fanoutOn = (channel: string): ValkeyRealtimeFanoutDriver =>
  valkey.track(
    new ValkeyRealtimeFanoutDriver(
      buildConfig(RealtimeConfig, {
        values: { fanout: "valkey", fanoutChannel: channel },
        secrets: new FanoutSecrets(),
      }),
    ),
  );

/** A broadcast message numbered `index`. */
const broadcast = (index: number): FanoutMessage => ({
  kind: "broadcast",
  broadcast: {
    permission: "orders.view",
    message: { channel: "tenant.t.orders", name: "orders.order.paid.v1", id: `evt_${index}` },
  },
});

/** Resolves after `milliseconds`. */
const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

/** How many connections the server counts on `channel`. */
const subscribers = async (channel: string): Promise<number> => {
  const answer = (await valkey.client.pubsub("NUMSUB", channel)) as readonly (string | number)[];
  return Number(answer[1]);
};

/** Waits until the server counts `count` subscriptions on `channel`. */
async function untilSubscribed(channel: string, count: number): Promise<void> {
  for (let tries = 0; tries < 200; tries += 1) {
    // oxlint-disable-next-line no-await-in-loop -- polls the server until the subscriptions are live
    if ((await subscribers(channel)) === count) return;
    // oxlint-disable-next-line no-await-in-loop -- the wait between two polls
    await sleep(10);
  }
  throw new Error(`${channel} never reached ${count} subscriptions`);
}

/** Waits until `seen` holds `count` messages. */
async function untilSeen(seen: readonly unknown[], count: number): Promise<void> {
  for (let tries = 0; tries < 200 && seen.length < count; tries += 1)
    // oxlint-disable-next-line no-await-in-loop -- polls until the messages arrived
    await sleep(10);
}

describe(ValkeyRealtimeFanoutDriver, () => {
  it("delivers what one instance publishes to every instance, whole and in order", async () => {
    const [one, two] = [fanoutOn("it:a"), fanoutOn("it:a")];
    const seenOne: FanoutMessage[] = [];
    const seenTwo: FanoutMessage[] = [];
    const stopOne = one.subscribe((message) => seenOne.push(message));
    const stopTwo = two.subscribe((message) => seenTwo.push(message));
    await untilSubscribed("it:a", 2);
    for (let index = 0; index < 5; index += 1)
      // oxlint-disable-next-line no-await-in-loop -- publishes in order
      await one.publish(broadcast(index));
    await untilSeen(seenOne, 5);
    await untilSeen(seenTwo, 5);
    const expected = Array.from({ length: 5 }, (_, index) => broadcast(index));
    expect(seenOne).toEqual(expected);
    expect(seenTwo).toEqual(expected);
    stopOne();
    stopTwo();
  });

  it("drops text that is not JSON and messages on another channel", async () => {
    const fanout = fanoutOn("it:b");
    const seen: FanoutMessage[] = [];
    const stop = fanout.subscribe((message) => seen.push(message));
    await untilSubscribed("it:b", 1);
    await valkey.client.publish("it:b", "{not json");
    await valkey.client.publish("it:other", JSON.stringify(broadcast(9)));
    await fanoutOn("it:b").publish(broadcast(1));
    await untilSeen(seen, 1);
    await sleep(50);
    expect(seen).toEqual([broadcast(1)]);
    stop();
  });

  it("keeps delivering to the other receivers when one throws", async () => {
    const fanout = fanoutOn("it:c");
    const seen: FanoutMessage[] = [];
    const stopThrowing = fanout.subscribe(() => {
      throw new Error("a receiver failed");
    });
    const stop = fanout.subscribe((message) => seen.push(message));
    await untilSubscribed("it:c", 1);
    await fanout.publish(broadcast(1));
    await untilSeen(seen, 1);
    expect(seen).toEqual([broadcast(1)]);
    stopThrowing();
    stop();
  });

  it("opens one subscribe connection for its receivers and closes it with the last", async () => {
    const fanout = fanoutOn("it:d");
    const seen: FanoutMessage[] = [];
    const stopOne = fanout.subscribe((message) => seen.push(message));
    const stopTwo = fanout.subscribe(() => {});
    await untilSubscribed("it:d", 1);
    stopOne();
    await sleep(50);
    expect(await subscribers("it:d")).toBe(1);
    stopTwo();
    await untilSubscribed("it:d", 0);
    await fanout.publish(broadcast(2));
    await sleep(100);
    expect(seen).toEqual([]);
  });
});
