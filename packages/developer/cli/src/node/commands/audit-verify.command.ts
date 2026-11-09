/**
 * Stackra file contract:
 * Purpose: `AuditVerifyCommand`, `stackra audit:verify <bundle.jsonl> [--key <keys.json>]`: checks an audit proof
 *          bundle offline (hash chain, signed checkpoints) as a checklist, the chain, the keys and one failed row per
 *          problem (`--json`: the report), and exits 0 when it holds, 1 when it does not.
 * Boundary: reads two local files and nothing else: no network, no database, no service. `--key` names a JSON file
 *           holding one public key or a list of them (the tenant's or auditor's own copy); without it the bundle's
 *           own keys are used and the keys row warns that the check is not independent. Shows counts and problems
 *           only, never a record's content.
 * Runtime: node
 * Governing contract: ADR 0212 (decision 3: `stackra audit:verify` checks the chain); ADR 0416; ADR 0282 (decision
 *                     3); ADR 0506; STA-1966.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Argument, Command, Option, type CommandIo } from "@stackra/console";
import type { SignerPublicKey } from "@stackra/contracts";
import { Str } from "@stackra/validation";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { verifyAuditProof } from "#node/functions/verify-audit-proof.function";

/** `count` with its noun, plural unless one. */
const counted = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

/** Checks an audit proof bundle offline. */
export class AuditVerifyCommand extends Command({
  name: "audit:verify",
  description: "Check an audit proof bundle offline: hash chain and signed checkpoints",
  bin: true,
}) {
  /** The bundle file. */
  @Argument({ description: "The proof bundle, a JSONL file" })
  bundle!: string;

  /** The caller's own public keys. */
  @Option({
    description: "A JSON file of your own public key, or a list of them, to check against",
  })
  @Str
  key?: string;

  /** Checks the bundle; a failed row exits 1. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    let trusted: SignerPublicKey[] = [];
    if (this.key !== undefined) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(readFileSync(resolve(io.cwd, this.key), "utf8"));
      } catch {
        throw new CliUsageError(`--key ${this.key} is not a readable JSON file`);
      }
      trusted = (Array.isArray(parsed) ? parsed : [parsed]) as SignerPublicKey[];
      if (trusted.some((key) => typeof key?.keyId !== "string" || typeof key?.spki !== "string"))
        throw new CliUsageError(
          `--key ${this.key} holds no public key ({ keyId, algorithm, spki })`,
        );
    }
    const report = await verifyAuditProof(
      readFileSync(resolve(io.cwd, this.bundle), "utf8"),
      trusted,
    );
    const checked = `${counted(report.links, "link")}, ${counted(report.signedCheckpoints, "signed checkpoint")}`;
    io.output.checklist({
      title: `audit:verify ${this.bundle}`,
      rows: [
        report.ok
          ? { name: "the chain holds", status: "ok", detail: checked }
          : {
              name: "the chain is broken",
              status: "fail",
              detail: `${checked}${report.brokenAt === null ? "" : `; broken at ${report.brokenAt}`}`,
            },
        report.trustedKeys
          ? { name: "signatures checked against your keys", status: "ok" }
          : {
              name: "signatures checked against the keys in the bundle",
              status: "warn",
              detail: "not an independent check",
              fix: `stackra audit:verify ${this.bundle} --key <keys.json>`,
            },
        ...report.problems.map((problem) => ({ name: problem, status: "fail" as const })),
      ],
    });
    return report;
  }
}
