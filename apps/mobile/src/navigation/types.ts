/**
 * Stackra file contract:
 * Purpose: `HomeStackParamList`, the Home stack's route names and params, and the global `ReactNavigation`
 *          augmentation from `RootStackParamList`; the other navigators' lists sit beside it, one per file.
 * Boundary: types only, plus the global augmentation; it declares no navigator.
 * Runtime: isomorphic
 * Governing contract: ADR 0007 (documentation); showcase redesign spec (2026-10-27) section 2.2.
 */
import type { MobileComponentParams } from "@stackra/showcase";

import type { RootStackParamList } from "./root-stack-param-list.type";

/**
 * The routes of the Home tab's stack and their params, declared once. A screen's `route.params` and every
 * `navigate()` are typed from here.
 */
export type HomeStackParamList = {
  /**
   * The Home screen (the showcase home in development builds, the welcome in release); deep link `stackra://`, and
   * `stackra://hero/<id>` (or `stackra://design-system?hero=<id>`) shows that landing hero.
   */
  Home: { hero?: string } | undefined;
  /**
   * The one component screen (development builds), by tier and slug; deep link `stackra://c/<tier>/<slug>?tab=api`.
   * Sibling hops set the params; they never replace the screen.
   */
  Component: MobileComponentParams;
};

declare global {
  namespace ReactNavigation {
    // oxlint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type -- reason: React Navigation's global param list is typed by merging this interface
    interface RootParamList extends RootStackParamList {}
  }
}
