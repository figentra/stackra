/**
 * Stackra file contract:
 * Purpose: `readRunwayQueues`, the `queues` block of each environment of a service's `runway.yaml` (ADR 0296): per
 *          queue its `visibilityTimeoutSeconds` and `dlq`, which `emitEncoreQueues` applies to the queue's Encore
 *          subscription and `checkQueueSettings` checks (STA-2050).
 * Boundary: reads `<root>/runway.yaml` only, through `yamlValue`, since gen does not depend on `@stackra/runway`. Only
 *           well-formed facts are kept (a whole number of seconds from 0, `true` or `false`); runway's own schema
 *           (`SERVICE_ENVIRONMENT_SCHEMA`) validates the block at deploy, so gen neither refuses nor repairs one. A
 *           queue named with no settings is kept with none, so the queues an environment lists stay known.
 * Runtime: node
 * Governing contract: ADR 0296 (runway v3: a member's runway sizes its own queues); ADR 0148 (decisions 1, 3 and 6);
 *                     STA-1727; STA-2050.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { MemberIR } from "#core/types/member-ir.type";
import type { QueueSettings } from "#core/types/queue-settings.type";
import { yamlValue } from "#node/functions/yaml-value.function";

/** A whole number of seconds from 0, as `yamlValue` keeps it (a string). */
const SECONDS = /^\d+$/;

/** `value` as a mapping, or an empty one. */
const record = (value: unknown): Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

/** The settings of one queue entry: the well-formed fields only. */
function settingsOf(entry: unknown): QueueSettings {
  const { visibilityTimeoutSeconds: seconds, dlq } = record(entry);
  return {
    ...(typeof seconds === "string" && SECONDS.test(seconds)
      ? { visibilityTimeoutSeconds: Number(seconds) }
      : {}),
    ...(dlq === "true" || dlq === "false" ? { dlq: dlq === "true" } : {}),
  };
}

/**
 * The `queues` blocks of `root`'s runway, by environment and queue; undefined when no environment has one.
 *
 * @example
 * readRunwayQueues("services/billing")?.["production"]?.["billing"]; // { visibilityTimeoutSeconds: 300, dlq: true }
 */
export function readRunwayQueues(root: string): MemberIR["queueSettings"] {
  const file = join(root, "runway.yaml");
  if (!existsSync(file)) return undefined;
  const found: Record<string, Readonly<Record<string, QueueSettings>>> = {};
  for (const [environment, settings] of Object.entries(
    record(record(yamlValue(readFileSync(file, "utf8")))["environments"]),
  )) {
    const queues = record(settings)["queues"];
    if (queues === undefined || queues === null) continue;
    found[environment] = Object.fromEntries(
      Object.entries(record(queues)).map(([queue, entry]) => [queue, settingsOf(entry)]),
    );
  }
  return Object.keys(found).length === 0 ? undefined : found;
}
