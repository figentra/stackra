/**
 * Stackra file contract:
 * Purpose: unit tests of `AuditVerifyCommand` on the console: a holding bundle exits 0 and says whether the keys were
 *          the caller's (the bundle's own keys only warn); a broken one exits 1 with its problems and the report as
 *          the `--json` data; a missing bundle or an unreadable key file exits 2.
 * Boundary: test only; writes a throwaway bundle and key file in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0212 (decision 3); ADR 0416; ADR 0506; STA-1966.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { MemorySignerDriver } from "@stackra/contracts";
import { canonicalHash, canonicalJson } from "@stackra/support";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { AuditVerifyCommand } from "#node/commands/audit-verify.command";
import { GENESIS_HASH } from "#node/constants/genesis-hash.constant";

let root: string;

beforeEach(async () => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-audit-"));
  const signer = await MemorySignerDriver.generate("audit-2026");
  const link = { sequence: 1, previousHash: GENESIS_HASH, key: "orders.order.place" };
  const hash = await canonicalHash(link);
  const body = { sequence: 1, hash, takenAt: "2026-10-27T00:00:00.000Z" };
  const signature = await signer.sign(new TextEncoder().encode(canonicalJson(body)));
  writeFileSync(
    join(root, "proof.jsonl"),
    [
      { link, hash },
      { checkpoint: body, signature },
    ]
      .map((line) => JSON.stringify(line))
      .join("\n"),
  );
  writeFileSync(join(root, "broken.jsonl"), JSON.stringify({ link: { ...link, key: "x" }, hash }));
  writeFileSync(join(root, "key.json"), JSON.stringify(await signer.publicKey()));
  writeFileSync(join(root, "bad-key.json"), "{");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const run = (argv: readonly string[]) =>
  runCommandForTest([AuditVerifyCommand], ["audit:verify", ...argv], { cwd: root, columns: 120 });

describe("AuditVerifyCommand", () => {
  it("passes a holding bundle against the caller's key", async () => {
    const result = await run(["proof.jsonl", "--key", "key.json"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("1 link, 1 signed checkpoint");
    expect(result.stdout).toContain("the chain holds");
    expect(result.stdout).toContain("signatures checked against your keys");
  });

  it("warns, without failing, when only the bundle's own keys were used", async () => {
    const result = await run(["proof.jsonl"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout + result.stderr).toContain("--key <keys.json>");
  });

  it("fails a broken bundle with exit 1, naming where, and returns the report under --json", async () => {
    const result = await run(["broken.jsonl"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout + result.stderr).toContain("link 1 does not hash to its hash");
    expect(result.stdout + result.stderr).toContain("broken at 1");
    const json = await run(["broken.jsonl", "--json"]);
    expect(json.exitCode).toBe(1);
    expect(json.json).toMatchObject({ ok: false, data: { ok: false, brokenAt: 1 } });
  });

  it("refuses a missing bundle or an unreadable key file with exit 2", async () => {
    expect((await run([])).exitCode).toBe(2);
    expect((await run(["proof.jsonl", "--key", "bad-key.json"])).exitCode).toBe(2);
  });
});
