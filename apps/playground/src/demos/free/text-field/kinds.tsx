/**
 * Stackra file contract:
 * Purpose: the "kinds" demo of the web Text field: The kind sets the input type on web and the keyboard, masking and
 *          capitalisation on native.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { TextFieldType } from "@stackra/ui/contracts";
import { TextField as UiTextField, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_FIELD_KEYS } from "#src/demos/free/text-field/text-field-keys.constant";

/** The demo's keys. */
const K = TEXT_FIELD_KEYS.text_field;

/** The grid that lays fields out in columns that wrap. */
const GRID = "grid gap-4 sm:grid-cols-2";

/** Text field: Kinds of text. */
export default function Kinds() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={GRID}>
      {TextFieldType.map((kind) => (
        <UiTextField key={kind} label={t(K.kind_label, { kind })} type={kind} />
      ))}
    </div>
  );
}
