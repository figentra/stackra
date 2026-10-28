/**
 * Stackra file contract:
 * Purpose: unit tests of `findAuditChainBreak`: an intact, empty or partly read audit chain holds; a changed record, a
 *          removed or reordered link and a re-hashed forgery are found.
 * Boundary: test only; pure Web Crypto, no store.
 * Runtime: isomorphic (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 3); ADR 0465 (decision 4).
 */
import type { AuditEntry } from "@stackra/actions/contracts";
import { ActorKind, ApiArea } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { AuditLink } from "#contracts/types/audit-link.type";
import { findAuditChainBreak } from "#core/functions/find-audit-chain-break.function";
import { hashAuditLink } from "#core/functions/hash-audit-link.function";
import { linkAuditEntry } from "#core/functions/link-audit-entry.function";

/** The entry of call `index`. */
const entryOf = (index: number): AuditEntry => ({
  call: {
    callId: `call_${index}`,
    type: class {},
    kind: "action",
    key: "orders.order.create@1",
    actor: { kind: ActorKind.Service, id: "svc_1", scopeId: "scp_acme" },
    area: ApiArea.App,
  },
  at: new Date(Date.UTC(2026, 9, 28, 9, index)),
  outcome: "ok",
  fields: { index },
});

/** A chain of `length` links. */
async function chain(length: number): Promise<AuditLink[]> {
  const links: AuditLink[] = [];
  for (let index = 1; index <= length; index++)
    links.push(await linkAuditEntry(entryOf(index), links.at(-1)));
  return links;
}

describe("findAuditChainBreak", () => {
  it("holds for an intact chain, an empty one and a run from its middle", async () => {
    const links = await chain(4);
    await expect(findAuditChainBreak(links)).resolves.toBeUndefined();
    await expect(findAuditChainBreak([])).resolves.toBeUndefined();
    await expect(findAuditChainBreak(links.slice(2))).resolves.toBeUndefined();
  });

  it("finds a changed record", async () => {
    const [first, second, third] = (await chain(3)) as [AuditLink, AuditLink, AuditLink];
    await expect(
      findAuditChainBreak([first, { ...second, outcome: "refused" }, third]),
    ).resolves.toBe(2);
  });

  it("finds a removed link and a reordered pair", async () => {
    const [first, second, third] = (await chain(3)) as [AuditLink, AuditLink, AuditLink];
    await expect(findAuditChainBreak([first, third])).resolves.toBe(3);
    await expect(findAuditChainBreak([first, third, second])).resolves.toBe(3);
  });

  it("finds a link re-hashed after its record was changed", async () => {
    const [first, second, third] = (await chain(3)) as [AuditLink, AuditLink, AuditLink];
    const changed = { ...second, fields: { index: 9 } };
    const forged = { ...changed, hash: await hashAuditLink(changed, 2, first.hash) };
    await expect(findAuditChainBreak([first, forged, third])).resolves.toBe(3);
  });
});
