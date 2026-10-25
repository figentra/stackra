/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateWebhookEndpointsMigration`: one transactional step that creates the `ltree` extension
 *          and `webhooks.webhook_endpoints` with the `whe` primary key, the scope columns with the path's GiST index,
 *          the URL, the subscribed events, the secret names, the rotation and disable times, and no policy.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0224; ADR 0327 (decisions 3 and 9); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateWebhookEndpointsMigration } from "#node/database/migrations/0001-create-webhook-endpoints.migration";

describe("CreateWebhookEndpointsMigration", () => {
  const { after, steps } = compileMigration(CreateWebhookEndpointsMigration, {
    schema: "webhooks",
    createsSchema: true,
  });
  const [step] = steps;
  const sql = (step?.sql ?? []).join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the extension and the table with its columns", () => {
    expect(sql).toContain("ltree");
    expect(sql).toContain('create table "webhooks"."webhook_endpoints"');
    expect(sql).toContain('"id" varchar(33) not null');
    expect(sql).toContain('"scope_id" varchar(33) not null');
    expect(sql).toContain('"scope_path" ltree not null');
    expect(sql).toContain('"url" varchar(2048) not null');
    expect(sql).toContain('"events" jsonb');
    expect(sql).toContain('"secret_name" varchar(255) not null');
    expect(sql).toContain('"previous_secret_name" varchar(255) null');
    expect(sql).toContain('"rotated_at" timestamptz null');
    expect(sql).toContain('"disabled_at" timestamptz null');
  });

  it("indexes the path with GiST, comments every column and adds no policy", () => {
    expect(sql).toContain('using gist ("scope_path")');
    expect(sql).toContain("The name of the signing secret in the secret store; never its value.");
    expect(sql).not.toContain("row level security");
  });
});
