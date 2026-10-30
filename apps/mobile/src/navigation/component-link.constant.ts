/**
 * Stackra file contract:
 * Purpose: `COMPONENT_LINK`, the deep-link config of the one `Component` route: `c/<tier>/<slug>?tab=<DocTab>`, with
 *          the previous release's per-screen paths (`design-system/free/button`) kept as aliases for one release.
 * Boundary: the path config only, free of native modules so a test can read it; `linking.ts` mounts it.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.2 (zero link churn).
 */
import type { PathConfig } from "@react-navigation/native";
import { DocTab } from "@stackra/showcase";

import type { HomeStackParamList } from "./types";

/** The `Component` route's path, its aliases and the parse of `?tab=` (an unknown tab reads as none). */
export const COMPONENT_LINK: Exclude<
  NonNullable<PathConfig<HomeStackParamList>["screens"]>["Component"],
  string | undefined
> = {
  path: "c/:tier/:slug",
  alias: ["design-system/:tier/:slug"],
  parse: { tab: (value: string) => DocTab.find((tab) => tab === value) },
};
