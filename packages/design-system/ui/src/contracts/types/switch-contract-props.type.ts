/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Switch` takes: the shared field props for a boolean, where `value` is whether
 *          the switch is on. Each runtime's `SwitchProps` is this plus its HeroUI switch's own props, which pass
 *          through unchanged.
 * Boundary: types only; the switch has no variant of its own on either runtime.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0055 (forms).
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `Switch`: a field that edits whether a setting is on. */
export type SwitchContractProps = FieldContractProps<boolean>;
