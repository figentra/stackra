/**
 * Stackra file contract:
 * Purpose: public surface of the sidebar component folder: the component and its Props only.
 * Boundary: re-exports only.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14).
 */
export { Sidebar } from "./sidebar";
export { type SidebarProps } from "./sidebar.props";
