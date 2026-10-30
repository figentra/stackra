/**
 * Stackra file contract:
 * Purpose: `KeyboardPanel`, the Keyboard table of a component's Accessibility section: each row the keys (in `<kbd>`,
 *          never translated, always left to right) and the action they perform in the reader's language.
 * Boundary: presentation over `docKeys(entry).keyboard`; renders nothing when the entry has no keyboard map.
 * Runtime: browser
 * Governing contract: STA-1371 (doc pages wave, 2026-10-28); WAI-ARIA APG keyboard interaction sections.
 */
import type { IconName } from "@stackra/icons/contracts";
import type { I18nKey } from "@stackra/i18n";
import { docKeys, type ComponentEntry } from "@stackra/showcase";
import { Heading, Icon, Kbd, useCatalogueText } from "@stackra/ui/react";

import { DOC_PAGE_KEYS } from "#src/components/doc-page/doc-page-keys.constant";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";

const K = DOC_PAGE_KEYS.showcase.doc.ui;

/**
 * The arrow keys, drawn as named icons: a glyph-only `<kbd>` (↑) is text whose contrast axe cannot judge and leaves
 * for review. Named like the other keys, by their code names, never translated; physical keys, so never mirrored.
 */
const ARROW_KEYS: Readonly<Record<string, { icon: IconName; label: string }>> = {
  "↑": { icon: Icons.ArrowUp, label: "Up arrow" },
  "↓": { icon: Icons.ArrowDown, label: "Down arrow" },
  "←": { icon: Icons.ArrowLeft, label: "Left arrow" },
  "→": { icon: Icons.ArrowRight, label: "Right arrow" },
};

/** The keyboard map of `entry`. */
export function KeyboardPanel({ entry }: { readonly entry: ComponentEntry }) {
  const t = useCatalogueText(MESSAGES.en);
  const rows = docKeys(entry).keyboard;
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby="keyboard-title" className="grid gap-3">
      <Heading id="keyboard-title" level={3}>
        {t(K.keyboard)}
      </Heading>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-separator text-start text-muted">
            <th scope="col" className="py-2 pe-4 text-start font-medium">
              {t(K.keys)}
            </th>
            <th scope="col" className="py-2 text-start font-medium">
              {t(K.action)}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.keys.join("+")}-${row.action}`} className="border-b border-separator">
              <td className="py-2 pe-4">
                <span dir="ltr" className="inline-flex flex-wrap gap-1">
                  {row.keys.map((key) => {
                    const arrow = ARROW_KEYS[key];
                    return (
                      <Kbd key={key}>
                        {arrow ? (
                          <Icon
                            name={arrow.icon}
                            label={arrow.label}
                            size="sm"
                            isMirroredInRtl={false}
                          />
                        ) : (
                          key
                        )}
                      </Kbd>
                    );
                  })}
                </span>
              </td>
              <td className="py-2">
                <bdi>{t(row.action as I18nKey)}</bdi>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
