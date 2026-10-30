/**
 * Stackra file contract:
 * Purpose: public surface of the category-shelf component folder: the component and its Props only.
 * Boundary: re-exports only.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14).
 */
export { CategoryShelf } from "./category-shelf";
export { type CategoryShelfProps } from "./category-shelf.props";
