/**
 * Stackra file contract:
 * Purpose: `SkeletonProps`, the props of the web `Skeleton` in `skeleton.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (UI
 *          contract, HeroUI v3 on web); ADR 0304; owner decision 6 of STA-350 (thin wrappers).
 */
import type { SkeletonRootProps } from "@heroui/react";
import type { ComponentPropsWithRef } from "react";
import type { SkeletonContractProps } from "#contracts/types/skeleton-contract-props.type";

/** HeroUI's props for a `div` skeleton: its own props plus the `div` attributes, as its generic signature spreads them. */
type HeroSkeletonProps = SkeletonRootProps<"div"> &
  Omit<ComponentPropsWithRef<"div">, keyof SkeletonRootProps<"div">>;

/** Props of the web Skeleton: the shared contract plus HeroUI v3's own skeleton props, passed through unchanged. */
export type SkeletonProps = SkeletonContractProps &
  Omit<HeroSkeletonProps, keyof SkeletonContractProps>;
