/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Switch: Three settings; the readout lists the ones that are on.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { Switch as UiSwitch, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SWITCH_KEYS } from "#src/demos/free/switch/switch-keys.constant";

/** The demo's keys. */
const K = SWITCH_KEYS.switch;

/** Switch: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  /** The settings of the live example. */
  const SETTINGS = [
    { key: "sync", label: t(K.sample.sync_over_mobile_data) },
    { key: "dark", label: t(K.sample.dark_theme) },
    { key: "beta", label: t(K.sample.beta_features) },
  ] as const;
  const [on, setOn] = useState<readonly string[]>(["dark"]);

  const names = SETTINGS.filter(({ key }) => on.includes(key))
    .map(({ label }) => label)
    .join(", ");

  return (
    <div className="grid gap-3">
      <ul aria-label={t(K.settings)} className="grid max-w-sm gap-3">
        {SETTINGS.map(({ key, label }) => (
          <li key={key}>
            <UiSwitch
              label={label}
              value={on.includes(key)}
              onChange={(isOn) =>
                setOn((current) =>
                  isOn ? [...current, key] : current.filter((item) => item !== key),
                )
              }
            />
          </li>
        ))}
      </ul>
      <Text role="status">{t(K.summary, { names: names || t(K.none) })}</Text>
    </div>
  );
}
