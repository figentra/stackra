/**
 * Stackra file contract:
 * Purpose: `Machine`, the hero's machine: the action window, piped into one frame per surface.
 * Boundary: a shape class only, the field type of `HeroMachineBlock`; gen compiles it with the block. The pipes are
 *           drawn by the component from this order, never given.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0305 (one declaration per file); STA-2041.
 */
import { Schema } from "@stackra/validation";

import type { MachineAction } from "#core/schemas/machine-action.schema";
import type { Surface } from "#core/schemas/surface.schema";

/** The action and its surfaces. */
export class Machine extends Schema {
  action!: MachineAction;

  surfaces!: Surface[];
}
