/**
 * Stackra file contract:
 * Purpose: `TamoContext`, where the AI module puts the `TamoSlot` the components' Tamo parts read.
 * Boundary: the context only, in the shared React layer so web and native read the same one. Empty (`null`) when no AI
 *           module is installed: then no Tamo part draws.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (decision 3: @stackra/ui stays AI-free); ADR 0004 §1.
 */
import { createContext } from "react";

import type { TamoSlot } from "#contracts/types/tamo-slot.type";

/** The Tamo slot of the tree, or `null` with no AI module. */
export const TamoContext = createContext<TamoSlot | null>(null);
