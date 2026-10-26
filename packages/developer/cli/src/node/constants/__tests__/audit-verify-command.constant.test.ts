/**
 * Stackra file contract:
 * Purpose: unit tests of `AUDIT_VERIFY_COMMAND`: a holding bundle exits 0 and says whether the keys were the caller's;
 *          a broken one exits 1 with its problems; a missing bundle or an unreadable key file is a usage error.
 * Boundary: test only; writes a throwaway bundle and key file in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0212 (decision 3); ADR 0416.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MemorySignerDriver } from "@stackra/contracts";
import { canonicalHash, canonicalJson } from "@stackra/support";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { AUDIT_VERIFY_COMMAND } from "#node/constants/audit-verify-command.constant";
import { GENESIS_HASH } from "#node/constants/genesis-hash.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import type { CliContext } from "#node/types/cli-context.type";

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

const run = (positionals: readonly string[], values: CliContext["values"] = {}) => {
  const { io, output } = captureIo();
  const code = AUDIT_VERIFY_COMMAND.run({
    cwd: root,
    io,
    values,
    positionals,
    rest: [],
    cli: async () => 0,
  });
  return { code, output };
};

describe("AUDIT_VERIFY_COMMAND", () => {
  it("passes a holding bundle against the caller's key", async () => {
    const { code, output } = run(["proof.jsonl"], { key: "key.json" });
    expect(await code).toBe(0);
    expect(output()).toContain("audit:verify proof.jsonl: 1 link, 1 signed checkpoint");
    expect(output()).toContain("the chain holds");
    expect(output()).not.toContain("pass --key");
  });

  it("fails a broken bundle and names where", async () => {
    const { code, output } = run(["broken.jsonl"]);
    expect(await code).toBe(1);
    expect(output()).toContain("link 1 does not hash to its hash");
    expect(output()).toContain("broken at 1");
  });

  it("refuses a missing bundle or an unreadable key file", async () => {
    await expect(run([]).code).rejects.toBeInstanceOf(CliUsageError);
    await expect(run(["proof.jsonl"], { key: "bad-key.json" }).code).rejects.toBeInstanceOf(
      CliUsageError,
    );
  });
});
