/**
 * Stackra file contract:
 * Purpose: `SignatureFieldProps`, props of the web SignatureField.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); WCAG 2.2 SC 2.1.1, 2.5.7 and 3.3.2.
 */
import type { SignatureFieldContractProps } from "#contracts/types/signature-field-contract-props.type";

/** Props of the web SignatureField. */
export type SignatureFieldProps = SignatureFieldContractProps;
