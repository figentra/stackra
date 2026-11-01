/**
 * Stackra file contract:
 * Purpose: `useTamo(scope)`, the Tamo slot a part may use where it sits: the slot when the AI module is installed and
 *          Tamo is on for the screen and field, else `null` (the part then draws no Tamo control).
 * Boundary: reads `TamoContext`; the on/off answer is the slot's (workspace, screen and field settings, ADR 0507 decision
 *           5). A part whose kind never gets AI (password, PIN, money…) does not call it.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (decisions 1, 3 and 5).
 */
import { useContext } from "react";

import type { TamoScope } from "#contracts/types/tamo-scope.type";
import type { TamoSlot } from "#contracts/types/tamo-slot.type";
import { TamoContext } from "#react/hooks/tamo-context";

/**
 * The slot, when Tamo is on here.
 *
 * @example
 * const tamo = useTamo({ field: name }, ai !== false);
 */
export function useTamo(scope: TamoScope = {}, isWanted = true): TamoSlot | null {
  const slot = useContext(TamoContext);
  return slot !== null && isWanted && slot.isEnabled(scope) ? slot : null;
}
