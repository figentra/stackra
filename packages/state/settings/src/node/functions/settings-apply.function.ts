/**
 * Stackra file contract:
 * Purpose: `settingsApply({ cwd, environment, scope, yaml, author, reason, market })`, the second half of the settings
 *          runner `stackra settings:apply` calls: makes the target sandbox node's own values of the pack's groups
 *          equal the pack, one applied revision per changed group, authored by `author`, and answers with the
 *          revision ids.
 * Boundary: a sandbox write: every revision is recorded in the sandbox environment, and live configuration changes
 *           only by promotion (ADR 0359 decision 3). Locks hold; floors hold: from `market`, the holder's resolved
 *           pack, when the CLI resolved it (`--market`), else through the fail-closed floor guard, which refuses a
 *           group with a legal floor. Entitlement-gated keys are refused here, since a run knows no plan. Whether
 *           the node is a sandbox is the operator's to name (`--scope`); tenancy owns that fact. One transaction: a
 *           refused group leaves nothing written.
 * Runtime: node
 * Governing contract: ADR 0213 (decision 4); ADR 0359 (decisions 3 and 11); ADR 0395 (decision 5); ADR 0419
 *                     (decision 2).
 */
import type { ScopeRef } from "@stackra/contracts";
import type { ResolvedPack } from "@stackra/market-packs";

import { SettingEnvironment } from "#contracts/index";
import { settingsPackFromYaml } from "#core/index";
import { openSettingsSession } from "#node/functions/open-settings-session.function";

/**
 * Applies a pack to a sandbox node.
 *
 * @throws ZodError when the text is not a settings pack.
 * @throws TypeError when the author is empty or a group's floors cannot be checked here.
 * @throws SettingsLockedError when a holder above the node locks a written path.
 * @example
 * const { revisions } = await settingsApply({ cwd, environment: "dev", scope, yaml, author: "usr_01j..." });
 */
export async function settingsApply(options: {
  readonly cwd: string;
  readonly environment: string;
  readonly scope: ScopeRef;
  readonly yaml: string;
  readonly author: string;
  readonly reason?: string;
  readonly market?: ResolvedPack;
}): Promise<{ readonly revisions: readonly string[] }> {
  if (options.author.trim() === "")
    throw new TypeError("A settings apply names its author, for the revision record");
  const pack = settingsPackFromYaml(options.yaml);
  return openSettingsSession(
    options.scope,
    async (packs) => {
      const revisions = await packs.applyPack({ scope: options.scope }, pack, {
        author: options.author,
        environment: SettingEnvironment.Sandbox,
        ...(options.reason === undefined ? {} : { reason: options.reason }),
      });
      return { revisions: revisions.map((revision) => revision.id) };
    },
    options.market,
  );
}
