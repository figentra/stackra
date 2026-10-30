/**
 * Stackra file contract:
 * Purpose: `ThumbnailProps`, the props of the web `Thumbnail` in `thumbnail.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 12.
 */
import type { ComponentPropsWithRef } from "react";
import type { ThumbnailContractProps } from "#contracts/types/thumbnail-contract-props.type";

/**
 * Props of the web Thumbnail: the shared contract plus the root `span`'s own props, passed through. The wrapper draws
 * the children and `alt` owns the accessible name, so `children`, `role`, `aria-label` and `aria-hidden` are refused.
 */
export type ThumbnailProps = ThumbnailContractProps &
  Omit<
    ComponentPropsWithRef<"span">,
    keyof ThumbnailContractProps | "children" | "role" | "aria-label" | "aria-hidden"
  >;
