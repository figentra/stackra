/**
 * Stackra file contract:
 * Purpose: `TimelineHeroProps`, the props of `TimelineHero`.
 * Boundary: a type only; every word arrives resolved in the page's locale.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 2: Props in `<name>.props.ts`); ADR 0504; STA-2041.
 */
import type { TimelineRoute } from "#core/types/timeline-route.type";

/**
 * The headline and its action beside a route's timeline.
 *
 * @example
 * <TimelineHero title="Every carrier. One status." lede={lede} primary={start} route={parcel} art={drawing} />
 */
export interface TimelineHeroProps {
  /** The page's one `h1`, and the section's spoken name. */
  readonly title: string;
  /** The line under the title. */
  readonly lede: string;
  /** The one primary action, drawn as the champagne pill. */
  readonly primary: { readonly label: string; readonly href: string };
  /** The route from origin to destination and its events, oldest first; the last is marked current. */
  readonly route: TimelineRoute<string>;
  /**
   * A drawing under the actions, drawn by `Illustration`: the base URL of its tone layers, its viewBox size and
   * `alt`, without which it is decorative. Never mirrored in right-to-left.
   */
  readonly art?:
    | {
        readonly src: string;
        readonly width: number;
        readonly height: number;
        readonly alt?: string | undefined;
      }
    | undefined;
  /** Styles the section. */
  readonly className?: string | undefined;
}
