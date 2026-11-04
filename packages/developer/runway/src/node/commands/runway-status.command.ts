/**
 * Stackra file contract:
 * Purpose: `RunwayStatusCommand`, `runway status [environment]` (ADR 0352): what each GitHub environment the
 *          repository deploys through runs now, read from GitHub's deployment records: the commit, when, and the
 *          latest state. The environments are the runway environments plus `providers.github.environments`; a name
 *          narrows the list to one. Each row is the `--json` data.
 * Boundary: read-only `gh api` GETs with the person's own login (or the job's token); changes nothing.
 * Runtime: node
 * Governing contract: ADR 0352; ADR 0170 (GitHub records every deployment); ADR 0506 (decision 8); STA-2100.
 */
import { execFileSync } from "node:child_process";

import { Enum } from "@stackra/contracts";
import { Argument, Command, type CommandIo } from "@stackra/console";

import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { readRunways } from "#node/functions/read-runways.function";
import { repositoryRoot } from "#node/functions/repository-root.function";

/** One GitHub deployment as the API returns it, only the fields read. */
type Deployment = { readonly id: number; readonly sha: string; readonly created_at: string };

/** Shows what each environment runs. */
export class RunwayStatusCommand extends Command({
  name: "status",
  description: "Show what each GitHub environment runs, from GitHub's deployment records",
  examples: ["runway status", "runway status production --json"],
}) {
  /** One environment to show. */
  @Argument({
    description: "A runway or GitHub environment (default all)",
    optional: true,
  })
  environment?: string;

  /** A `gh api` GET of `path`, parsed; a test replaces it. */
  api: (path: string) => unknown = (path) =>
    JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8" }));

  /** Reads and returns one row per environment. */
  handle(io: CommandIo): readonly Record<string, string>[] {
    const { root } = readRunways(repositoryRoot(io.cwd));
    const { org, repo } = root.providers.github;
    const names = [
      ...new Set([
        ...Enum.values(RunwayEnvironment).map(String),
        ...Object.keys(
          (root.providers.github as { environments?: Record<string, unknown> }).environments ?? {},
        ),
      ]),
    ].filter((name) => this.environment === undefined || name === this.environment);
    const rows = names.map((name) => {
      const [latest] = this.api(
        `repos/${org}/${repo}/deployments?environment=${encodeURIComponent(name)}&per_page=1`,
      ) as readonly Deployment[];
      if (latest === undefined) return { environment: name, commit: "-", at: "-", state: "none" };
      const [status] = this.api(
        `repos/${org}/${repo}/deployments/${latest.id}/statuses?per_page=1`,
      ) as readonly { readonly state: string }[];
      return {
        environment: name,
        commit: latest.sha.slice(0, 12),
        at: latest.created_at,
        state: status?.state ?? "pending",
      };
    });
    io.output.table({
      columns: [
        { header: "Environment", key: "environment" },
        { header: "Commit", key: "commit" },
        { header: "Deployed", key: "at" },
        { header: "State", key: "state" },
      ],
      rows,
    });
    return rows;
  }
}
