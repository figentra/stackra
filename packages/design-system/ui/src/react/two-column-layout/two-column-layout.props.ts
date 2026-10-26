/**
 * Stackra file contract:
 * Purpose: `TwoColumnLayoutProps`, the props of the web `TwoColumnLayout` in `two-column-layout.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, decision 5: adapted
 *          form); ADR 0303 (decision 7); ADR 0317 (decisions 1 and 6); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.2 and
 *          1.4.10.
 */
import type { ComponentPropsWithRef } from "react";
import type { TwoColumnLayoutContractProps } from "#contracts/types/two-column-layout-contract-props.type";

/** Props of the web TwoColumnLayout: the shared contract plus the root `div`'s own props, passed through. */
export type TwoColumnLayoutProps = TwoColumnLayoutContractProps &
  Omit<ComponentPropsWithRef<"div">, keyof TwoColumnLayoutContractProps>;
