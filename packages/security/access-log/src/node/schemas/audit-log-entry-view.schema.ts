/**
 * Stackra file contract:
 * Purpose: `AuditLogEntryView`, one stored write audit as `AuditQuery` returns it: the audited call, its outcome and its
 *          place in the tenant's audit chain, so a reader can check a page with `findAuditChainBreak`.
 * Boundary: a shape class in its own file, the item of `AuditQueryOutput`. Ids, keys and codes only (the actor's
 *           `onBehalfOf` chain as public ids, `fields` as the handler wrote them). It registers its schema when the
 *           module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0212 (decision 3);
 *                     ADR 0465 (decision 4).
 */
import type { Actor, Json } from "@stackra/contracts";
import { Field, Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** The `actor` and `fields` jsonb values, kept as stored. */
const JSON_VALUE = z.custom<Json>(() => true);

/** The zod form of one view, shared by the class and its registration. */
const AUDIT_LOG_ENTRY_VIEW_SCHEMA = z.object({
  id: z.string(),
  callId: z.string(),
  key: z.string(),
  permission: z.string().nullable(),
  risk: z.string().nullable(),
  effects: z.array(z.string()),
  actor: z.custom<Actor>((value) => typeof value === "object" && value !== null),
  scopeId: z.string().nullable(),
  scopePath: z.string().nullable(),
  originKind: z.string().nullable(),
  originId: z.string().nullable(),
  outcome: z.enum(["ok", "refused"]),
  code: z.string().nullable(),
  fields: z.record(z.string(), JSON_VALUE),
  at: z.date(),
  sequence: z.number().int().min(1),
  previousHash: z.string().length(64),
  hash: z.string().length(64),
});

/**
 * One audited call.
 *
 * @example
 * AuditLogEntryView.create({ ...row });
 */
export class AuditLogEntryView extends Schema {
  /** Who called, with the delegation chain. */
  // reason: `Actor` is a union of the contracts package that ships no schema; stored and returned as written
  @Field(z.custom<Actor>((value) => typeof value === "object" && value !== null))
  actor!: Actor;

  /** `ok`, or `refused`. */
  // reason: a two-value literal union kept as `AuditEntry` publishes it
  @Field(z.enum(["ok", "refused"]))
  outcome!: "ok" | "refused";

  /** What the handler added with `ctx.audit`. */
  // reason: the handler's fields are any JSON, kept as written
  @Field(z.record(z.string(), JSON_VALUE))
  fields!: Record<string, Json>;

  /** The record's position in its tenant's audit chain. */
  @Int({ min: 1 })
  sequence!: number;

  /** The stored record's public id (`aud_…`). */
  id!: string;

  /** The audited call's id. */
  callId!: string;

  /** The action's locked key. */
  key!: string;

  /** The derived permission, or null. */
  permission!: string | null;

  /** The permission's risk, or null. */
  risk!: string | null;

  /** The effect tags. */
  effects!: string[];

  /** The scope node's public id, or null. */
  scopeId!: string | null;

  /** The scope node's path, or null. */
  scopePath!: string | null;

  /** The surface the call arrived through, or null. */
  originKind!: string | null;

  /** The storefront, API key or agent id, or null. */
  originId!: string | null;

  /** The refusal code, or null. */
  code!: string | null;

  /** When the call started. */
  at!: Date;

  /** The hash of the record before it. */
  previousHash!: string;

  /** The record's own hash. */
  hash!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[AuditLogEntryView, AUDIT_LOG_ENTRY_VIEW_SCHEMA]]);
