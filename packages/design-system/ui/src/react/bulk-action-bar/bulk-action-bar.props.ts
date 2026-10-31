/**
 * Stackra file contract:
 * Purpose: `BulkActionBarProps`, the props of the web `BulkActionBar` in `bulk-action-bar.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (UI
 *          contract, HeroUI v3 on web); ADR 0303 (decision 7); ADR 0318 (decisions 4 to 6); ADR 0139 (action UX); WCAG
 *          2.2 SC 2.4.3, 2.5.3, 2.5.8, 4.1.2, 4.1.3; owner decision 6 of STA-350 (thin wrappers).
 */
import type { ComponentPropsWithoutRef } from "react";
import type { BulkActionBarContractProps } from "#contracts/types/bulk-action-bar-contract-props.type";

/**
 * Props of the web BulkActionBar: the shared contract plus the attributes of its root `div`, passed through. The
 * bar's own children are the actions, so the type refuses them.
 */
export type BulkActionBarProps = BulkActionBarContractProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof BulkActionBarContractProps | "children"> & {
    /**
     * `inline` (the default) sits above the list it acts on; `floating` is a pill fixed to the foot of the content
     * column on the overlay surface, taking no room, so nothing shifts as rows are picked (ADR 0501).
     */
    readonly variant?: "inline" | "floating" | undefined;
  };
