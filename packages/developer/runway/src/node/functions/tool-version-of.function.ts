/**
 * Stackra file contract:
 * Purpose: `toolVersionOf(repository, tool)`, the version a repository's `mise.toml` pins for one tool (`node`,
 *          `pnpm`), as written.
 * Boundary: reads `mise.toml` only, with a line match on `[tools]`-style `<tool> = "<version>"` entries; no TOML
 *           parser, since mise pins are flat strings. Answers `undefined` when the file or the entry is missing.
 * Runtime: node
 * Governing contract: ADR 0019 (decision 3: exact toolchain pins), ADR 0482; STA-1621 (eas-cli refuses a major alone).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The pinned version of `tool`.
 *
 * @example
 * toolVersionOf(".", "node"); // "24.22.0"
 */
export function toolVersionOf(repository: string, tool: string): string | undefined {
  const file = join(repository, "mise.toml");
  if (!existsSync(file)) return undefined;
  const pattern = new RegExp(`^${tool}\\s*=\\s*"([^"]+)"`, "m");
  return pattern.exec(readFileSync(file, "utf8"))?.[1];
}
