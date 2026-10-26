/**
 * Stackra file contract:
 * Purpose: `settingsDiff({ cwd, environment, scope, yaml })`, the first half of the settings runner `stackra
 *          settings:diff` calls: what applying the YAML pack at the target node would change, row by row, against the
 *          node's own values of the pack's groups.
 * Boundary: reads only; never writes. The pack text is untrusted and parsed before anything is read. Only the node's
 *           own holder is compared, never inherited values. `cwd` and `environment` name the member and the runway
 *           environment for the CLI's report; the connection is the member's `DATABASE_URL`.
 * Runtime: node
 * Governing contract: ADR 0213 (decision 4); ADR 0280 (decision 4: a reviewed diff); ADR 0395 (decision 5).
 */
import type { ScopeRef } from "@stackra/contracts";

import { diffSettingsPacks, settingsPackFromYaml } from "#core/index";
import type { SettingsChange } from "#core/index";
import { openSettingsSession } from "#node/functions/open-settings-session.function";

/**
 * The diff of a pack against a node.
 *
 * @throws ZodError when the text is not a settings pack.
 * @throws Error when `DATABASE_URL` is not set.
 * @example
 * const rows = await settingsDiff({ cwd, environment: "dev", scope, yaml });
 */
export async function settingsDiff(options: {
  readonly cwd: string;
  readonly environment: string;
  readonly scope: ScopeRef;
  readonly yaml: string;
}): Promise<readonly SettingsChange[]> {
  const pack = settingsPackFromYaml(options.yaml);
  return openSettingsSession(options.scope, async (packs) =>
    diffSettingsPacks(
      await packs.exportPack({ scope: options.scope }, Object.keys(pack.groups)),
      pack,
    ),
  );
}
