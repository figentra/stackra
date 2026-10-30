/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Dropdown: an account menu: items with a second line, a destructive Sign out, and the
 *          chosen action said under it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Dropdown, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DROPDOWN_KEYS } from "#src/demos/free/dropdown/dropdown-keys.constant";

/** The demo's keys. */
const K = DROPDOWN_KEYS.dropdown;

/** An account menu with hints and a danger item; the chosen action is shown below. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  const labels: Readonly<Record<string, string>> = {
    profile: t(K.profile),
    billing: t(K.billing),
    "sign-out": t(K.sign_out),
  };
  return (
    <div className="grid justify-items-start gap-3">
      <Dropdown>
        <Dropdown.Trigger variant="secondary">{t(K.account)}</Dropdown.Trigger>
        <Dropdown.Menu
          aria-label={t(K.account_menu)}
          onAction={(key) => setChosen(labels[String(key)])}
        >
          <Dropdown.Item id="profile" description={t(K.profile_hint)}>
            {t(K.profile)}
          </Dropdown.Item>
          <Dropdown.Item id="billing" description={t(K.billing_hint)}>
            {t(K.billing)}
          </Dropdown.Item>
          <Dropdown.Item id="sign-out" color="danger">
            {t(K.sign_out)}
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      <Text type="small" tone="muted" aria-live="polite">
        {chosen === undefined ? t(K.nothing_chosen) : t(K.chosen, { action: chosen })}
      </Text>
    </div>
  );
}
