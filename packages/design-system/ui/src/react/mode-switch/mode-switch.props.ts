/**
 * Stackra file contract:
 * Purpose: `ModeSwitchProps`, the props of the web `ModeSwitch` in `mode-switch.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0359 (decisions 1 and 2); ADR 0302
 *          (decision 3).
 */
import type { ModeSwitchContractProps } from "#contracts/types/mode-switch-contract-props.type";

/** Props of the web ModeSwitch. */
export type ModeSwitchProps = ModeSwitchContractProps;
