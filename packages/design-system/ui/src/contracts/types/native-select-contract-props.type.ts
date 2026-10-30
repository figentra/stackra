/**
 * Stackra file contract:
 * Purpose: the props every runtime's `NativeSelect` takes: the Select contract, drawn with the platform's own picker
 *          (an HTML `select` on the web, the action sheet on iOS, the platform menu elsewhere).
 * Boundary: types only; the same props as Select, so a form swaps one for the other.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055.
 */
import type { SelectContractProps } from "#contracts/types/select-contract-props.type";

/** Props shared by the web and native `NativeSelect`. */
export type NativeSelectContractProps = SelectContractProps;
