/**
 * Stackra file contract:
 * Purpose: `InlineLoadingProps`, the props of the web `InlineLoading` in `inline-loading.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 28.
 */
import type { ComponentPropsWithoutRef } from "react";
import type { InlineLoadingContractProps } from "#contracts/types/inline-loading-contract-props.type";

/**
 * Props of the web InlineLoading: the shared contract plus the props of a `span`, passed through unchanged. The
 * component draws its own children and owns the live region, so `children` and `role` are refused.
 */
export type InlineLoadingProps = InlineLoadingContractProps &
  Omit<ComponentPropsWithoutRef<"span">, keyof InlineLoadingContractProps | "children" | "role">;
