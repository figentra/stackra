/**
 * Stackra file contract:
 * Purpose: `SEARCH_DIALOG_TEMPLATE`, the `app/components/search.tsx` of a generated Fumadocs site: the search dialog
 *          over the static index the browser downloads from `/api/search`.
 * Boundary: a constant.
 * Runtime: isomorphic
 * Governing contract: ADR 0514; STA-2026 (research R6: built-in static search, no third party).
 */

/** The emitted `app/components/search.tsx`. */
export const SEARCH_DIALOG_TEMPLATE = `import { useStaticSearch } from "fumadocs-core/search/client";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";

export default function StaticSearchDialog(props: SharedProps) {
  const search = useStaticSearch({});
  return (
    <SearchDialog {...search} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList />
      </SearchDialogContent>
    </SearchDialog>
  );
}
`;
