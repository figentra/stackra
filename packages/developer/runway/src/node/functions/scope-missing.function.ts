/**
 * Stackra file contract:
 * Purpose: `scopeMissing({ cwd, scope, dir })`, the names check every decrypt of a product scope runs first (STA-258):
 *          when `scope` is `products/<project>/<dev|staging|production>` and the repository the job checked out names
 *          that `project`, it runs `envMissing` for each of its runway environments whose secrets live in that scope,
 *          on the ciphertext file names the action downloaded, so a deploy whose scope lacks a required secret fails
 *          before anything is decrypted, synced or shipped, with no input to opt in.
 * Boundary: names only; decrypts nothing. Answers null, and checks nothing, for any other scope (`agents`, `ci/...`),
 *           outside a repository (no `pnpm-workspace.yaml` above `cwd`), without a root `runway.yaml`, or when the
 *           root names another project: those jobs decrypt a scope that is not the checked-out product's. CI only,
 *           like `envMissing`.
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0371 (amendment 2026-11-27); STA-258.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { deployPlan } from "#node/functions/deploy-plan.function";
import { envMissing } from "#node/functions/env-missing.function";
import { readRunways } from "#node/functions/read-runways.function";
import { repositoryRoot } from "#node/functions/repository-root.function";
import type { EnvFinding } from "#node/types/env-finding.type";

/** A product environment's scope (ADR 0525). */
const PRODUCT_SCOPE = /^products\/([a-z0-9-]+)\/(?:dev|staging|production)$/;

/** The repository root above `cwd`, or null when there is none. */
function rootOf(cwd: string): string | null {
  try {
    return repositoryRoot(cwd);
  } catch {
    return null;
  }
}

/**
 * The checked-out product's missing secrets for `scope`, or null when the scope is not its environment scope.
 *
 * @param input.dir - the folder holding `<scope>/<NAME>.enc.yaml`.
 * @param input.ci - a test's answer to "is this a proved CI job"; by default the GitHub OIDC token answers it.
 * @throws RunwayUnresolvedError as `envMissing` does: outside CI, or when the scope's ciphertext is not under `dir`.
 * @example
 * const check = await scopeMissing({ cwd: process.cwd(), scope: "products/acme/staging", dir: ".secrets" });
 * check?.findings.filter((finding) => finding.level === "error");
 */
export async function scopeMissing(input: {
  readonly cwd: string;
  readonly scope: string;
  readonly dir: string;
  readonly ci?: boolean | undefined;
}): Promise<{ readonly environments: readonly string[]; readonly findings: EnvFinding[] } | null> {
  const project = PRODUCT_SCOPE.exec(input.scope)?.[1];
  if (project === undefined) return null;
  const root = rootOf(input.cwd);
  if (root === null || !existsSync(join(root, "runway.yaml"))) return null;
  const runways = readRunways(root);
  if (runways.root.project !== project) return null;
  // dev and preview share the dev scope (ADR 0525): every environment of this scope is checked.
  const environments = Object.keys(runways.root.environments ?? {}).filter(
    (environment) => deployPlan(environment, runways).secretScope === input.scope,
  );
  const seen = new Set<string>();
  const findings: EnvFinding[] = [];
  for (const environment of environments)
    for (const finding of await envMissing({ root, environment, dir: input.dir, ci: input.ci })) {
      const key = `${finding.level} ${finding.name} ${finding.where}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push(finding);
    }
  return {
    environments,
    findings: [
      ...findings.filter((finding) => finding.level === "error"),
      ...findings.filter((finding) => finding.level === "warning"),
    ],
  };
}
