/**
 * Stackra file contract:
 * Purpose: the "actions" demo of the web SettingRow: rows that open a page instead of switching (taxes, payment methods, staff), each with a "Manage" button named for its row.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL); design-system gap inventory row 37.
 */
import { Button, Separator, SettingRow as UiSettingRow, useCatalogueText } from "@stackra/ui/react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SETTING_ROW_KEYS } from "#src/demos/free/setting-row/setting-row-keys.constant";

/** The demo's keys. */
const K = SETTING_ROW_KEYS.setting_row;

/** The rows, by key and icon. */
const ROWS = [
  { id: "taxes", icon: Icons.Receipt },
  { id: "payments", icon: Icons.CreditCard },
  { id: "staff", icon: Icons.Users },
] as const;

/** The SettingRow demo: actions. */
export default function Actions() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div role="group" aria-label={t(K.list)} className="grid">
      {ROWS.map((row, index) => (
        <div key={row.id}>
          {index > 0 ? <Separator /> : null}
          <UiSettingRow
            icon={row.icon}
            title={t(K[row.id])}
            description={t(K[`${row.id}_hint`])}
            action={
              <Button
                size="sm"
                variant="secondary"
                label={t(K.manage_label, { setting: t(K[row.id]) })}
              >
                {t(K.manage)}
              </Button>
            }
          />
        </div>
      ))}
    </div>
  );
}
