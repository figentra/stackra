/**
 * Stackra file contract:
 * Purpose: `SettingLevel`, the key of a level a setting may be held at: a `SettingScope` code, a level another package
 *          contributes as data (tenancy's level), or a level the deployment declares in its scope
 *          configuration.
 * Boundary: a type only, the level's key as text. Levels are deployment data (ADR 0327 d2), so the list is open: this
 *           package names no level another package owns (ADR 0323 d4), and gen checks a key against the levels the
 *           build declares.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 2); ADR 0323 (decision 4); ADR 0307 (rule 22: the scopes).
 */

/**
 * One level key, snake_case.
 *
 * @example
 * const scopes: readonly SettingLevel[] = [SettingScope.Platform, "store"];
 */
export type SettingLevel = string;
