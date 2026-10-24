/**
 * Stackra file contract:
 * Purpose: the one prop every shell region takes to be a named landmark: `label`. Sidebar and NavigationList are a
 *          `nav`, AppHeader a `banner`, PageHeader a header and Section a `region`, and a page that repeats a
 *          landmark must tell the copies apart for a screen reader's landmark list.
 * Boundary: types only. The element and its role are the component's own choice; this is only the name.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7: `label` is a string where it names something);
 *          ADR 0317; WCAG 2.2 SC 1.3.1 and the ARIA landmark practices.
 */

/** Props shared by every region the shell draws as a landmark. */
export interface LandmarkContractProps {
  /** The spoken name of the region, for example "Main navigation"; required when the page holds two of its kind. */
  readonly label?: string | undefined;
}
