/**
 * Stackra file contract:
 * Purpose: `SingleColumnLayoutProps`, the props of the web `SingleColumnLayout` in `single-column-layout.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, decision 5: adapted
 *          form); ADR 0303 (decision 7); ADR 0317 (decision 7); WCAG 2.2 SC 1.4.10.
 */
import type { ComponentPropsWithRef } from "react";
import type { SingleColumnLayoutContractProps } from "#contracts/types/single-column-layout-contract-props.type";

/** Props of the web SingleColumnLayout: the shared contract plus the `div`'s own props, passed through. */
export type SingleColumnLayoutProps = SingleColumnLayoutContractProps &
  Omit<ComponentPropsWithRef<"div">, keyof SingleColumnLayoutContractProps>;
