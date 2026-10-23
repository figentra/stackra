/**
 * Stackra file contract:
 * Purpose: the pixel size of each icon size, the same on web and native: `sm` 16, `md` 20, `lg` 24, the sizes HeroUI
 *          v3 gives icons inside small and default buttons (size-4, size-5) and Lucide's own 24.
 * Boundary: data only; `Icon` and the components that hold icons read it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 3); ADR 0165 (UI contract).
 */
import type { Size } from "#contracts/enums/size.enum";

/** The width and height in pixels of an icon of each size. */
export const ICON_SIZES = Object.freeze({ sm: 16, md: 20, lg: 24 } as const satisfies Record<
  Size,
  number
>);
