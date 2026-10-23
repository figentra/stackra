/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Badge.Anchor` takes: the element a badge is pinned to, followed by the badge.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0304.
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `Badge.Anchor`. */
export interface BadgeAnchorContractProps {
  /** The anchored element first (an avatar, an icon button), then the `Badge`, which is drawn on top of it. */
  readonly children: ReactNode;
}
