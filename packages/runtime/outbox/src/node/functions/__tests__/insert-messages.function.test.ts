/**
 * Stackra file contract:
 * Purpose: unit tests of `insertMessages`: one statement per batch with the rows as one bound JSON array (no value in
 *          the text), the scope columns read from the transaction's scope settings, and nothing sent for no messages;
 *          an event declaring a `@Classified` field is written only inside a tenant, and refused before any write with
 *          none (STA-2629), while an event with no such field never reads the tenant.
 * Boundary: test only; a stand-in entity manager records each statement. The SQL itself runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 (decision 4); ADR 0160; ADR 0239 (2026-11-07 amendment, gap C).
 */
import { DataClassification } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { IntegrationEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { Classified, registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { MessageKind } from "#contracts/index";
import type { OutboxMessage } from "#contracts/index";
import { PlatformPersonalEventError } from "#core/errors/platform-personal-event.error";
import { registerEventNames } from "#core/functions/register-event-names.function";
import { insertMessages } from "#node/functions/insert-messages.function";

class CustomerRenamed extends IntegrationEvent({ name: "customer.renamed" }) {
  @Classified(DataClassification.Personal)
  name!: string;

  customerId!: string;
}

registerSchemas([[CustomerRenamed, z.object({ customerId: z.string(), name: z.string() })]]);
registerEventNames([{ type: CustomerRenamed, name: "crm.customer.renamed.v1" }]);

/** An entity manager that records each statement and answers the owner read with `owner` (null: none). */
function ownerEm(owner: string | null) {
  const statements: { sql: string; params: readonly unknown[] }[] = [];
  const em = {
    execute: async (sql: string, params: readonly unknown[] = []) => {
      statements.push({ sql, params });
      return sql.includes("app.tenant_id") ? [{ owner }] : [];
    },
  } as unknown as ReturnType<Database["em"]>;
  return { em, statements };
}

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

  it("refuses an event with a personal field written with no tenant, before writing anything (STA-2629)", async () => {
    const { em, statements } = ownerEm(null);
    const personal = {
      ...MESSAGE,
      id: "evt_P",
      type: "crm.customer.renamed.v1",
      data: { customerId: "cus_1", name: "Ada" },
    } as const;
    const refused = insertMessages(em, [MESSAGE, personal]);
    await expect(refused).rejects.toBeInstanceOf(PlatformPersonalEventError);
    await expect(refused).rejects.toMatchObject({ type: "crm.customer.renamed.v1" });
    expect(statements).toHaveLength(1);
    expect(statements[0]?.sql).toContain("current_setting('app.tenant_id', true)");
    expect(statements[0]?.sql).not.toContain("Ada");
  });

  it("writes an event with a personal field inside a tenant, and never reads the tenant for one without", async () => {
    const inside = ownerEm("tnt_1");
    await insertMessages(inside.em, [
      { ...MESSAGE, type: "crm.customer.renamed.v1", data: { customerId: "cus_1", name: "Ada" } },
    ]);
    expect(inside.statements.map(({ sql }) => sql.slice(0, 11))).toEqual([
      "select null",
      "insert into",
    ]);
    const plain = ownerEm(null);
    await insertMessages(plain.em, [MESSAGE]);
    expect(plain.statements).toHaveLength(1);
  });

  it("sends nothing for no messages", async () => {
    const { em, statements } = recordingEm();
    await insertMessages(em, []);
    expect(statements).toEqual([]);
  });
});
