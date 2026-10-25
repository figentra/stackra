/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateWebhookDeliveriesMigration`: one transactional step that creates
 *          `webhooks.webhook_deliveries` with the `whd` primary key, the cascading foreign key to its endpoint, the
 *          scope columns, the event, the answer, the event index and no policy.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0224 (decision 3); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateWebhookDeliveriesMigration } from "#node/database/migrations/0002-create-webhook-deliveries.migration";

describe("CreateWebhookDeliveriesMigration", () => {
  const { steps } = compileMigration(CreateWebhookDeliveriesMigration, { schema: "webhooks" });
  const sql = steps.flatMap((step) => step.sql).join("\n");

  it("creates the log with its columns", () => {
    expect(sql).toContain('create table "webhooks"."webhook_deliveries"');
    expect(sql).toContain('"endpoint_id" varchar(33) not null');
    expect(sql).toContain('"scope_path" ltree not null');
    expect(sql).toContain('"event_id" varchar(64) not null');
    expect(sql).toContain('"event_type" varchar(200) not null');
    expect(sql).toContain('"response_status" integer null');
    expect(sql).toContain('"is_delivered" boolean not null');
  });

  it("ties each attempt to its endpoint, indexes the event and adds no policy", () => {
    expect(sql).toContain(
      'add constraint "fk_webhook_deliveries_endpoint_id" foreign key ("endpoint_id") references "webhooks"."webhook_endpoints" ("id") on delete cascade',
    );
    expect(sql).toContain("idx_webhook_deliveries_event_id");
    expect(sql).not.toContain("row level security");
  });
});
