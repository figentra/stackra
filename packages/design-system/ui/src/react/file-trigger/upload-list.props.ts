/**
 * Stackra file contract:
 * Purpose: `UploadListProps`, the props of the web `UploadList` in `upload-list.tsx`, the FileTrigger's companion.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 6.
 */
import type { ComponentPropsWithRef } from "react";
import type { UploadListContractProps } from "#contracts/types/upload-list-contract-props.type";

/**
 * Props of the web UploadList: the shared contract plus the root `ul`'s own props, passed through. The wrapper draws
 * the rows and `label` names the list, so `children` and `aria-label` are refused.
 */
export type UploadListProps = UploadListContractProps &
  Omit<ComponentPropsWithRef<"ul">, keyof UploadListContractProps | "children" | "aria-label">;
