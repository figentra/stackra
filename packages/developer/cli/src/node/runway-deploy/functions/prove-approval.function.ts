/**
 * Stackra file contract:
 * Purpose: `proveApproval(root, environment)`, whether `environment` declares an approval (`deploy.approval`) and,
 *          when it does, the proof that this run sits behind it: the job's GitHub OIDC token, signed by GitHub, for
 *          the repository and that environment (or a reviewed GitHub environment), through `proveGithubJob`. The
 *          `--approved` flag the deploy and promote commands still parse proves nothing (STA-2099 item 4).
 * Boundary: reads no flag and no `GITHUB_ACTIONS`; a refusal is a usage error (exit 2) that names what is missing.
 * Runtime: node
 * Governing contract: ADR 0468; ADR 0523 (no self-asserted trust); STA-2100.
 */
import type { RootRunway, RunwayEnvironment } from "@stackra/runway";
import { proveGithubJob } from "@stackra/runway/node";

import { CliUsageError } from "#node/errors/cli-usage.error";

/**
 * Proves the approval `environment` declares; resolves `false` when it declares none.
 *
 * @param root - the root runway.
 * @param environment - the runway environment the run ships to.
 * @param verb - what the run does to it, for the refusal (`deploys`, `is promoted`).
 * @throws CliUsageError when the environment declares an approval and the job's OIDC token does not prove it.
 * @example
 * await proveApproval(root, "production", "deploys"); // throws on a workstation
 */
export async function proveApproval(
  root: RootRunway,
  environment: string,
  verb: string,
): Promise<boolean> {
  const approval = root.environments?.[environment as RunwayEnvironment]?.deploy?.approval;
  if (approval === undefined) return false;
  try {
    await proveGithubJob({ github: root.providers?.github, environment });
  } catch (error) {
    throw new CliUsageError(
      `${environment} ${verb} only after its approval (${approval}): ${(error as Error).message}`,
    );
  }
  return true;
}
