/**
 * Stackra file contract:
 * Purpose: `RtlPanel`, the Right-to-left section of a component page: what changes for Arabic (the catalogue's note)
 *          and the usage demo live in the other language from the page's (Arabic on an English page, English on an
 *          Arabic one), in its own direction, `lang` and catalogues, as a named region ("Arabic preview") mounted once
 *          scrolled near (`PreviewFrame`).
 * Boundary: presentation; the direction flip is the subtree's `dir` and `lang`, never a bidi override.
 * Runtime: browser
 * Governing contract: STA-1371 (doc pages wave, 2026-10-28; live preview, 2026-10-29); ADR 0060 (RTL);
 *          arabic-reversed-letters rules.
 */
import type { I18nKey } from "@stackra/i18n";
import { docKeys, type ComponentEntry } from "@stackra/showcase";
import { Card, Text, useCatalogueText, useDirection } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { DOC_PAGE_KEYS } from "#src/components/doc-page/doc-page-keys.constant";
import { PreviewFrame } from "#src/components/preview-frame";
import { MESSAGES } from "#src/constants/messages.constant";
import { demoPath } from "#src/demos";

const K = DOC_PAGE_KEYS.showcase.doc.ui;

/** The RTL note and the flipped usage demo of `entry`. */
export function RtlPanel({
  entry,
  exampleId,
}: {
  readonly entry: ComponentEntry;
  readonly exampleId?: string | undefined;
}): ReactElement {
  const t = useCatalogueText(MESSAGES.en);
  const isRtl = useDirection() === "rtl";
  return (
    <div className="grid gap-3">
      <Text className="max-w-prose">
        <bdi>{t(docKeys(entry).fields.rtl as I18nKey)}</bdi>
      </Text>
      {exampleId ? (
        <Card className="min-w-0 overflow-hidden p-0 [contain:inline-size]">
          <Text type="small" tone="muted" className="border-b border-separator px-4 py-2">
            {t(K.rtl_mirrored)}
          </Text>
          <PreviewFrame
            path={demoPath(entry, exampleId)}
            label={t(isRtl ? K.rtl_preview_en : K.rtl_preview_ar)}
            dir={isRtl ? "ltr" : "rtl"}
            lang={isRtl ? "en" : "ar"}
            className="@container grid min-h-32 place-items-center overflow-x-auto bg-background p-6"
          />
        </Card>
      ) : null}
    </div>
  );
}
