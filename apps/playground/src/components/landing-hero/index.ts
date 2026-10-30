/**
 * Stackra file contract:
 * Purpose: public surface of the landing-hero component folder: the rotating hero, the ways in the heroes share, the
 *          hook and the Display menu's pick.
 * Boundary: re-exports only.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14).
 */
export { LandingHero } from "./landing-hero";
export { HeroActions } from "./hero-actions";
export { type HeroActionsProps } from "./hero-actions.props";
export { useVisitHero } from "./use-visit-hero";
export { chooseHero } from "./choose-hero.function";
