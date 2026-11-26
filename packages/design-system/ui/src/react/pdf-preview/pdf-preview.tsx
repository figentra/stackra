/**
 * Stackra file contract:
 * Purpose: the web `PdfPreview`: a PDF shown in the browser's own viewer, in a sandboxed frame that sends no referrer,
 *          with a download button under it as the fallback for a browser that shows no PDF in a page (many mobile
 *          WebViews). No PDF library: the browser renders it.
 * Boundary: the frame is sandboxed. A cross-origin link (the signed object-storage URL it is meant for) may run the
 *           viewer's scripts and keep its own origin, which the built-in viewers need; that origin is not the page's,
 *           so the frame cannot reach the host. A same-origin link gets no scripts, so it can never lift its sandbox.
 *           The link is the caller's, minted per open; this component stores nothing.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1 and 4.1.2; Tamo spec generative-ui-tools-artifacts (G4)
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { PDF_PREVIEW_KEYS } from "#core/constants/pdf-preview-keys.constant";
import { Button } from "#react/button/button";
import { useUiText } from "#react/hooks/use-ui-text";
import type { PdfPreviewProps } from "#react/pdf-preview/pdf-preview.props";
import { Text } from "#react/text/text";

/** The preview's words. */
const K = PDF_PREVIEW_KEYS.ui.pdf_preview;

/** Whether `src` is served from the page's own origin (or cannot be read as a URL). */
function isSameOrigin(src: string): boolean {
  try {
    return new URL(src, globalThis.location?.href).origin === globalThis.location?.origin;
  } catch {
    return true;
  }
}

/**
 * A PDF in the browser's viewer, with a download fallback.
 *
 * @example
 * <PdfPreview src={link.url} name="Weekly sales.pdf" onDownload={download} />
 */
export function PdfPreview({ src, name, onDownload, className }: PdfPreviewProps): ReactElement {
  const t = useUiText();
  return (
    <div data-slot="pdf-preview" className={cn("flex min-h-0 flex-col gap-2", className)}>
      <iframe
        src={src}
        title={t(K.title, { name })}
        sandbox={
          isSameOrigin(src) ? "allow-downloads" : "allow-scripts allow-same-origin allow-downloads"
        }
        referrerPolicy="no-referrer"
        className="min-h-0 w-full flex-1 border border-border"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text type="small" tone="muted">
          {t(K.unavailable)}
        </Text>
        {onDownload === undefined ? null : (
          <Button variant="secondary" startIcon="download" onPress={onDownload}>
            {t(K.download, { name })}
          </Button>
        )}
      </div>
    </div>
  );
}
