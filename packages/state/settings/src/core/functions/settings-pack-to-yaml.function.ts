/**
 * Stackra file contract:
 * Purpose: `settingsPackToYaml`, the YAML export of a settings pack: the file a product seed ships and
 *          `settings:diff` reads.
 * Boundary: pure; groups and paths are written sorted, so the same pack always gives the same file.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 4: YAML export replaces JSON).
 */
import { stringify } from "yaml";

import type { SettingsPack } from "#contracts/index";

/**
 * The pack as YAML.
 *
 * @example
 * await writeFile("seed/commerce.settings.yaml", settingsPackToYaml(pack));
 */
export function settingsPackToYaml(pack: SettingsPack): string {
  return stringify(pack, { sortMapEntries: true });
}
