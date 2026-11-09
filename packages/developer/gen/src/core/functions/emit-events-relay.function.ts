/**
 * Stackra file contract:
 * Purpose: `emitEventsRelay`, a producer service's `#stackra/events-relay` (`.stackra/gen/events-relay.ts`):
 *          `EventsRelayConfig`, the host's `outbox.events_relay`, from the `events` block of every environment of its
 *          `runway.yaml` (the signing key's secret name, the public keys current first, the subscribers with their inbox
 *          origins and events), the running one picked by `STACKRA_ENVIRONMENT` at run time (`dev` when unset, as
 *          `RelayInboxConfig` does). An environment without a block publishes nothing across apps.
 * Boundary: pure. Written only for a service whose runway has an `events` block; any other service is unchanged. The
 *           values are fixed at build time, never runtime env vars (the outbox's AGENTS.md); the signing key is named,
 *           never written (ADR 0173).
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (amendment of 2026-11-02, decisions 16 and 17); ADR 0305 (an override keeps the plain
 *                     name, its base is `Base<Name>`); ADR 0173; STA-1910.
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The relay configuration of a producer, or undefined when its runway has no `events` block.
 *
 * @example
 * emitEventsRelay(ir); // "...export class EventsRelayConfig extends BaseEventsRelayConfig {..."
 */
export function emitEventsRelay(ir: MemberIR): string | undefined {
  if (ir.layout !== "service" || ir.eventsRelay === undefined) return undefined;
  const rows = Object.entries(ir.eventsRelay)
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort(([left], [right]) => (left < right ? -1 : 1))
    .map(
      ([environment, events]) =>
        `  ${JSON.stringify(environment)}: { signingKey: ${JSON.stringify(events.signingKey)}, keys: ${JSON.stringify(events.keys)}, subscribers: ${JSON.stringify(events.subscribers)} },`,
    );
  const header = generatedHeader({
    from: "the `events` block of each environment of runway.yaml",
    purpose: `the cross-app relay configuration of ${ir.package}: its signing key's name, public keys and subscribers.`,
    boundary:
      "every environment is fixed here at build time and STACKRA_ENVIRONMENT picks one at run time; the signing key " +
      "is a secret name, read through the SecretStore, never a value.",
    runtime: "node",
  });
  return [
    header,
    'import { EventsRelayConfig as BaseEventsRelayConfig } from "@stackra/outbox";',
    'import type { RelayKey, Subscriber } from "@stackra/outbox/contracts";',
    "",
    "/** The `events` block of each runway environment. */",
    "const RELAYS: Record<string, { signingKey: string; keys: RelayKey[]; subscribers: Subscriber[] }> = {",
    ...rows,
    "};",
    "",
    "/** The running environment's block; none publishes nothing across apps. */",
    'const RUNNING = RELAYS[process.env["STACKRA_ENVIRONMENT"] ?? "dev"];',
    "",
    "/** The relay configuration of the running environment. */",
    "export class EventsRelayConfig extends BaseEventsRelayConfig {",
    "  override keys = RUNNING?.keys ?? [];",
    "",
    "  override subscribers = RUNNING?.subscribers ?? [];",
    "",
    '  override signingKey = RUNNING?.signingKey ?? "STACKRA_EVENTS_SIGNING_KEY";',
    "}",
    "",
  ].join("\n");
}
