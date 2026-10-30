/**
 * Stackra file contract:
 * Purpose: `TreeViewProps`, the props of the web `TreeView` in `tree-view.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (React
 *          Aria on web); design-system gap inventory (2026-10-28) row 22.
 */
import type { TreeProps } from "react-aria-components";

import type { TreeViewContractProps } from "#contracts/types/tree-view-contract-props.type";

/**
 * Props of the web TreeView: the shared contract plus React Aria's `Tree` props, passed through to the root. The
 * tree draws its own rows from `items`, so children are refused, `label` owns the accessible name, and the class is
 * a plain string.
 */
export type TreeViewProps = TreeViewContractProps &
  Omit<
    TreeProps<object>,
    keyof TreeViewContractProps | "children" | "aria-label" | "className" | "disabledKeys"
  > & {
    /** Classes added to the tree's root. */
    readonly className?: string | undefined;
  };
