/**
 * Stackra file contract:
 * Purpose: `contractFindings(root, base, options)`, the HTTP contract check of `stackra contract`: every member that
 *          had a contract at `base` (`memberContracts`) is compared with `oasdiff breaking`, and each error-level break
 *          not excused by an unexpired entry of `tools/contract/accepted-breaks.yaml` is a finding named by the member
 *          folder (`POST /invoices: API path removed without deprecation [api-path-removed-without-deprecation]`).
 *          Warnings and information never fail. A malformed accepted-breaks entry or an unreadable manifest is a
 *          finding too. A member whose projection did not change starts no `oasdiff`.
 * Boundary: reads the workspace and git (through `memberContracts`) and the accepted-breaks file; starts `oasdiff` per
 *           changed member, one at a time; writes nothing in the workspace.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: `oasdiff` contract checks); ADR 0158; STA-2837.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { ACCEPTED_BREAKS_FILE } from "#node/contract/constants/accepted-breaks-file.constant";
import { loadAcceptedBreaks } from "#node/contract/functions/load-accepted-breaks.function";
import { memberContracts } from "#node/contract/functions/member-contracts.function";
import { oasdiffBreaks } from "#node/contract/functions/oasdiff-breaks.function";
import type { DirFinding } from "#node/types/dir-finding.type";

/** The `oasdiff` level of a breaking change that fails the check. */
const ERROR_LEVEL = 3;

/**
 * The contract findings of the workspace at `root` against the commit `base`.
 *
 * @param root - the workspace root.
 * @param base - the commit to compare with.
 * @param options - `oasdiff` names the binary; `today` (`YYYY-MM-DD`) is the date accepted breaks expire against.
 * @throws Error when git cannot read `base` or `oasdiff` cannot run.
 * @example
 * await contractFindings("/repo", "4f2a91c", { today: "2026-11-26" });
 * // [{ dir: "services/billing", text: "DELETE /invoices/{invoiceId}: API removed without deprecation [api-removed-without-deprecation]" }]
 */
export async function contractFindings(
  root: string,
  base: string,
  options: { readonly oasdiff?: string; readonly today: string },
): Promise<DirFinding[]> {
  const file = join(root, ACCEPTED_BREAKS_FILE);
  const accepted = loadAcceptedBreaks(
    existsSync(file) ? readFileSync(file, "utf8") : "",
    options.today,
  );
  const findings: DirFinding[] = accepted.problems.map((text) => ({
    dir: ACCEPTED_BREAKS_FILE,
    text,
  }));
  const { contracts, problems } = memberContracts(root, base);
  findings.push(...problems);
  for (const { dir, base: before, next } of contracts) {
    if (JSON.stringify(before) === JSON.stringify(next)) continue;
    for (const change of await oasdiffBreaks(before, next, options.oasdiff)) {
      if (change.level < ERROR_LEVEL) continue;
      const operation = `${change.operation} ${change.path}`;
      const entry = accepted.entries.find(
        (candidate) =>
          candidate.member === dir &&
          candidate.operation === operation &&
          candidate.id === change.id,
      );
      if (entry !== undefined && !entry.expired) continue;
      findings.push({
        dir,
        text: `${operation}: ${change.text} [${change.id}]${
          entry === undefined ? "" : ` (its accepted break expired on ${entry.expires})`
        }`,
      });
    }
  }
  return findings;
}
