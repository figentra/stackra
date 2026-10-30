/**
 * Stackra file contract:
 * Purpose: the "with-error" demo of the web Stepper: a customer import whose row check failed: that step is marked and says why.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (owner request 2026-10-29).
 */
import { Stepper, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { STEPPER_KEYS } from "#src/demos/free/stepper/stepper-keys.constant";

/** The demo's keys. */
const K = STEPPER_KEYS.stepper.error;

/** Stepper: a step that needs attention. */
export default function WithError() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="w-full max-w-xl">
      <Stepper
        label={t(K.label)}
        currentStep="rows"
        steps={[
          { id: "upload", label: t(K.upload) },
          { id: "columns", label: t(K.columns) },
          { id: "rows", label: t(K.rows), description: t(K.rows_note), status: "error" },
          { id: "import", label: t(K.import) },
        ]}
      />
    </div>
  );
}
