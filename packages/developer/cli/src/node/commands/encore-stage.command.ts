/**
 * Stackra file contract:
 * Purpose: `EncoreStageCommand`, `stackra encore:stage`: in a repository whose services form one Encore app, writes the
 *          staging copy at `.stackra/encore-app/` that Encore builds (`encore build docker` or a deploy, run in that
 *          folder). The `--json` data is what was staged.
 * Boundary: replaces `.stackra/encore-app/` whole; reads every member but writes nothing outside the folder. Run it after
 *           `stackra gen` in each service. A `#` specifier no `imports` map resolves fails the command, naming the file
 *           and the specifier, since Encore would refuse the build on it anyway.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09: multi-service apps, option b).
 */
import { Command, CommandError, type CommandIo } from "@stackra/console";

import { stageEncoreApp } from "#node/encore/functions/stage-encore-app.function";
import type { StagedEncoreApp } from "#node/encore/types/staged-encore-app.type";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** Stages the repository's services as one Encore app. */
export class EncoreStageCommand extends Command({
  name: "encore:stage",
  description:
    "Copy the services and their workspace packages into .stackra/encore-app, imports made relative, for Encore to build",
  bin: true,
}) {
  /**
   * Writes the staging copy; returns what was staged.
   *
   * @throws CommandError when a `#` specifier stays unresolved.
   */
  handle(io: CommandIo): StagedEncoreApp {
    const staged = stageEncoreApp(workspaceRoot(io.cwd));
    if (staged.unresolved.length > 0)
      throw new CommandError(
        `${staged.unresolved.length} # import(s) resolve through no imports map: ${staged.unresolved
          .slice(0, 5)
          .map(({ file, specifier }) => `${specifier} in ${file}`)
          .join(", ")}`,
        { fix: "add the specifier's prefix to the member's package.json imports" },
      );
    io.output.success(
      `staged ${staged.services.length} service(s) and ${staged.packages.length} package(s) in ${staged.out}; ${staged.rewritten} file(s) rewritten`,
    );
    return staged;
  }
}
