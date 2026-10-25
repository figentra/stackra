/**
 * Stackra file contract:
 * Purpose: unit tests of `insertMessages`: one statement per batch with the rows as one bound JSON array (no value in
 *          the text), the scope columns read from the transaction's scope settings, and nothing sent for no messages.
 * Boundary: test only; a stand-in entity manager records each statement. The SQL itself runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 (decision 4); ADR 0160.
 */
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { MessageKind } from "#contracts/index";
import type { OutboxMessage } from "#contracts/index";
import { insertMessages } from "#node/functions/insert-messages.function";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

/** An entity manager that records each statement. */
function recordingEm() {
  const statements: { sql: string; params: readonly unknown[] }[] = [];
  const em = {
    execute: async (sql: string, params: readonly unknown[] = []) => {
      statements.push({ sql, params });
      return [];
    },
  } as unknown as ReturnType<Database["em"]>;
  return { em, statements };
}

const MESSAGE: OutboxMessage = {
  id: "evt_A",
  kind: MessageKind.Event,
  type: "orders.order.paid.v1",
  data: { orderId: "ord_1" },
  meta: { correlationId: "call-1" },
  occurredAt: NOON,
  attempts: 0,
  availableAt: NOON,
};

describe(insertMessages, () => {
  it("writes a batch in one statement, the rows bound as one JSON array", async () => {
    const { em, statements } = recordingEm();
    await insertMessages(em, [MESSAGE, { ...MESSAGE, id: "evt_B", data: undefined }]);
    expect(statements).toHaveLength(1);
    const [insert] = statements;
    expect(insert?.sql).toContain('insert into "outbox"."messages"');
    expect(insert?.sql).toContain("jsonb_to_recordset(?::jsonb)");
    expect(insert?.sql.split("?")).toHaveLength(2);
    expect(insert?.sql).not.toContain("ord_1");
    expect(JSON.parse(String(insert?.params[0]))).toEqual([
      {
        id: "evt_A",
        kind: "event",
        type: "orders.order.paid.v1",
        data: { orderId: "ord_1" },
        meta: { correlationId: "call-1" },
        occurred_at: NOON.toISOString(),
        available_at: NOON.toISOString(),
      },
      expect.objectContaining({ id: "evt_B", data: null }),
    ]);
  });

  it("takes the scope from the transaction's scope settings", async () => {
    const { em, statements } = recordingEm();
    await insertMessages(em, [MESSAGE]);
    expect(statements[0]?.sql).toContain("current_setting('app.scope_id', true)");
    expect(statements[0]?.sql).toContain("current_setting('app.scope_path', true)");
  });

  it("sends nothing for no messages", async () => {
    const { em, statements } = recordingEm();
    await insertMessages(em, []);
    expect(statements).toEqual([]);
  });
});
