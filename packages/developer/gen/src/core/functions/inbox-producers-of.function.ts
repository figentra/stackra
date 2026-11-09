/**
 * Stackra file contract:
 * Purpose: `inboxProducersOf`, the contract-only producers a service listens to: each service read from a `contract`
 *          package (no sibling folder) that a listener's `handle` event comes from (`#stackra/clients/<service>`), with
 *          its pinned manifest. Their events reach the service through its generated inbox (`POST /events/inbox`),
 *          never through an Encore subscription (ADR 0511 decisions 14 and 18).
 * Boundary: pure. A service only: an app or package gets no inbox. Sorted by service key, one row per service.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (amendment of 2026-11-02, decision 18); ADR 0260 (decision 4); STA-1910.
 */
import type { StackraManifest } from "@stackra/contracts";

import { CLIENTS_SPECIFIER } from "#core/constants/clients-specifier.constant";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The contract-only producers whose events `ir` listens to.
 *
 * @example
 * inboxProducersOf(billingIr); // [{ service: "pay", manifest: { member: "pay", relay: {...}, ... } }]
 */
export function inboxProducersOf(
  ir: MemberIR,
): { readonly service: string; readonly manifest: StackraManifest }[] {
  if (ir.layout !== "service") return [];
  const found = new Map<string, StackraManifest>();
  for (const declared of ir.classes) {
    const event = declared.kind === "listener" ? declared.handle?.event : undefined;
    if (event === undefined || !event.from.startsWith(CLIENTS_SPECIFIER)) continue;
    const service = event.from.slice(CLIENTS_SPECIFIER.length);
    const pinned = ir.services?.find((candidate) => candidate.member === service);
    if (pinned?.package !== undefined) found.set(service, pinned.manifest);
  }
  return (
    [...found]
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort(([left], [right]) => (left < right ? -1 : 1))
      .map(([service, manifest]) => ({ service, manifest }))
  );
}
