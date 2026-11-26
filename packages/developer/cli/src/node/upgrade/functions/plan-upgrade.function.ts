/**
 * Stackra file contract:
 * Purpose: `planUpgrade(root, options)`, an upgrade of the workspace at `root` before anything is written: the version
 *          it is on (`from`, else its oldest `@stackra/*` pin), the target, the codemods between them, the edits that
 *          move every pin to the target, and the service folders.
 * Boundary: reads the pin files and the members' package.json files; writes nothing. Refuses, never guesses: no pin
 *           and no `from`, a version that is not exact, or a pin newer than the target (an upgrade never moves a pin
 *           back).
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0177 (decision 5); STA-145.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { UPGRADE_VERSION_PATTERN } from "#node/upgrade/constants/upgrade-version-pattern.constant";
import { bumpStackraPins } from "#node/upgrade/functions/bump-stackra-pins.function";
import { compareUpgradeVersions } from "#node/upgrade/functions/compare-upgrade-versions.function";
import { listUpgradeServices } from "#node/upgrade/functions/list-upgrade-services.function";
import { planUpgradeCodemods } from "#node/upgrade/functions/plan-upgrade-codemods.function";
import { readStackraPins } from "#node/upgrade/functions/read-stackra-pins.function";
import { stackraPinFiles } from "#node/upgrade/functions/stackra-pin-files.function";
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";
import type { UpgradeFileEdit } from "#node/upgrade/types/upgrade-file-edit.type";
import type { UpgradePlan } from "#node/upgrade/types/upgrade-plan.type";

/**
 * Plan an upgrade.
 *
 * @param options - `to` the target version; `from` the version to start from instead of the oldest pin; `only` the
 *                  codemod ids to keep; `codemods` the registry (`UPGRADE_CODEMODS`).
 * @throws Error with a sentence a person can act on when the upgrade cannot be planned.
 * @example
 * planUpgrade("/repo", { to: "0.33.1", codemods: UPGRADE_CODEMODS }).from; // "0.30.1"
 */
export function planUpgrade(
  root: string,
  options: {
    readonly to: string;
    readonly from?: string;
    readonly only?: readonly string[];
    readonly codemods: readonly UpgradeCodemod[];
  },
): UpgradePlan {
  const { to } = options;
  for (const [flag, version] of [
    ["--to", to],
    ["--from", options.from],
  ] as const)
    if (version !== undefined && !UPGRADE_VERSION_PATTERN.test(version))
      throw new Error(`${flag} must be an exact version such as 0.33.1, not ${version}`);
  const pins = readStackraPins(root);
  const newer = pins.find((pin) => compareUpgradeVersions(pin.version, to) > 0);
  if (newer !== undefined)
    throw new Error(
      `${newer.file} pins ${newer.name} ${newer.version}, newer than ${to}: stackra upgrade never moves a pin back; run the newer CLI (pnpm dlx @stackra/cli@${newer.version} upgrade) or pass --to`,
    );
  const oldest = pins
    .map((pin) => pin.version)
    .toSorted(compareUpgradeVersions)
    .at(0);
  const from = options.from ?? oldest;
  if (from === undefined)
    throw new Error(
      "no @stackra/* version is pinned in this workspace (package.json or pnpm-workspace.yaml): pass --from",
    );
  if (compareUpgradeVersions(from, to) > 0)
    throw new Error(`--from ${from} is newer than the target ${to}`);
  const manifests: UpgradeFileEdit[] = [];
  for (const file of stackraPinFiles(root)) {
    const before = readFileSync(join(root, file), "utf8");
    const after = bumpStackraPins(before, file.endsWith(".yaml") ? "yaml" : "json", to).text;
    if (after !== before) manifests.push({ file, before, after, by: ["versions"] });
  }
  return {
    from,
    to,
    codemods: planUpgradeCodemods(options.codemods, from, to, options.only),
    manifests,
    services: listUpgradeServices(root),
  };
}
