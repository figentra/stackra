/**
 * Stackra file contract:
 * Purpose: one label and value pair of a `PropertyList`: the row's `id`, the label that names it, the value, and, for
 *          a value people copy (an id, an email address), the name of its copy button and the text it copies.
 * Boundary: types only. A row is copyable only when it has a `copyLabel` and a text to copy, because the copy button is
 *           a control and a control needs a name; the text is `copyValue`, or the value itself when that is a string or
 *           a number.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (decisions 1 and 7); WCAG 2.2 SC 1.3.1
 *          and 4.1.2.
 */
import type { ReactNode } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";

/** One row of a PropertyList on web and native. */
export interface PropertyListItem extends CollectionItem {
  /** What the value is, for example "Customer"; a string, because it names the value for assistive technology. */
  readonly label: string;
  /** The value. A missing, empty or `false` value shows the list's `emptyValue` instead; `0` is a value. */
  readonly value?: ReactNode;
  /** The accessible name of the row's copy button, in the app's language, for example "Copy order id". Without it the row has no copy button. */
  readonly copyLabel?: string | undefined;
  /** The text the copy button copies, when it differs from the shown value or the value is not text. */
  readonly copyValue?: string | undefined;
}
