/**
 * Stackra file contract:
 * Purpose: `LandingHero`, the showcase home's hero: the one `heroChoice` picked for this launch ("stack", "storm" or
 *          "mirror"), switched live by the Display menu or a `stackra://?hero=<id>` link.
 * Boundary: a lookup from the hero's id to its component; it draws nothing when no hero is running.
 * Runtime: react-native
 * Governing contract: owner decision 2026-10-28 (rotating landing heroes); STA-1371.
 */
import type { HEROES } from "#src/constants/heroes.constant";
import { useHeroChoice } from "#src/stores/use-hero-choice";

import type { HeroProps } from "./hero.props";
import { MirrorHero } from "./mirror-hero";
import { StackHero } from "./stack-hero";
import { StormHero } from "./storm-hero";

/** Each hero's component, by its id. */
const HERO_COMPONENTS: Record<
  (typeof HEROES)[number]["id"],
  (props: HeroProps) => React.JSX.Element | null
> = {
  stack: StackHero,
  storm: StormHero,
  mirror: MirrorHero,
};

/** The landing hero of this launch. */
export function LandingHero(props: HeroProps) {
  const id = useHeroChoice();
  const Hero = id === undefined ? undefined : HERO_COMPONENTS[id as keyof typeof HERO_COMPONENTS];
  return Hero ? <Hero key={id} {...props} /> : null;
}
