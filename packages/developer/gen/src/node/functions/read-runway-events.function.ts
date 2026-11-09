/**
 * Stackra file contract:
 * Purpose: `readRunwayEvents`, the `events` block of each environment of a service's `runway.yaml` (ADR 0511
 *          decisions 16 and 17): the signing key's secret name (`STACKRA_EVENTS_SIGNING_KEY` when unset), the public
 *          keys in their order (current first) and the subscribers with their inbox origin and events. Gen writes the
 *          keys and subscribers (no origins) into the manifest's `relay` section and binds `EventsRelayConfig` from it.
 * Boundary: reads `<root>/runway.yaml` only, through `yamlValue`, since gen does not depend on `@stackra/runway`. Only
 *           string facts are kept; runway's own schema (`SERVICE_EVENTS_SCHEMA`) validates the block at deploy, so gen
 *           neither refuses nor repairs one. Names and public keys only: the signing key's value is never in the file.
 * Runtime: node
 * Governing contract: ADR 0511 (amendment of 2026-11-02, decisions 16 and 17); ADR 0296 (runway v3); STA-1910.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { MemberIR } from "#core/types/member-ir.type";
import { yamlValue } from "#node/functions/yaml-value.function";

/** The signing key's secret name when an `events` block names none (`EventsRelayOptions.signingKey`). */
const DEFAULT_SIGNING_KEY = "STACKRA_EVENTS_SIGNING_KEY";

/** `value` as a mapping, or an empty one. */
const record = (value: unknown): Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

/** `value` as a list, or an empty one. */
const list = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : []);

/** `value` when it is a string. */
const text = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

/**
 * The `events` blocks of `root`'s runway, by environment; undefined when no environment has one.
 *
 * @example
 * readRunwayEvents("services/pay")?.["dev"]?.subscribers[0]?.member; // "billing"
 */
export function readRunwayEvents(root: string): MemberIR["eventsRelay"] {
  const file = join(root, "runway.yaml");
  if (!existsSync(file)) return undefined;
  const found: Record<string, NonNullable<MemberIR["eventsRelay"]>[string]> = {};
  for (const [environment, settings] of Object.entries(
    record(record(yamlValue(readFileSync(file, "utf8")))["environments"]),
  )) {
    const events = record(settings)["events"];
    if (events === undefined || events === null) continue;
    const block = record(events);
    found[environment] = {
      signingKey: text(block["signingKey"]) ?? DEFAULT_SIGNING_KEY,
      keys: list(block["keys"]).flatMap((key) => {
        const id = text(record(key)["id"]);
        const publicKey = text(record(key)["publicKey"]);
        return id === undefined || publicKey === undefined ? [] : [{ id, publicKey }];
      }),
      subscribers: list(block["subscribers"]).flatMap((subscriber) => {
        const member = text(record(subscriber)["member"]);
        const inbox = text(record(subscriber)["inbox"]);
        const taken = list(record(subscriber)["events"]).flatMap((event) => text(event) ?? []);
        return member === undefined || inbox === undefined
          ? []
          : [{ member, inbox, events: taken }];
      }),
    };
  }
  return Object.keys(found).length === 0 ? undefined : found;
}
