/**
 * Stackra file contract:
 * Purpose: `loadSettingsRunner(cwd)`, the member's settings runner: `settingsDiff` and `settingsApply` from its own
 *          `@stackra/settings/node`, imported dynamically from the member's folder.
 * Boundary: resolves from `cwd`, so the member's installed version runs; the CLI bundles no settings code. Fails with
 *           a message that names the fix when the member has no `@stackra/settings` or its entry has no runner.
 * Runtime: node
 * Governing contract: ADR 0213 (decision 4); ADR 0395 (decision 5); ADR 0282 (decision 3).
 */
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { SettingsRunner } from "#node/types/settings-runner.type";

/**
 * Loads the settings runner from the member at `cwd`.
 *
 * @param cwd - the member root.
 * @throws Error when the member cannot resolve `@stackra/settings/node` or it exports no settingsDiff and settingsApply.
 * @example
 * const runner = await loadSettingsRunner("/repo/services/commerce");
 */
export async function loadSettingsRunner(cwd: string): Promise<SettingsRunner> {
  let file: string;
  try {
    file = createRequire(join(cwd, "package.json")).resolve("@stackra/settings/node");
  } catch {
    throw new Error(
      `${cwd} does not resolve @stackra/settings/node: add @stackra/settings to its dependencies`,
    );
  }
  const loaded = (await import(pathToFileURL(file).href)) as Partial<SettingsRunner>;
  if (typeof loaded.settingsDiff !== "function" || typeof loaded.settingsApply !== "function")
    throw new Error(
      "@stackra/settings/node exports no settingsDiff and settingsApply: update @stackra/settings",
    );
  return { settingsDiff: loaded.settingsDiff, settingsApply: loaded.settingsApply };
}
