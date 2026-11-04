/**
 * Stackra file contract:
 * Purpose: `RunwayDriftCommand`, `runway drift [env]` (default production): reads each Cloudflare Worker's live
 *          settings and lists where they differ from what runway.yaml renders (`runRunwayDrift`). Drift is a finding,
 *          so it exits 1 when a Worker drifted and the nightly drift run fails.
 * Boundary: read-only Cloudflare API GETs with CLOUDFLARE_API_TOKEN_READ; never applies anything.
 * Runtime: node
 * Governing contract: ADR 0519; ADR 0506 (decision 8); STA-1992; STA-2100.
 */
import { Argument, Command, type CommandIo } from "@stackra/console";

import { repositoryRoot } from "#node/functions/repository-root.function";
import { runRunwayDrift } from "#node/functions/run-runway-drift.function";

/** Lists Worker settings drift. */
export class RunwayDriftCommand extends Command({
  name: "drift",
  description: "List where each Worker's live settings differ from runway.yaml (read-only)",
  examples: ["runway drift", "runway drift staging"],
}) {
  /** The environment whose Workers are read. */
  @Argument({
    description: "The environment (default production)",
    optional: true,
  })
  environment = "production";

  /**
   * Reads and resolves with 1 when a Worker drifted, else 0.
   *
   * @throws RunwayUnresolvedError without the read token.
   */
  async handle(io: CommandIo): Promise<number> {
    const drifted = await runRunwayDrift([this.environment], {
      root: repositoryRoot(io.cwd),
      log: (line) => io.output.line(line),
    });
    return drifted > 0 ? 1 : 0;
  }
}
