/**
 * Stackra file contract:
 * Purpose: the Theme Studio's export and import, all from the one derived theme.
 *          - Export formats: the web stylesheet (`renderWebCss`, HeroUI v3), the native one (`renderNativeCss`,
 *            Uniwind); the full JSON (the theme plus HeroUI's and Stackra's custom properties); the changes-only JSON
 *            against the base; W3C DTCG tokens.
 *          - Each export can be copied or downloaded.
 *          - Import: pasting a JSON file and importing it hands the checked theme to the page, or lists what is wrong.
 * Boundary: presentation and the browser's clipboard and download only; the text is made by @stackra/tokens, and the
 *          import is checked there (`parseThemeJson`).
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio); WCAG 2.2 SC 2.1.1, 4.1.3.
 */
import {
  exportThemeDiff,
  exportThemeJson,
  InvalidThemeError,
  parseThemeJson,
  renderNativeCss,
  renderWebCss,
  themeToDtcg,
} from "@stackra/tokens";
import type { Theme } from "@stackra/tokens/contracts";
import { Button, Heading, Select, Separator, TextArea, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { THEME_STUDIO_KEYS } from "#src/routes/theme-studio/theme-studio-keys.constant";

import type { StudioExportProps } from "./studio-export.props";

/** The panel's keys. */
const K = THEME_STUDIO_KEYS.theme_studio.export;

/** The export formats: a label, the file name and the text. */
const FORMATS = [
  {
    id: "web",
    file: "theme.web.css",
    text: (_: Theme, theme: Theme) => renderWebCss(theme),
  },
  {
    id: "native",
    file: "theme.native.css",
    text: (_: Theme, theme: Theme) => renderNativeCss(theme),
  },
  {
    id: "json",
    file: "theme.json",
    text: (_: Theme, theme: Theme) => JSON.stringify(exportThemeJson(theme), null, 2),
  },
  {
    id: "changes",
    file: "theme.changes.json",
    text: (base: Theme, theme: Theme) => JSON.stringify(exportThemeDiff(base, theme), null, 2),
  },
  {
    id: "dtcg",
    file: "theme.tokens.json",
    text: (_: Theme, theme: Theme) => JSON.stringify(themeToDtcg(theme), null, 2),
  },
] as const;

/** The export and import panel. */
export function StudioExport({ base, theme, onImport }: StudioExportProps) {
  const t = useCatalogueText(MESSAGES.en);
  const [formatId, setFormatId] = useState<(typeof FORMATS)[number]["id"]>("json");
  const [status, setStatus] = useState("");
  const [pasted, setPasted] = useState("");
  const [problems, setProblems] = useState<readonly string[]>([]);
  const format = FORMATS.find(({ id }) => id === formatId) ?? FORMATS[0];
  const text = format.text(base, theme);
  const file = `${theme.name}.${format.file}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(t(K.copied));
    } catch {
      setStatus(t(K.copy_failed));
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = file;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importPasted = () => {
    try {
      const imported = parseThemeJson(pasted, base);
      setProblems([]);
      setStatus(t(K.imported, { name: imported.name }));
      onImport(imported);
    } catch (error) {
      setProblems(error instanceof InvalidThemeError ? error.problems : [String(error)]);
    }
  };

  return (
    <section
      id="studio-export"
      aria-labelledby="studio-export-title"
      className="grid min-w-0 content-start gap-4"
    >
      <Heading id="studio-export-title" level={2} className="[font:var(--h5)]">
        {t(K.title)}
      </Heading>
      <Select
        label={t(K.format)}
        items={FORMATS.map(({ id }) => ({ id, label: t(K.formats[id]) }))}
        value={formatId}
        onChange={(id) => {
          const picked = FORMATS.find((candidate) => candidate.id === id);
          if (picked) setFormatId(picked.id);
        }}
      />
      <pre
        role="region"
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- reason: a scroll region must take focus so a keyboard user can scroll it (WCAG 2.1.1)
        tabIndex={0}
        aria-label={t(K.code, { format: t(K.formats[format.id]) })}
        dir="ltr"
        className="max-h-72 overflow-auto border border-separator bg-background p-3 font-mono text-xs leading-relaxed text-foreground"
        style={{ borderRadius: "calc(var(--radius)*3)" }}
      >
        <code>{text}</code>
      </pre>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" startIcon="copy" onPress={() => void copy()}>
          {t(K.copy)}
        </Button>
        <Button size="sm" variant="secondary" startIcon={Icons.Download} onPress={download}>
          {t(K.download)}
        </Button>
        <p role="status" className="text-sm text-muted">
          {status ? <bdi>{status}</bdi> : null}
        </p>
      </div>
      <Separator />
      <TextArea
        label={t(K.paste)}
        description={<bdi>{t(K.paste_note)}</bdi>}
        rows={4}
        value={pasted}
        onChange={setPasted}
        isInvalid={problems.length > 0}
      />
      {problems.length > 0 ? (
        <div role="alert" className="grid gap-1 text-sm text-danger">
          <p className="font-medium">{t(K.invalid)}</p>
          <ul className="list-disc ps-5">
            {problems.slice(0, 8).map((problem) => (
              <li key={problem}>
                <bdi>{problem}</bdi>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Button
        size="sm"
        startIcon="upload"
        isDisabled={pasted.trim() === ""}
        onPress={importPasted}
        className="justify-self-start"
      >
        {t(K.import)}
      </Button>
    </section>
  );
}
