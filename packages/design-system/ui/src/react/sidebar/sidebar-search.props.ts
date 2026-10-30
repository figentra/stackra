/**
 * Stackra file contract:
 * Purpose: `SidebarSearchProps`, the props of the web `Sidebar.Search` in `sidebar-search.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); owner request 2026-10-29 (STA-1371).
 */
import type { SearchFieldProps } from "#react/search-field/search-field.props";

/**
 * Props of the web Sidebar.Search: a SearchField's props. Its text is the sidebar's filter (`useSidebar().query`)
 * unless `value` and `onChange` take it over; the spoken name defaults to the `ui` catalogue's "Filter navigation".
 */
export type SidebarSearchProps = SearchFieldProps;
