/**
 * Stackra file contract:
 * Purpose: the "api-key" demo of the web CopyButton: a masked API key on an OS admin page, copied whole.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); design-system gap inventory row 35.
 */
import { CopyButton, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { COPY_BUTTON_KEYS } from "#src/demos/free/copy-button/copy-button-keys.constant";

/** The demo's keys. */
const K = COPY_BUTTON_KEYS.copy_button;

/** A sample test key (not a real secret). */
const KEY = "sk_test_DEMO_not_a_real_key";

/** CopyButton: API key. */
export default function ApiKey() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid max-w-sm gap-1">
      <Text type="small" tone="muted">
        {t(K.api_key)}
      </Text>
      <div className="flex items-center justify-between gap-2 border border-border bg-surface px-3 py-1">
        <Text dir="ltr" className="font-mono" isTruncated>
          {`${KEY.slice(0, 8)}••••••••${KEY.slice(-4)}`}
        </Text>
        <CopyButton value={KEY} label={t(K.copy_key)} copiedLabel={t(K.key_copied)} />
      </div>
    </div>
  );
}
