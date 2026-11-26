/**
 * Stackra file contract:
 * Purpose: `EncorePrepareCommand`, `stackra encore:prepare`: in a service, pins `encore.dev` to the default catalog's
 *          version and writes tsconfig `paths` from package.json `imports` (removing a `baseUrl`, which TypeScript 7
 *          refuses), the two things Encore needs to build the app at the member root, laid out as the repository's
 *          formatter leaves them. The `--json` data is the files changed.
 * Boundary: writes the service's package.json and tsconfig.json only, and only when they change; run `pnpm install`
 *           after a pin change so the lockfile follows.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09).
 */
import { Command, type CommandIo } from "@stackra/console";

import { prepareEncoreService } from "#node/encore/functions/prepare-encore-service.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** Prepares a service for Encore. */
export class EncorePrepareCommand extends Command({
  name: "encore:prepare",
  description:
    "Pin encore.dev and write tsconfig paths from imports, so Encore builds this service",
  bin: true,
}) {
  /** Rewrites what is out of step; returns the files it changed. */
  handle(io: CommandIo): { readonly changed: readonly string[] } {
    const changed = prepareEncoreService(io.cwd, workspaceRoot(io.cwd));
    if (changed.length > 0) io.output.success(`wrote ${changed.join(", ")}`);
    else io.output.info("already prepared");
    return { changed };
  }
}
