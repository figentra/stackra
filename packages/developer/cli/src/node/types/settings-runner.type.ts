/**
 * Stackra file contract:
 * Purpose: `SettingsRunner`, what `stackra settings:diff` and `settings:apply` call in the member's
 *          `@stackra/settings/node`: `settingsDiff` answers the change rows a YAML pack would make at a scope node,
 *          and `settingsApply` makes that node's own values equal the pack and answers the revision ids.
 * Boundary: type only. The CLI declares the shape it needs and imports the module from the member at run time, as it
 *           does for the database runner; it never parses a pack or reads a database itself.
 * Runtime: node
 * Governing contract: ADR 0213 (decision 4: `settings:diff` and `settings:apply`); ADR 0395 (decision 5); ADR 0282
 *                     (decision 3).
 */

/** A scope node: its public id and its `ltree` path. */
type ScopeNode = { readonly id: string; readonly path: string };

/** One row of a settings diff. */
type SettingsDiffRow = {
  readonly group: string;
  readonly path: string;
  readonly before?: unknown;
  readonly after?: unknown;
  readonly lockedBefore: boolean;
  readonly lockedAfter: boolean;
};

/** The settings runner of one member. */
export type SettingsRunner = {
  /** The change rows applying `yaml` at `scope` would make. */
  readonly settingsDiff: (options: {
    readonly cwd: string;
    readonly environment: string;
    readonly scope: ScopeNode;
    readonly yaml: string;
  }) => Promise<readonly SettingsDiffRow[]>;

  /** Applies `yaml` at the sandbox node `scope`; resolves with the ids of the revisions recorded. */
  readonly settingsApply: (options: {
    readonly cwd: string;
    readonly environment: string;
    readonly scope: ScopeNode;
    readonly yaml: string;
    readonly author: string;
    readonly reason?: string;
  }) => Promise<{ readonly revisions: readonly string[] }>;
};
