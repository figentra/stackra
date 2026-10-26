/**
 * Stackra file contract:
 * Purpose: the native `EmptyState` compound on HeroUI Native Pro's EmptyState (a placeholder for a list or screen
 *          with nothing in it): the root and the parts Header, Media, MediaBackground, Title, Description and Content,
 *          with HeroUI Native Pro's own names.
 * Boundary: no vocabulary prop applies, so every prop passes through unchanged: the media's look is its `variant`,
 *          and `Title` is already read as a header by screen readers. The compound exposes the parts of HeroUI Native
 *          Pro, its own components.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import { EmptyState as HeroEmptyState } from "heroui-native-pro/empty-state";
import type { ReactElement } from "react";
import type { EmptyStateProps } from "#native/empty-state/empty-state.props";

/** The root: HeroUI Native Pro's, a centred column that holds the placeholder. */
function EmptyStateRoot(props: EmptyStateProps): ReactElement {
  return <HeroEmptyState {...props} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface EmptyStateParts {
  /** The group of media, title and description. */
  readonly Header: typeof HeroEmptyState.Header;
  /** The icon or illustration, plain or on a round muted background by `variant`. */
  readonly Media: typeof HeroEmptyState.Media;
  /** A custom background layer for the media. */
  readonly MediaBackground: typeof HeroEmptyState.MediaBackground;
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
  MediaBackground: HeroEmptyState.MediaBackground,
  Title: HeroEmptyState.Title,
  Description: HeroEmptyState.Description,
  Content: HeroEmptyState.Content,
});
