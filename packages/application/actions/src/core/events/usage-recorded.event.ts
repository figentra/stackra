/**
 * Stackra file contract:
 * Purpose: `UsageRecorded`, the integration event the pipeline writes for every applied call of a metered action: the
 *          meter, its kind, the call's value (or the distinct subject of a `unique` meter), the action and the scope.
 *          The usage service aggregates it into windows, rollups and quotas.
 * Boundary: an integration event (`usage.recorded`, version 1), written through the outbox inside the action's unit of
 *           work, so a metered call never commits without its usage and a rolled-back call records none. Usage, audit,
 *           analytics and domain events stay four streams (ADR 0216 decision 1). It registers its schema when the
 *           module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decisions 1, 2 and 4); ADR 0141; ADR 0294 (decisions 5 and 16).
 */
import { Enum } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { MeterKind } from "#core/enums/meter-kind.enum";

/**
 * One metered call's usage.
 *
 * @example
 * UsageRecorded.create({ meter: "messages.sent", kind: MeterKind.Count, value: 1, key, callId });
 */
export class UsageRecorded extends IntegrationEvent({ name: "usage.recorded" }) {
  /** The meter's name. */
  meter!: string;

  /** How it aggregates. */
  kind!: MeterKind;

  /** The call's value: 1 for `count` and `unique`, the field's units for the others. */
  value!: number;

  /** The distinct value of a `unique` meter. */
  subject?: string;

  /** The action's locked key. */
  key!: string;

  /** The call's id. */
  callId!: string;

  /** The scope node's public id; absent for a platform call. */
  scopeId?: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    UsageRecorded,
    z.object({
      meter: z.string(),
      kind: z.enum(Enum.values(MeterKind) as [MeterKind, ...MeterKind[]]),
      value: z.number(),
      subject: z.string().optional(),
      key: z.string(),
      callId: z.string(),
      scopeId: z.string().optional(),
    }),
  ],
]);
