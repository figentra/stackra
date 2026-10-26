/**
 * Stackra file contract:
 * Purpose: `FieldErrorProps`, the props of the web `FieldError` in `field-error.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI v3
 *          on web); ADR 0055 (forms); ADR 0303.
 */
import type { FieldErrorRootProps } from "@heroui/react";
import type { FieldErrorContractProps } from "#contracts/types/field-error-contract-props.type";

/** Props of the web FieldError: the shared contract plus HeroUI v3's own props, passed through unchanged. */
export type FieldErrorProps = FieldErrorContractProps &
  Omit<FieldErrorRootProps, keyof FieldErrorContractProps>;
