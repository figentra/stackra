/**
 * Stackra file contract:
 * Purpose: `TimelineHeroBlock`, the document side of the landing's timeline hero (`./react`'s `TimelineHero`): the
 *          headline, its lede and primary action, a route from origin to destination with its timed events, and an
 *          optional drawing.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The key is gen's `<member>.<snake(folder)>`, `experience.timeline_hero`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { Drawing } from "#core/types/drawing.type";
import type { LandingLink } from "#core/types/landing-link.type";
import type { TimelineRoute } from "#core/types/timeline-route.type";

/** The timeline hero a document places. */
export class TimelineHeroBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.timelineHero,
}) {
  title!: LocalizedText;

  lede!: LocalizedText;

  primary!: LandingLink;

  /** The route and its events, drawn at the inline end. */
  route!: TimelineRoute;

  /** A drawing under the actions (`/art/parcel`). */
  art?: Drawing;
}
