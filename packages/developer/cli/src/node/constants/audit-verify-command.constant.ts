/**
 * Stackra file contract:
 * Purpose: `AUDIT_VERIFY_COMMAND`, `stackra audit:verify <bundle.jsonl> [--key <keys.json>]`: checks an audit proof
 *          bundle offline (hash chain, signed checkpoints) and exits 0 when it holds, 1 when it does not.
 * Boundary: reads two local files and nothing else: no network, no database, no service. `--key` names a JSON file
 *           holding one public key or a list of them (the tenant's or auditor's own copy); without it the bundle's
 *           own keys are used and the output says the check is not independent. Prints counts and problems only,
 *           never a record's content.
 * Runtime: node
 * Governing contract: ADR 0212 (decision 3: `stackra audit:verify` checks the chain); ADR 0416; ADR 0282 (decision 3).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { SignerPublicKey } from "@stackra/contracts";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { verifyAuditProof } from "#node/functions/verify-audit-proof.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra audit:verify` command. */
export const AUDIT_VERIFY_COMMAND: CliCommand = {
  name: "audit:verify",
  summary: "Check an audit proof bundle offline: hash chain and signed checkpoints",
  usage: "stackra audit:verify <bundle.jsonl> [--key <keys.json>]",
  options: { key: { type: "string" } },
  positionals: true,
  async run({ cwd, positionals, values, io }) {
    const [file, ...extra] = positionals;
    if (file === undefined)
      throw new CliUsageError("name the bundle: stackra audit:verify <bundle.jsonl>");
    if (extra.length > 0) throw new CliUsageError(`unexpected argument: ${extra[0]}`);
    let trusted: SignerPublicKey[] = [];
    if (typeof values["key"] === "string") {
      let parsed: unknown;
      try {
        parsed = JSON.parse(readFileSync(resolve(cwd, values["key"]), "utf8"));
      } catch {
        throw new CliUsageError(`--key ${values["key"]} is not a readable JSON file`);
      }
      trusted = (Array.isArray(parsed) ? parsed : [parsed]) as SignerPublicKey[];
      if (trusted.some((key) => typeof key?.keyId !== "string" || typeof key?.spki !== "string"))
        throw new CliUsageError(
          `--key ${values["key"]} holds no public key ({ keyId, algorithm, spki })`,
        );
    }
    const report = await verifyAuditProof(readFileSync(resolve(cwd, file), "utf8"), trusted);
    io.out(
      `audit:verify ${file}: ${report.links} link${report.links === 1 ? "" : "s"}, ` +
        `${report.signedCheckpoints} signed checkpoint${report.signedCheckpoints === 1 ? "" : "s"}\n`,
    );
    if (!report.trustedKeys)
      io.out(
        "  signatures checked against the keys in the bundle; pass --key to check against your own\n",
      );
    for (const problem of report.problems) io.err(`  ${problem}\n`);
    if (report.ok) {
      io.out("  the chain holds\n");
      return 0;
    }
    io.err(`  broken${report.brokenAt === null ? "" : ` at ${report.brokenAt}`}\n`);
    return 1;
  },
};
