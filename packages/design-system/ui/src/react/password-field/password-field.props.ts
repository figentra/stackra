/**
 * Stackra file contract:
 * Purpose: `PasswordFieldProps`, the props of the web `PasswordField` in `password-field.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); gap inventory row 3.
 */
import type { PasswordFieldContractProps } from "#contracts/types/password-field-contract-props.type";
import type { InputGroupProps } from "#react/input-group/input-group.props";

/**
 * Props of the web PasswordField: the shared contract plus the web InputGroup's own props, passed through unchanged.
 * The field draws its own suffix and decides the input's type, so `type`, `prefix` and `suffix` are refused.
 */
export type PasswordFieldProps = PasswordFieldContractProps &
  Omit<InputGroupProps, keyof PasswordFieldContractProps | "type" | "prefix" | "suffix">;
