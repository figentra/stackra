/**
 * Stackra file contract:
 * Purpose: the web `TextShimmer` on HeroUI Pro's TextShimmer: text with a moving highlight, for "thinking" and other
 *          in-progress labels. The span props and HeroUI Pro's `render` prop pass through.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. HeroUI Pro's component is
 *          generic over the element it draws (`span` by default); the wrapper fixes it to the default. Imports the
 *          `text-shimmer` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import { TextShimmer as HeroTextShimmer } from "@heroui-pro/react/text-shimmer";

import type { TextShimmerProps } from "#react/text-shimmer/text-shimmer.props";

/** Text with a moving highlight. */
export function TextShimmer(props: TextShimmerProps) {
  return <HeroTextShimmer {...props} />;
}
