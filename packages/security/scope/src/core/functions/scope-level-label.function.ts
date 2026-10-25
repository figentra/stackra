/**
 * Stackra file contract:
 * Purpose: `scopeLevelLabel(config, level)`, the lang key a screen shows for a level: the deployment's alias when it
 *          gave the level one (an organisation shown for a nested level), else the package's own `scope::levels.<key>`.
 * Boundary: pure; returns a lang key, never text, so each locale has its own label (ADR 0327 d4). A level a deployment
 *           added without an alias has no entry in this package's catalogues; the deployment gives it an alias.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 4); naming rule (namespace lookups `<module>::<path>`).
 */
import type { ScopeConfig } from "#config/scope.config";

/**
 * The lang key of `level`'s display name.
 *
 * @example
 * scopeLevelLabel(config, "product"); // "scope::levels.product", or the deployment's alias
 */
export function scopeLevelLabel(config: Pick<ScopeConfig, "aliases">, level: string): string {
  return config.aliases[level] ?? `scope::levels.${level}`;
}
