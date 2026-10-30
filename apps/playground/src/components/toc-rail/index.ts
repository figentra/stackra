/**
 * Stackra file contract:
 * Purpose: public surface of the toc-rail component folder: the rail, its Props, the row type and the two pieces the
 *          narrow section tabs share (the items function and the scroll spy).
 * Boundary: re-exports only.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14).
 */
export { TocRail } from "./toc-rail";
export { type TocRailProps } from "./toc-rail.props";
export { type TocItem } from "./toc-item.type";
export { tocItems } from "./toc-items.function";
export { useActiveSection } from "./use-active-section";
export { scrollToSection } from "./scroll-to-section.function";
export { activeSectionIndex } from "./active-section-index.function";
