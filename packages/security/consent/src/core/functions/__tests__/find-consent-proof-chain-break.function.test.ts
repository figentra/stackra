/**
 * Stackra file contract:
 * Purpose: unit tests of `findConsentProofChainBreak`: an intact chain holds, and so does a run anchored at a later link
 *          (older proofs removed by retention); an edited proof, an edited hash, a missing link, a reordered run and
 *          another subject's link each break it at that link's sequence.
 * Boundary: test only; pure, Web Crypto.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0212 (decision 3: a broken chain fails verification); STA-2818.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { ConsentProof } from "#contracts/types/consent-proof.type";
import { findConsentProofChainBreak } from "#core/functions/find-consent-proof-chain-break.function";
import { linkConsentProof } from "#core/functions/link-consent-proof.function";
import type { ConsentProofLink } from "#core/types/consent-proof-link.type";

const RANA = "usr_01j9z3k4m5n6p7q8r9s0t1v2r1" as PublicId;
const OMAR = "usr_01j9z3k4m5n6p7q8r9s0t1v2o1" as PublicId;

/** A proof of `subject` to version `version`. */
const proofOf = (subject: PublicId, version: string): ConsentProof => ({
  subject,
  givenBy: subject,
  document: "terms",
  version,
  granted: true,
  at: `2026-10-0${version}T09:00:00.000Z`,
});

/** A chain of `count` links of `subject`. */
async function chainOf(subject: PublicId, count: number): Promise<ConsentProofLink[]> {
  const links: ConsentProofLink[] = [];
  for (let index = 1; index <= count; index += 1)
    links.push(await linkConsentProof(proofOf(subject, String(index)), links.at(-1)));
  return links;
}

describe("findConsentProofChainBreak", () => {
  it("holds for an intact chain, an empty run, and a run anchored after a removal", async () => {
    const links = await chainOf(RANA, 4);
    expect(await findConsentProofChainBreak(links)).toBeUndefined();
    expect(await findConsentProofChainBreak([])).toBeUndefined();
    expect(await findConsentProofChainBreak(links.slice(2))).toBeUndefined();
  });

  it("finds an edited proof and an edited hash", async () => {
    const links = await chainOf(RANA, 3);
    const edited = links.map((link) => (link.sequence === 2 ? { ...link, granted: false } : link));
    expect(await findConsentProofChainBreak(edited)).toBe(2);
    const rehashed = links.map((link) =>
      link.sequence === 3 ? { ...link, hash: "f".repeat(64) } : link,
    );
    expect(await findConsentProofChainBreak(rehashed)).toBe(3);
  });

  it("finds a missing link, a reordered run and another subject's link", async () => {
    const links = await chainOf(RANA, 3);
    const [first, second, third] = links as [ConsentProofLink, ConsentProofLink, ConsentProofLink];
    expect(await findConsentProofChainBreak([first, third])).toBe(3);
    expect(await findConsentProofChainBreak([second, first, third])).toBe(1);
    const foreign = await linkConsentProof(proofOf(OMAR, "2"), first);
    expect(await findConsentProofChainBreak([first, foreign])).toBe(2);
  });
});
