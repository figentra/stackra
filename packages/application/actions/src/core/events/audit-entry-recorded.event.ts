/**
 * Stackra file contract:
 * Purpose: `AuditEntryRecorded`, the integration event the `outbox` AuditTrail driver writes for every audited action
 *          call: who called which action in which tenant and scope, its permission, risk and effect tags, the outcome
 *          with the refusal code, the request origin (storefront, console, API key, agent), and the fields the handler
 *          added. The audit service consumes it, chains it per
 *          tenant and stores it (ADR 0212).
 * Boundary: an integration event (`audit_entry.recorded`, version 1). The actor carries its full `onBehalfOf` chain
 *           (ADR 0098 decision 7) as public ids and kinds, never a credential. `fields` are what the handler passed to
 *           `ctx.audit`; a classified field never belongs there. It registers its schema when the module loads
 *           (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decisions 1, 2 and 4); ADR 0098 (decision 7); ADR 0141 (the envelope); ADR 0294
 *                     (decisions 5 and 16); ADR 0456 (decision 1: the request origin, optional fields of version 1).
 */
import type { Actor, Json } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { Field, registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * One audited call.
 *
 * @example
 * AuditEntryRecorded.create({ callId, key, effects: [], actor, outcome: "ok", fields: {} });
 */
export class AuditEntryRecorded extends IntegrationEvent({ name: "audit_entry.recorded" }) {
  /** `ok`, or `refused`. */
  // reason: a two-value literal union kept as published, so `AuditEntry` consumers see the same type
  @Field(z.enum(["ok", "refused"]))
  outcome!: "ok" | "refused";

  /** The call's id. */
  callId!: string;

  /** The action's locked key. */
  key!: string;

  /** The derived permission, when registered. */
  permission?: string;

  /** The permission's risk, `L0` to `L4`, when registered. */
  risk?: string;

  /** The effect tags. */
  effects!: string[];

  /** Who called, with the delegation chain. */
  actor!: Actor;

  /** The scope node's public id; absent for a platform call. */
  scopeId?: string;

  /** The scope node's path. */
  scopePath?: string;

  /** The surface the call arrived through (`storefront`, `console`, `api_key`, `agent`); absent for an internal call. */
  originKind?: string;

  /** The public id of the storefront, API key or agent the call came from. */
  originId?: string;

  /** The refusal code of a refused call. */
  code?: string;

  /** What the handler added with `ctx.audit`. */
  fields!: Record<string, Json>;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    AuditEntryRecorded,
    z.object({
      callId: z.string(),
      key: z.string(),
      permission: z.string().optional(),
      risk: z.string().optional(),
      effects: z.array(z.string()),
      actor: z.custom<Actor>((value) => typeof value === "object" && value !== null),
      scopeId: z.string().optional(),
      scopePath: z.string().optional(),
      originKind: z.string().optional(),
      originId: z.string().optional(),
      outcome: z.enum(["ok", "refused"]),
      code: z.string().optional(),
      fields: z.record(
        z.string(),
        z.custom<Json>(() => true),
      ),
    }),
  ],
]);
