/**
 * Stackra file contract:
 * Purpose: `planUpgradeCodemods(codemods, from, to, only)`, the codemods an upgrade from `from` to `to` runs: those
 *          whose release is after `from` and at or before `to`, oldest release first (the registry order breaks a tie),
 *          narrowed to `only` when given.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */
import { compareUpgradeVersions } from "#node/upgrade/functions/compare-upgrade-versions.function";
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/**
 * The codemods between two versions.
 *
 * @throws Error naming the known ids when `only` names a codemod that does not exist.
 * @example
 * planUpgradeCodemods(UPGRADE_CODEMODS, "0.29.0", "0.33.1").map((c) => c.id);
 * // ["actions-idempotency-complete-refused", "gen-area-routes", …]
 */
export function planUpgradeCodemods(
  codemods: readonly UpgradeCodemod[],
  from: string,
  to: string,
  only?: readonly string[],
): readonly UpgradeCodemod[] {
  const unknown = only?.find((id) => !codemods.some((codemod) => codemod.id === id));
  if (unknown !== undefined)
    throw new Error(
      `unknown codemod ${unknown}; codemods: ${codemods.map((codemod) => codemod.id).join(", ")}`,
    );
  return codemods
    .map((codemod, index) => ({ codemod, index }))
    .filter(
      ({ codemod }) =>
        compareUpgradeVersions(codemod.version, from) > 0 &&
        compareUpgradeVersions(codemod.version, to) <= 0 &&
        (only === undefined || only.includes(codemod.id)),
    )
    .toSorted(
      (a, b) => compareUpgradeVersions(a.codemod.version, b.codemod.version) || a.index - b.index,
    )
    .map(({ codemod }) => codemod);
}
