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
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::studio.export.*` keys.
const STRINGS = {
  title: "Export and import",
  format: "Format",
  code: (format: string) => `${format}, the export`,
  copy: "Copy",
  copied: "Copied to the clipboard.",
  copyFailed: "The browser refused the clipboard; select the text instead.",
  download: "Download",
  import: "Import",
  paste: "Paste a theme JSON",
  pasteNote:
    "A full export, a changes-only export or a bare theme. It is checked before it is used.",
  imported: (name: string) => `Imported the "${name}" theme.`,
  invalid: "That theme cannot be used:",
} as const;

/** The export formats: a label, the file name and the text. */
const FORMATS = [
  {
    id: "web",
    label: "Web CSS",
    file: "theme.web.css",
    text: (_: Theme, theme: Theme) => renderWebCss(theme),
  },
  {
    id: "native",
    label: "Native CSS",
    file: "theme.native.css",
    text: (_: Theme, theme: Theme) => renderNativeCss(theme),
  },
  {
    id: "json",
    label: "JSON",
    file: "theme.json",
    text: (_: Theme, theme: Theme) => JSON.stringify(exportThemeJson(theme), null, 2),
  },
  {
    id: "changes",
    label: "Changes",
    file: "theme.changes.json",
    text: (base: Theme, theme: Theme) => JSON.stringify(exportThemeDiff(base, theme), null, 2),
  },
  {
    id: "dtcg",
    label: "DTCG",
    file: "theme.tokens.json",
    text: (_: Theme, theme: Theme) => JSON.stringify(themeToDtcg(theme), null, 2),
  },
] as const;

/** Props of {@link StudioExport}. */
export interface StudioExportProps {
  /** The theme the changes-only export is measured against and the import applies a diff to. */
  base: Theme;
  /** The theme to export. */
  theme: Theme;
  /** Called with a checked imported theme. */
  onImport: (theme: Theme) => void;
}

/** The export and import panel. */
export function StudioExport({ base, theme, onImport }: StudioExportProps) {
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
      setStatus(STRINGS.copied);
    } catch {
      setStatus(STRINGS.copyFailed);
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
      setStatus(STRINGS.imported(imported.name));
      onImport(imported);
    } catch (error) {
      setProblems(error instanceof InvalidThemeError ? error.problems : [String(error)]);
    }
  };

  return (
    <section
      aria-labelledby="studio-export"
      className="material grid min-w-0 content-start gap-4 rounded-3xl p-5"
    >
      <Ui.Heading id="studio-export" level={2} type="h4">
        {STRINGS.title}
      </Ui.Heading>
      <Ui.Select
        label={STRINGS.format}
        items={FORMATS.map(({ id, label }) => ({ id, label }))}
        value={formatId}
        onChange={(id) => {
          const picked = FORMATS.find((candidate) => candidate.id === id);
          if (picked) setFormatId(picked.id);
        }}
      />
      <pre
        role="region"
        tabIndex={0}
        aria-label={STRINGS.code(format.label)}
        dir="ltr"
        className="max-h-80 overflow-auto rounded-2xl border border-separator bg-background p-3 font-mono text-xs leading-relaxed text-foreground"
      >
        <code>{text}</code>
      </pre>
      <div className="flex flex-wrap items-center gap-2">
        <Ui.Button size="sm" variant="secondary" startIcon="copy" onPress={() => void copy()}>
          {STRINGS.copy}
        </Ui.Button>
        <Ui.Button size="sm" variant="secondary" startIcon="download" onPress={download}>
          {STRINGS.download}
        </Ui.Button>
        <p role="status" className="text-sm text-muted">
          {status ? <bdi>{status}</bdi> : null}
        </p>
      </div>
      <Ui.Separator />
      <Ui.TextArea
        label={STRINGS.paste}
        description={<bdi>{STRINGS.pasteNote}</bdi>}
        rows={4}
        value={pasted}
        onChange={setPasted}
        isInvalid={problems.length > 0}
      />
      {problems.length > 0 ? (
        <div role="alert" className="grid gap-1 text-sm text-danger">
          <p className="font-medium">{STRINGS.invalid}</p>
          <ul className="list-disc ps-5">
            {problems.slice(0, 8).map((problem) => (
              <li key={problem}>
                <bdi>{problem}</bdi>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Ui.Button
        size="sm"
        startIcon="upload"
        isDisabled={pasted.trim() === ""}
        onPress={importPasted}
        className="justify-self-start"
      >
        {STRINGS.import}
      </Ui.Button>
    </section>
  );
}
