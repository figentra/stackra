/**
 * Stackra file contract:
 * Purpose: `bumpStackraPins(text, format, to)`, a package.json's or a pnpm-workspace.yaml's text with every exact
 *          `@stackra/*` version (`0.30.1`, `^0.30.1`, `~0.30.1`, `=0.30.1`) moved to `to`, its prefix and quoting kept,
 *          and the pins it moved. Read alone (`to` undefined), it moves nothing and only lists the pins.
 * Boundary: pure text; every other byte is kept, so a file's layout and comments survive. A `workspace:`, `catalog:`,
 *           `npm:` or range specifier is not a pin and is left alone; so is `@stackra-pro/*`, which has its own line.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0177 (decision 5: one fixed `@stackra/*` version); STA-145.
 */
import type { BumpedPins } from "#node/upgrade/types/bumped-pins.type";
import type { PinChange } from "#node/upgrade/types/pin-change.type";

const VERSION = String.raw`\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?`;
const NAME = String.raw`@stackra\/[a-z0-9][a-z0-9._-]*`;
const JSON_PIN = new RegExp(String.raw`("(${NAME})"\s*:\s*")(=|\^|~)?(${VERSION})(")`, "g");
const YAML_PIN = new RegExp(
  String.raw`^(\s*(["']?)(${NAME})\2\s*:\s*(["']?))(=|\^|~)?(${VERSION})(\4)(?=\s*(?:#.*)?$)`,
  "gm",
);

/**
 * Move a file's `@stackra/*` pins to `to`.
 *
 * @param format - `json` for a package.json, `yaml` for pnpm-workspace.yaml.
 * @param to - the target version; undefined to only list the pins.
 * @example
 * bumpStackraPins('{ "@stackra/ui": "^0.30.1" }', "json", "0.33.1").text; // '{ "@stackra/ui": "^0.33.1" }'
 */
export function bumpStackraPins(
  text: string,
  format: "json" | "yaml",
  to: string | undefined,
): BumpedPins {
  const pins: PinChange[] = [];
  const pattern = format === "json" ? JSON_PIN : YAML_PIN;
  const next = text.replace(pattern, (...groups: string[]) => {
    const [whole = "", head = ""] = groups;
    const name = (format === "json" ? groups[2] : groups[3]) ?? "";
    const prefix = (format === "json" ? groups[3] : groups[5]) ?? "";
    const version = (format === "json" ? groups[4] : groups[6]) ?? "";
    const tail = (format === "json" ? groups[5] : groups[7]) ?? "";
    const target = to ?? version;
    pins.push({ name, from: `${prefix}${version}`, to: `${prefix}${target}` });
    return to === undefined ? whole : `${head}${prefix}${target}${tail}`;
  });
  return { text: next, pins };
}
