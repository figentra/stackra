/**
 * Stackra file contract:
 * Purpose: unit tests of `findChainBreak`: an intact run (whole, or with its oldest links purged) holds; a changed
 *          record, a removed link, a reordered pair and a forged hash are each found at the first broken link.
 * Boundary: test only; chains built with `linkAccessRecord`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 3 and its consequences).
 */
import { ActorKind, DataClassification } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { AccessLink } from "#contracts/types/access-link.type";
import { findChainBreak } from "#core/functions/find-chain-break.function";
import { linkAccessRecord } from "#core/functions/link-access-record.function";

/** A chain of `length` links, one call each. */
async function chain(length: number): Promise<AccessLink[]> {
  const links: AccessLink[] = [];
  for (let index = 1; index <= length; index++)
    links.push(
      await linkAccessRecord(
        {
          callId: `call_${index}`,
          actor: { kind: ActorKind.System, id: "sys_test" },
          target: "CustomerReads.view",
          classification: DataClassification.Personal,
          subjects: [`usr_${index}`],
          at: new Date(Date.UTC(2026, 9, 24, 8, index)),
        },
        links.at(-1),
      ),
    );
  return links;
}

describe("findChainBreak", () => {
  it("holds for an intact chain, an empty one and one whose oldest links were purged", async () => {
    const links = await chain(4);
    await expect(findChainBreak(links)).resolves.toBeUndefined();
    await expect(findChainBreak([])).resolves.toBeUndefined();
    await expect(findChainBreak(links.slice(2))).resolves.toBeUndefined();
  });

  it("finds a changed record", async () => {
    const links = await chain(3);
    const [first, second, third] = links as [AccessLink, AccessLink, AccessLink];
    await expect(findChainBreak([first, { ...second, subjects: ["usr_9"] }, third])).resolves.toBe(
      2,
    );
  });

  it("finds a removed link and a reordered pair", async () => {
    const [first, second, third] = (await chain(3)) as [AccessLink, AccessLink, AccessLink];
    await expect(findChainBreak([first, third])).resolves.toBe(3);
    await expect(findChainBreak([first, third, second])).resolves.toBe(3);
  });

  it("finds a link re-hashed after its record was changed", async () => {
    const [first, second, third] = (await chain(3)) as [AccessLink, AccessLink, AccessLink];
    const forged = await linkAccessRecord({ ...second, subjects: ["usr_9"] }, first);
    await expect(findChainBreak([first, forged, third])).resolves.toBe(3);
  });
});
