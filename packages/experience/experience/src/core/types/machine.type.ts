/**
 * Stackra file contract:
 * Purpose: `Machine`, the hero's machine: its spoken name, and the action window piped into one frame per surface.
 * Boundary: a type only, the field type of `HeroMachineBlock`. The pipes are drawn by the component from this order,
 *           never given.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import type { MachineAction } from "#core/types/machine-action.type";
import type { Surface } from "#core/types/surface.type";

/** The action and its surfaces. */
export interface Machine {
  /** The group's spoken name ("One action, every surface"); the action's file name is only its window's title. */
  readonly label: LocalizedText;

  /** The action window at the top of the machine. */
  readonly action: MachineAction;

  /** The surfaces the action is piped into, one frame each, in order. */
  readonly surfaces: Surface[];
}
