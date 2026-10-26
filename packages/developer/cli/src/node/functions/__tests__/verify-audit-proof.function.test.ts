/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyAuditProof`: a chain from genesis with a signed checkpoint holds; a changed link, a
 *          gap, a forged checkpoint, a checkpoint that disagrees with its link and a bundle that starts mid-chain with
 *          no anchor are each reported with the first broken sequence; caller keys override bundled ones; junk lines
 *          are problems, not crashes.
 * Boundary: test only; the bundle is built in place with `canonicalHash` and a memory signer. Link fields are made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0212 (decision 3); ADR 0416.
 */
import { MemorySignerDriver } from "@stackra/contracts";
import { canonicalHash, canonicalJson } from "@stackra/support";
import { describe, expect, it } from "@stackra/testing";

import { GENESIS_HASH } from "#node/constants/genesis-hash.constant";
import { verifyAuditProof } from "#node/functions/verify-audit-proof.function";

/** Three linked records from genesis, as bundle lines. */
async function chain(from = 1, previous = GENESIS_HASH) {
  const lines: { link: Record<string, unknown>; hash: string }[] = [];
  let previousHash = previous;
  for (let sequence = from; sequence < from + 3; sequence += 1) {
    const link = {
      sequence,
      previousHash,
      key: "orders.order.place",
      occurredAt: "2026-10-26T08:00:00.000Z",
    };
    const hash = await canonicalHash(link);
    lines.push({ link, hash });
    previousHash = hash;
  }
  return lines;
}

/** A signed checkpoint line at `sequence` over `hash`. */
async function checkpoint(signer: MemorySignerDriver, sequence: number, hash: string) {
  const body = { sequence, hash, takenAt: "2026-10-27T00:00:00.000Z" };
  return {
    checkpoint: body,
    signature: await signer.sign(new TextEncoder().encode(canonicalJson(body))),
  };
}

const jsonl = (values: readonly unknown[]) =>
  values.map((value) => JSON.stringify(value)).join("\n");

describe("verifyAuditProof", () => {
  it("holds for a chain from genesis with a signed checkpoint", async () => {
    const signer = await MemorySignerDriver.generate("audit-2026");
    const links = await chain();
    const text = jsonl([
      { key: await signer.publicKey() },
      ...links,
      await checkpoint(signer, 3, links[2]?.hash ?? ""),
    ]);
    const report = await verifyAuditProof(text, []);
    expect(report).toEqual({
      ok: true,
      links: 3,
      signedCheckpoints: 1,
      trustedKeys: false,
      brokenAt: null,
      problems: [],
    });
    expect((await verifyAuditProof(text, [await signer.publicKey()])).trustedKeys).toBe(true);
  });

  it("reports a changed link and a gap at their sequences", async () => {
    const links = await chain();
    const changed = [
      { ...links[0], link: { ...links[0]?.link, key: "orders.order.cancel" } },
      links[1],
      links[2],
    ];
    const report = await verifyAuditProof(jsonl(changed), []);
    expect(report.ok).toBe(false);
    expect(report.brokenAt).toBe(1);
    const gap = await verifyAuditProof(jsonl([links[0], links[2]]), []);
    expect(gap.problems).toEqual(["line 2: link 3 follows link 1"]);
    expect(gap.brokenAt).toBe(2);
  });

  it("refuses a checkpoint signed by a key the caller does not trust, or that disagrees with its link", async () => {
    const signer = await MemorySignerDriver.generate("audit-2026");
    const forger = await MemorySignerDriver.generate("audit-2026");
    const links = await chain();
    const forged = jsonl([...links, await checkpoint(forger, 3, links[2]?.hash ?? "")]);
    const report = await verifyAuditProof(forged, [await signer.publicKey()]);
    expect(report.problems).toEqual([
      "line 4: checkpoint 3 is not signed by a trusted key (audit-2026)",
    ]);
    const wrong = await verifyAuditProof(
      jsonl([...links, await checkpoint(signer, 2, "f".repeat(64))]),
      [await signer.publicKey()],
    );
    expect(wrong.problems).toEqual(["line 4: checkpoint 2 does not match link 2"]);
    expect(wrong.brokenAt).toBe(2);
  });

  it("anchors a bundle that starts mid-chain on a signed checkpoint, and refuses it without one", async () => {
    const signer = await MemorySignerDriver.generate("audit-2026");
    const anchor = "a".repeat(64);
    const links = await chain(11, anchor);
    const key = await signer.publicKey();
    expect(
      (await verifyAuditProof(jsonl([await checkpoint(signer, 10, anchor), ...links]), [key])).ok,
    ).toBe(true);
    expect((await verifyAuditProof(jsonl(links), [key])).problems).toEqual([
      "line 1: link 11 starts the bundle with no signed checkpoint at 10",
    ]);
  });

  it("reports junk lines without throwing", async () => {
    const report = await verifyAuditProof(
      'not json\n{"other":1}\n{"link":{"sequence":0},"hash":"x"}\n',
      [],
    );
    expect(report.problems).toEqual([
      "line 1: not JSON",
      "line 2: neither a key, a link nor a signed checkpoint",
      "line 3: a link needs a sequence, a previousHash and a hash",
    ]);
  });
});
