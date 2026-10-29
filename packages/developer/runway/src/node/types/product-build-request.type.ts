/**
 * Stackra file contract:
 * Purpose: `ProductBuildRequest`, one build of a product with no app members: the repository, the registry scope its
 *          lines come from (or a local OS checkout), the environment whose EAS profile the mobile apps build on, the
 *          commit, the surface bundler and whether it is a dry run.
 * Boundary: type only; `buildProduct` takes it.
 * Runtime: node
 * Governing contract: ADR 0436; ADR 0439; ADR 0441 (decision 3); ADR 0481.
 */
import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { SurfaceBundler } from "#node/types/surface-bundler.type";

/** One product build. */
export type ProductBuildRequest = {
  /** The product repository's root folder. */
  readonly repository: string;
  /** The npm scope the lines are published under (`@figentra`). */
  readonly scope: string;
  /** A local checkout of the `os` lines' repository: an `os/<name>@<major>` line is `<os>/apps/<name>`. */
  readonly os?: string;
  /** The environment the mobile builds are for; `production` when absent. */
  readonly environment?: RunwayEnvironment;
  /** The commit being built; `git rev-parse HEAD` in the repository when absent. */
  readonly sha?: string;
  /** Builds each surface bundle; required unless `dryRun`. */
  readonly bundle?: SurfaceBundler;
  /** Build the web surfaces only: the mobile apps are listed as skipped (a dev or preview build). */
  readonly surfacesOnly?: boolean;
  /** Plan the bundles and record the EAS builds instead of starting them; local outputs are still written. */
  readonly dryRun?: boolean;
  /** The command runner; `runCommand` when absent. */
  readonly run?: CommandRunner;
};
