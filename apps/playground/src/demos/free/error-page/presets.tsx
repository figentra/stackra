/**
 * Stackra file contract:
 * Purpose: the "presets" demo of the web ErrorPage: the four presets, 403, 404, 500 and offline, each with its catalogue words and icon.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); GAPS.md row 31 (owner decision 2026-10-28).
 */
import type { ErrorPagePreset } from "@stackra/ui/contracts";
import { ErrorPage, RadioGroup, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ERROR_PAGE_KEYS } from "#src/demos/free/error-page/error-page-keys.constant";

/** The demo's keys. */
const K = ERROR_PAGE_KEYS.error_page;

/** Error page: Presets. */
export default function Presets() {
  const t = useCatalogueText(MESSAGES.en);
  const [preset, setPreset] = useState<ErrorPagePreset>("not-found");
  return (
    <div className="grid gap-4">
      <RadioGroup
        label={t(K.preset_label)}
        orientation="horizontal"
        value={preset}
        onChange={(next) => setPreset(next as ErrorPagePreset)}
        options={[
          { value: "forbidden", label: t(K.presets.forbidden) },
          { value: "not-found", label: t(K.presets.not_found) },
          { value: "server-error", label: t(K.presets.server_error) },
          { value: "offline", label: t(K.presets.offline) },
        ]}
      />
      <div className="border border-separator">
        <ErrorPage key={preset} preset={preset} headingLevel={3} />
      </div>
    </div>
  );
}
