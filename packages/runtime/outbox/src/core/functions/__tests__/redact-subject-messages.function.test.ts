/**
 * Stackra file contract:
 * Purpose: unit tests of `redactSubjectMessages`: held messages naming the subject, live or dead, get the personal
 *          fields nulled at any depth (a row change's `before` and `after` too) and keep their delivery state;
 *          messages of another subject, or with no such field, are not rewritten; an empty subject is refused.
 * Boundary: test only; the memory outbox driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0189 (decision 2); data-layer gap gov6.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MessageKind } from "#contracts/index";
import type { OutboxMessage } from "#contracts/index";
import { MemoryOutboxDriver } from "#core/drivers/memory-outbox.driver";
import { redactSubjectMessages } from "#core/functions/redact-subject-messages.function";

const NOON = new Date(Date.UTC(2026, 9, 28, 12));

/** A message of `kind` with payload `data`. */
function message(
  id: PublicId<"evt">,
  data: unknown,
  kind: MessageKind = MessageKind.Event,
): OutboxMessage {
  return {
    id,
    kind,
    type: "crm.customer.registered.v1",
    data,
    meta: {},
    occurredAt: NOON,
    attempts: 0,
    availableAt: NOON,
  };
}

const FIELDS: ReadonlySet<string> = new Set(["email", "phone"]);

describe(redactSubjectMessages, () => {
  it("nulls the personal fields of every held message naming the subject", async () => {
    const driver = new MemoryOutboxDriver();
    await driver.write([
      message("evt_A", { customerId: "usr_1", email: "a@example.com", plan: "gold" }),
      message(
        "evt_B",
        {
          model: "Customer",
          id: "cus_1",
          kind: "updated",
          fields: ["phone"],
          before: { userId: "usr_1", phone: "+966500000000" },
          after: { userId: "usr_1", phone: "+966500000001" },
        },
        MessageKind.Change,
      ),
      message("evt_C", { customerId: "usr_2", email: "b@example.com" }),
      message("evt_D", { customerId: "usr_1", plan: "gold" }),
    ]);
    await driver.deadLetter("evt_A", { code: "internal", message: "down" }, NOON);

    await expect(redactSubjectMessages(driver, "usr_1", FIELDS)).resolves.toBe(2);

    const byId = new Map(driver.stored().map((stored) => [stored.id, stored]));
    expect(byId.get("evt_A")?.data).toEqual({ customerId: "usr_1", email: null, plan: "gold" });
    expect(byId.get("evt_A")?.deadAt).toEqual(NOON);
    expect(byId.get("evt_B")?.data).toMatchObject({
      before: { userId: "usr_1", phone: null },
      after: { userId: "usr_1", phone: null },
    });
    expect(byId.get("evt_C")?.data).toEqual({ customerId: "usr_2", email: "b@example.com" });
    expect(byId.get("evt_D")?.data).toEqual({ customerId: "usr_1", plan: "gold" });
  });

  it("rewrites nothing a second time", async () => {
    const driver = new MemoryOutboxDriver();
    await driver.write([message("evt_A", { customerId: "usr_1", email: "a@example.com" })]);
    await redactSubjectMessages(driver, "usr_1", FIELDS);
    await expect(redactSubjectMessages(driver, "usr_1", FIELDS)).resolves.toBe(0);
  });

  it("refuses an empty subject", async () => {
    await expect(redactSubjectMessages(new MemoryOutboxDriver(), "", FIELDS)).rejects.toThrow(
      TypeError,
    );
  });
});
