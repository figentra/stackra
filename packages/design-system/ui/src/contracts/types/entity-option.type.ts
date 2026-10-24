/**
 * Stackra file contract:
 * Purpose: one record an EntityPicker can pick: its key, the text that names it, an optional second line and an
 *          optional avatar (an image, a name for initials, or an icon), and whether it can be picked at all. The picker
 *          holds whole options, not bare keys, so a chosen record keeps its label when the list no longer holds it.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0318 (wave 7 vocabulary).
 */
import type { IconName } from "@stackra/icons/contracts";

/** One record of an EntityPicker. */
export interface EntityOption {
  /** The record's key, which a form submits; unique within the picker. */
  readonly id: string;
  /** The text that names the record, shown in the list and in its tag; it is also its accessible name. */
  readonly label: string;
  /** A second, muted line under the label in the list, for example an email address or a code. */
  readonly description?: string | undefined;
  /** The picture drawn before the label: an image, initials from a name, or an icon; all are decorative. */
  readonly avatar?:
    | {
        /** The image URL; the initials or the icon show while it loads or when it fails. */
        readonly src?: string | undefined;
        /** A person's or organisation's name, whose initials are drawn when there is no image. */
        readonly name?: string | undefined;
        /** An icon drawn when there is no image and no name, for a record that is a thing, not a person. */
        readonly icon?: IconName | undefined;
      }
    | undefined;
  /** True to show the record but refuse it. */
  readonly isDisabled?: boolean | undefined;
}
