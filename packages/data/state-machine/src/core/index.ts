/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/state-machine, which has several public files, until `stackra
 *          gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `StateMachineBase` is exported as a type only, so a declaration
 *           can name it while no class extends it bare. The shipped `StateTransitioned` schema stays internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { StateMachine } from "#core/bases/state-machine.base";
export type { StateMachineBase } from "#core/bases/state-machine.base";
export { Transition } from "#core/decorators/transition.decorator";
export { TransitionNotAllowedError } from "#core/errors/transition-not-allowed.error";
export { StateTransitioned } from "#core/events/state-transitioned.event";
export type { StateField } from "#core/types/state-field.type";
export type { StateMachineOptions } from "#core/types/state-machine-options.type";
export type { TransitionName } from "#core/types/transition-name.type";
export type { TransitionOptions } from "#core/types/transition-options.type";
