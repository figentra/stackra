/**
 * Stackra file contract:
 * Purpose: unit tests of `InAppStoreFake`: it stands in for the port, appends once per recipient and idempotency key,
 *          lists newest first with `unreadOnly`, `limit` and `product`, and marks only the named recipient's entries read.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0266 (decision 2); ADR 0269 (decision 3); ADR 0422 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { InAppStore } from "#contracts/index";
import { InAppStoreFake } from "#testing/in-app-store.fake";

const ALICE = "usr_alice";
const BOB = "usr_bob";

describe("InAppStoreFake", () => {
  it("stands in for the port", () => {
    expect(new InAppStoreFake()).toBeInstanceOf(InAppStore);
  });

  it("appends once per recipient and idempotency key", async () => {
    const inbox = new InAppStoreFake();
    const first = await inbox.append(
      ALICE,
      { product: "pos", kind: "order_paid", data: { orderId: "ord_1" } },
      "k1",
    );
    const again = await inbox.append(
      ALICE,
      { product: "pos", kind: "order_paid", data: { orderId: "ord_9" } },
      "k1",
    );
    await inbox.append(
      BOB,
      { product: "pos", kind: "order_paid", data: { orderId: "ord_1" } },
      "k1",
    );
    expect(again).toEqual(first);
    expect(first).toMatchObject({
      product: "pos",
      kind: "order_paid",
      data: { orderId: "ord_1" },
      readAt: null,
    });
    expect(await inbox.list(ALICE)).toHaveLength(1);
    expect(await inbox.list(BOB)).toHaveLength(1);
  });

  it("lists newest first, unread only and up to a limit", async () => {
    const inbox = new InAppStoreFake();
    const one = await inbox.append(ALICE, { product: "pos", kind: "a", data: {} }, "k1");
    const two = await inbox.append(ALICE, { product: "pos", kind: "b", data: {} }, "k2");
    const three = await inbox.append(ALICE, { product: "pos", kind: "c", data: {} }, "k3");
    await inbox.markRead(ALICE, two.id);
    expect((await inbox.list(ALICE)).map((entry) => entry.id)).toEqual([three.id, two.id, one.id]);
    expect((await inbox.list(ALICE, { unreadOnly: true })).map((entry) => entry.id)).toEqual([
      three.id,
      one.id,
    ]);
    expect((await inbox.list(ALICE, { limit: 1 })).map((entry) => entry.id)).toEqual([three.id]);
  });

  it("lists one product's entries with product", async () => {
    const inbox = new InAppStoreFake();
    const pos = await inbox.append(ALICE, { product: "pos", kind: "a", data: {} }, "k1");
    await inbox.append(ALICE, { product: "legal", kind: "b", data: {} }, "k2");
    expect(pos.product).toBe("pos");
    expect((await inbox.list(ALICE, { product: "pos" })).map((entry) => entry.id)).toEqual([
      pos.id,
    ]);
    expect(await inbox.list(ALICE, { product: "crm" })).toEqual([]);
    expect(await inbox.list(ALICE)).toHaveLength(2);
  });

  it("marks only the named recipient's entry read, and keeps the first read time", async () => {
    const inbox = new InAppStoreFake();
    const entry = await inbox.append(ALICE, { product: "pos", kind: "a", data: {} }, "k1");
    await expect(inbox.markRead(BOB, entry.id)).resolves.toBe(false);
    expect((await inbox.list(ALICE))[0]?.readAt).toBeNull();
    await expect(inbox.markRead(ALICE, entry.id)).resolves.toBe(true);
    const readAt = (await inbox.list(ALICE))[0]?.readAt;
    expect(readAt).toBeInstanceOf(Date);
    await expect(inbox.markRead(ALICE, entry.id)).resolves.toBe(true);
    expect((await inbox.list(ALICE))[0]?.readAt).toBe(readAt);
  });
});
