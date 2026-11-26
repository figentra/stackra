/**
 * Stackra file contract:
 * Purpose: `upgradeStepRuns(codemods, services)`, the commands an upgrade runs after it wrote its edits, in order:
 *          `pnpm install` (always, so a re-run after a failed step installs what the first run's pins asked for), each
 *          codemod step in each of its folders (a command asked for by
 *          two codemods in one folder runs once), then `stackra gen`, which regenerates what the new versions write.
 * Boundary: pure; `UpgradeCommand` runs them, or prints them under `--no-install`.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";
import type { UpgradeStepRun } from "#node/upgrade/types/upgrade-step-run.type";

/**
 * The runs of one upgrade.
 *
 * @param services - the service folders, relative to the root (`listUpgradeServices`).
 * @example
 * upgradeStepRuns([SERVICES_ENCORE_APP_ROOT_CODEMOD], ["services/orders"]).map((run) => run.command.join(" "));
 * // ["pnpm install", "pnpm exec stackra encore:prepare", "pnpm exec stackra gen"]
 */
export function upgradeStepRuns(
  codemods: readonly UpgradeCodemod[],
  services: readonly string[],
): readonly UpgradeStepRun[] {
  const runs: { command: readonly string[]; cwd: string; why: string[] }[] = [
    { command: ["pnpm", "install"], cwd: ".", why: ["install"] },
  ];
  for (const codemod of codemods)
    for (const step of codemod.steps ?? [])
      for (const cwd of step.in === "root" ? ["."] : services) {
        const command = ["pnpm", "exec", ...step.command];
        const same = runs.find(
          (run) => run.cwd === cwd && run.command.join("\0") === command.join("\0"),
        );
        if (same === undefined) runs.push({ command, cwd, why: [codemod.id] });
        else if (!same.why.includes(codemod.id)) same.why.push(codemod.id);
      }
  runs.push({ command: ["pnpm", "exec", "stackra", "gen"], cwd: ".", why: ["gen"] });
  return runs;
}
