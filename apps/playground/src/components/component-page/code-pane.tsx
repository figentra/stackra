/**
 * Stackra file contract:
 * Purpose: `CodePane`, the code under a preview: collapsed by default, a "Show code" button opens it, the source is
 *          fetched then and highlighted by the playground's CodeSnippet (@stackra/ui CodeBlock), with a copy button in its header.
 * Boundary: the pane only; the source comes from the `?raw` glob through `load`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (ExamplePreview code pane).
 */
import { Button, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useState } from "react";

import { CodeSnippet } from "#src/components/code-snippet/code-snippet";
import type { CodePaneProps } from "#src/components/component-page/code-pane.props";
import { COMPONENT_PAGE_KEYS } from "#src/components/component-page/component-page-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";

const K = COMPONENT_PAGE_KEYS.showcase.ui;

/** The collapsible code of a demo. */
export function CodePane({ fileName, load, isOpen: isAlwaysOpen = false }: CodePaneProps) {
  const t = useCatalogueText(MESSAGES.en);
  const [isToggled, setOpen] = useState(false);
  const isOpen = isAlwaysOpen || isToggled;
  const [code, setCode] = useState<string>();
  useEffect(() => {
    if (!isOpen || code !== undefined || !load) return undefined;
    let isLive = true;
    void load().then((source) => {
      if (isLive) setCode(source);
    });
    return () => {
      isLive = false;
    };
  }, [isOpen, code, load]);
  if (!load) return null;
  return (
    <div className="grid gap-2">
      {isAlwaysOpen ? null : (
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={isOpen}
          onPress={() => setOpen((open) => !open)}
          className="justify-self-start"
        >
          {t(isOpen ? K.hide_code : K.show_code)}
        </Button>
      )}
      {isOpen && code !== undefined ? (
        <CodeSnippet code={code} title={fileName} copyLabel={t(K.copy)} />
      ) : null}
    </div>
  );
}
