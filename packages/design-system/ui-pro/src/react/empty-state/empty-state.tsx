/**
 * Stackra file contract:
 * Purpose: the web `EmptyState` compound on HeroUI Pro's EmptyState (a placeholder for a list or page with nothing
 *          in it): the root and the parts Header, Media, Title, Description and Content, with HeroUI Pro's own names.
 * Boundary: no vocabulary prop needs a mapping, so every prop passes through unchanged: the root already names its
 *          size `size` and the media its look `variant`. The compound exposes the documented parts: HeroUI Pro's
 *          `EmptyState.Root` is left out. Imports the `empty-state` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import { EmptyState as HeroEmptyState } from "@heroui-pro/react/empty-state";

import type { EmptyStateProps } from "#react/empty-state/empty-state.props";

/** The root: HeroUI Pro's, a centred column that holds the placeholder. */
function EmptyStateRoot(props: EmptyStateProps) {
  return <HeroEmptyState.Root {...props} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface EmptyStateParts {
  /** The group of media, title and description. */
  readonly Header: typeof HeroEmptyState.Header;
  /** The icon or illustration, plain or on a round muted background by `variant`. */
  readonly Media: typeof HeroEmptyState.Media;
  /** The heading. */
  readonly Title: typeof HeroEmptyState.Title;
  /** The supporting text. */
  readonly Description: typeof HeroEmptyState.Description;
  /** The area for actions, such as a button. */
  readonly Content: typeof HeroEmptyState.Content;
}

/** A placeholder for nothing to show: `EmptyState.Header` holds `Media`, `Title` and `Description`, then `Content`. */
export const EmptyState: typeof EmptyStateRoot & EmptyStateParts = Object.assign(EmptyStateRoot, {
  Header: HeroEmptyState.Header,
  Media: HeroEmptyState.Media,
  Title: HeroEmptyState.Title,
  Description: HeroEmptyState.Description,
  Content: HeroEmptyState.Content,
});
