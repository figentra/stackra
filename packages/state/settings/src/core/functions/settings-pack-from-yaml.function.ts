/**
 * Stackra file contract:
 * Purpose: `settingsPackFromYaml`, the YAML import of a settings pack: parses the text and checks it with
 *          `SettingsPack$`.
 * Boundary: the text is untrusted input; anything that is not a pack throws, so nothing half-read is applied. YAML
 *           aliases are capped to refuse a billion-laughs file.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 4).
 */
import { parse } from "yaml";

import type { SettingsPack } from "#contracts/index";
import { SETTINGS_PACK_SCHEMA } from "#core/constants/settings-pack-schema.constant";

/**
 * The pack in `text`.
 *
 * @throws ZodError when the text is not a settings pack; a YAML syntax error when it is not YAML.
 * @example
 * const pack = settingsPackFromYaml(await readFile("seed/commerce.settings.yaml", "utf8"));
 */
export function settingsPackFromYaml(text: string): SettingsPack {
  return SETTINGS_PACK_SCHEMA.parse(parse(text, { maxAliasCount: 100 }));
}
