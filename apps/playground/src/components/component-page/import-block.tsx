/**
 * Stackra file contract:
 * Purpose: `ImportBlock`, the Import section: the import line of the entry on the platform shown, a platform segmented
 *          control when the entry exists on both, and a copy button.
 * Boundary: the import line is derived (`importLine`) and never translated.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (row 3).
 */
import { importLine, Platform } from "@stackra/showcase";
import { ToggleButton, ToggleButtonGroup, useCatalogueText } from "@stackra/ui/react";

import { CodeSnippet } from "#src/components/code-snippet/code-snippet";
import { COMPONENT_PAGE_KEYS } from "#src/components/component-page/component-page-keys.constant";
import type { ImportBlockProps } from "#src/components/component-page/import-block.props";
import { MESSAGES } from "#src/constants/messages.constant";

const K = COMPONENT_PAGE_KEYS.showcase;

/** The import line with its platform switch and copy button. */
export function ImportBlock({ entry, platform, onPlatformChange }: ImportBlockProps) {
  const t = useCatalogueText(MESSAGES.en);
  const line = importLine(entry, platform);
  return (
    <div className="grid gap-3">
      {entry.platforms.length > 1 ? (
        <ToggleButtonGroup
          aria-label={t(K.section.import)}
          size="sm"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[platform]}
          onSelectionChange={(keys) => {
            const picked = Platform.find((value) => keys.has(value));
            if (picked) onPlatformChange(picked);
          }}
          className="justify-self-start"
        >
          {entry.platforms.map((value) => (
            <ToggleButton key={value} id={value}>
              {t(K.platform[value])}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      ) : null}
      <CodeSnippet code={line} title={entry.packageName} copyLabel={t(K.ui.copy_import)} />
    </div>
  );
}
