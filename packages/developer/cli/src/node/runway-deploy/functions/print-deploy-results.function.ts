/**
 * Stackra file contract:
 * Purpose: `printDeployResults(io, results)`, the one line per target `stackra deploy` and `stackra promote` print
 *          after shipping: target, short commit, health status and the provider's reference when it has one.
 * Boundary: prints only.
 * Runtime: node
 * Governing contract: ADR 0352 (decision 3); STA-607.
 */
import type { DeployResult } from "@stackra/runway";

import type { CliIo } from "#node/types/cli-io.type";

/**
 * Prints each shipped target.
 *
 * @example
 * printDeployResults(io, await deploy(root, environment, sha, providers));
 */
export function printDeployResults(io: CliIo, results: readonly DeployResult[]): void {
  for (const { record, report } of results)
    io.out(
      `${record.target} ${record.sha.slice(0, 12)} ${report.status}${record.reference === "" ? "" : ` (${record.reference})`}\n`,
    );
}
