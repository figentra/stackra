/**
 * Stackra file contract:
 * Purpose: the "selection" demo of the web Dropdown: a language switcher that holds one choice; the check marks the current one.
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

/** A single-choice language menu that marks the current language. */
export default function Selection() {
  const t = useCatalogueText(MESSAGES.en);
  const [language, setLanguage] = useState("en");
  const names: Readonly<Record<string, string>> = {
    en: t(K.english),
    ar: t(K.arabic),
    fr: t(K.french),
  };
  return (
    <div className="grid justify-items-start gap-3">
      <Dropdown>
        <Dropdown.Trigger variant="secondary">{t(K.language)}</Dropdown.Trigger>
        <Dropdown.Menu
          aria-label={t(K.languages)}
          selectionMode="single"
          selectedKeys={[language]}
          onSelectionChange={(keys) => {
            const [next] = keys === "all" ? [] : [...keys];
            if (next !== undefined) setLanguage(String(next));
          }}
        >
          <Dropdown.Item id="en">{t(K.english)}</Dropdown.Item>
          <Dropdown.Item id="ar">{t(K.arabic)}</Dropdown.Item>
          <Dropdown.Item id="fr">{t(K.french)}</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      <Text type="small" tone="muted" aria-live="polite">
        {t(K.current, { language: names[language] ?? language })}
      </Text>
    </div>
  );
}
