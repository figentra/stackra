/**
 * Stackra file contract:
 * Purpose: the props every runtime's `CursorPagination` takes: whether a next and a previous page exist, the handlers
 *          that move to them, the `pager` or `load-more` form, how many items are shown and the spoken names of its
 *          parts. It matches the server's cursor pages (`nextCursor`, `hasMore`): there is no page number and no total,
 *          so it never says "page 3 of 9". Each runtime's `CursorPaginationProps` is this plus its own base props.
 * Boundary: types only. The component holds no cursor: the app keeps the cursor history that makes `hasPrevious`
 *           true, and fetches when `onNext` or `onPrevious` is called.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (decision 4: two paging words); WCAG 2.2
 *          SC 4.1.3 (status messages).
 */
import type { Size } from "#contracts/enums/size.enum";

/** Props shared by the web and native `CursorPagination`. */
export interface CursorPaginationContractProps {
  /** Whether the server has a page after this one: its `hasMore`. Without it the next button is disabled. */
  readonly hasMore: boolean;
  /** Whether an earlier page exists, which the app knows from its cursor history. Defaults to false. */
  readonly hasPrevious?: boolean | undefined;
  /** Called when the user asks for the next page (the `pager` form) or for more items (the `load-more` form). */
  readonly onNext?: (() => void) | undefined;
  /** Called when the user asks for the previous page; the `load-more` form has no previous button. */
  readonly onPrevious?: (() => void) | undefined;
  /** `pager` shows previous and next; `load-more` shows one button that adds the next page. Defaults to `pager`. */
  readonly mode?: "pager" | "load-more" | undefined;
  /** How many items are shown now, never a total: it is announced politely when it changes. Left out, no count shows. */
  readonly count?: number | undefined;
  /** True while a page loads: the button that was pressed shows a spinner and presses are refused. */
  readonly isLoading?: boolean | undefined;
  /** The height and text size of the buttons. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** The spoken name of the pagination landmark. Defaults to an English phrase until i18n ships. */
  readonly label?: string | undefined;
  /** The text of the previous button. Defaults to an English word until i18n ships. */
  readonly previousLabel?: string | undefined;
  /** The text of the next button. Defaults to an English word until i18n ships. */
  readonly nextLabel?: string | undefined;
  /** The text of the load-more button. Defaults to an English phrase until i18n ships. */
  readonly loadMoreLabel?: string | undefined;
  /** Writes the count as a sentence, for example "Showing 20 orders". Defaults to an English phrase. */
  readonly countLabel?: ((count: number) => string) | undefined;
}
