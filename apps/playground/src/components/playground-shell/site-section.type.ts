/**
 * Stackra file contract:
 * Purpose: `SiteSection`, a part of the site the top bar names: a top bar link id (Components, Theme Studio, Docs).
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5).
 */
import type { SITE_LINKS } from "./site-links.constant";

/** A top bar link id, which is also the site section it stands for. */
export type SiteSection = (typeof SITE_LINKS)[number]["id"];
