/**
 * Stackra file contract:
 * Purpose: `TextShimmerProps`, props of the web TextShimmer: the shared contract plus HeroUI Pro's own and the span's,
 *          passed through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { TextShimmerProps as HeroTextShimmerProps } from "@heroui-pro/react/text-shimmer";
import type { JSX } from "react";

import type { TextShimmerContractProps } from "#contracts/types/text-shimmer-contract-props.type";

/** Props of the web TextShimmer: the shared contract plus HeroUI Pro's own and the span's, passed through. */
export type TextShimmerProps = TextShimmerContractProps &
  Omit<
    HeroTextShimmerProps<"span"> & JSX.IntrinsicElements["span"],
    keyof TextShimmerContractProps
  >;
