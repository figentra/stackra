/**
 * Stackra file contract:
 * Purpose: `checkSubscriptions`, the warning `client_event_unsubscribed`: a service listens to an event of a
 *          contract-only producer whose pinned manifest does not list the service as a subscriber of that event in
 *          any environment (`relay.subscribers`), so no delivery reaches the listener until the producer's runway lists
 *          it. Names the consumer, the producer and the event.
 * Boundary: pure; warnings, so gen still writes (ADR 0511 decision 17), except under `STACKRA_GEN_STRICT=1`, where each
 *           finding refuses (Leader, 2026-11-09: a warning let Tamo's erasure delivery go silent for weeks). Events compare without
 *           their version (`.v<n>`): the producer relays every live version under one id and the inbox lifts an older
 *           one. Member keys compare in kebab case.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (amendment of 2026-11-02, decision 17); STA-1910.
 */
import { kebabCase } from "@stackra/support";

import { CLIENTS_SPECIFIER } from "#core/constants/clients-specifier.constant";
import { inboxProducersOf } from "#core/functions/inbox-producers-of.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A wire name without its version. */
const unversioned = (wire: string): string => wire.replace(/\.v\d+$/, "");

/**
 * The `client_event_unsubscribed` findings of `ir`: warnings, or refusals when gen runs strict.
 *
 * @param strict - `STACKRA_GEN_STRICT=1`: each finding refuses, since the listener would never be delivered to (Tamo's
 *                 erasures went silent for weeks while this only warned).
 * @example
 * checkSubscriptions(billingIr); // [{ code: "client_event_unsubscribed", severity: "warning", ... }]
 */
export function checkSubscriptions(ir: MemberIR, strict = false): GenError[] {
  const producers = new Map(inboxProducersOf(ir).map((row) => [row.service, row.manifest]));
  const warnings: GenError[] = [];
  for (const declared of ir.classes) {
    const event = declared.kind === "listener" ? declared.handle?.event : undefined;
    if (event === undefined || !event.from.startsWith(CLIENTS_SPECIFIER)) continue;
    const service = event.from.slice(CLIENTS_SPECIFIER.length);
    const manifest = producers.get(service);
    const wire = (manifest?.events ?? []).find(
      (entry) => entry.kind === "integration" && entry["class"] === event.name,
    )?.["name"];
    // An event the contract does not publish is `client_event_unknown`'s.
    if (manifest === undefined || typeof wire !== "string") continue;
    const listed = Object.values(manifest.relay?.subscribers ?? {}).some((subscribers) =>
      subscribers.some(
        (subscriber) =>
          kebabCase(subscriber.member) === kebabCase(ir.member) &&
          subscriber.events.some((taken) => unversioned(taken) === unversioned(wire)),
      ),
    );
    if (!listed)
      warnings.push({
        code: "client_event_unsubscribed",
        file: declared.file,
        line: 0,
        column: 0,
        subject: `${declared.name}.handle`,
        message: `${ir.member} listens to \`${wire}\` of ${manifest.member}, but ${manifest.member}'s contract lists ${ir.member} as its subscriber in no environment, so no delivery reaches it`,
        fix: `add \`${ir.member}\` with \`${wire}\` under \`events.subscribers\` in ${manifest.member}'s runway.yaml, release its contract and bump it here`,
        ...(strict ? {} : { severity: "warning" as const }),
      });
  }
  return warnings;
}
