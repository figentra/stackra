/**
 * Stackra file contract:
 * Purpose: the page of the DropZone route: `@stackra/ui-pro`'s DropZone, a file drop area with a file picker and a list
 *          of files, in a zone that adds the files dropped or chosen to a list that already shows the three upload states
 *          (uploading with progress, complete, and failed with a retry), and a disabled zone.
 * Boundary: presentation and local state only; nothing is uploaded, so a chosen or dropped file is listed as complete.
 *          The area, the file input, each progress bar and each retry and remove button are named.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";
import { type ComponentProps, useState } from "react";

import { ProDropZoneRoute } from "#src/routes/pro-drop-zone/pro-drop-zone.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-drop-zone.*` keys.
const STRINGS = {
  documentTitle: `${ProDropZoneRoute.title} · Stackra Playground`,
  intro:
    "A file drop area with a button that opens the file picker. Files dropped or chosen join the list; nothing is uploaded here.",
  zone: "Upload files",
  area: "Drop files here",
  input: "Choose files",
  prompt: "Drag files here or press the button",
  hint: "PDF, PNG or CSV files.",
  trigger: "Select files",
  progress: (name: string) => `Upload progress of ${name}`,
  retry: (name: string) => `Retry the upload of ${name}`,
  remove: (name: string) => `Remove ${name}`,
  failed: "Upload failed",
  disabled: "Disabled",
  disabledArea: "Upload unavailable",
  disabledPrompt: "File upload is unavailable",
  disabledHint: "Uploads are turned off.",
} as const;

type FileStatus = "uploading" | "complete" | "failed";

interface ListedFile {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly status: FileStatus;
  readonly progress: number;
}

const SAMPLES: readonly ListedFile[] = [
  { id: "sample-a", name: "proposal.pdf", size: 2_516_582, status: "uploading", progress: 45 },
  { id: "sample-b", name: "logo.png", size: 148_480, status: "complete", progress: 100 },
  { id: "sample-c", name: "export.csv", size: 61_440, status: "failed", progress: 0 },
];

/** The colours HeroUI Pro's file format icon takes. */
type FormatColor = NonNullable<ComponentProps<typeof UiPro.DropZone.FileFormatIcon>["color"]>;

const FORMAT_COLORS: Readonly<Record<string, FormatColor>> = {
  csv: "green",
  pdf: "red",
  png: "green",
};

/** The size of a file as text: kilobytes, or megabytes from one. */
function sizeOf(bytes: number): string {
  if (bytes < 1_048_576) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

/** The extension of a file name, lower case, or an empty string. */
function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/** The listed files of a file list the browser gave: complete, since nothing is uploaded. */
function listed(files: Iterable<File>): ListedFile[] {
  return Array.from(files, (file) => ({
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    size: file.size,
    status: "complete",
    progress: 100,
  }));
}

/** The DropZone page. */
export function ProDropZone() {
  const [files, setFiles] = useState<readonly ListedFile[]>(SAMPLES);

  const add = (added: ListedFile[]) =>
    setFiles((current) => [
      ...added,
      ...current.filter((file) => !added.some((item) => item.id === file.id)),
    ]);

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProDropZoneRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="zone-heading" className="grid max-w-lg gap-3">
        <h2 id="zone-heading" className="type-h2">
          {STRINGS.zone}
        </h2>
        <UiPro.DropZone>
          <UiPro.DropZone.Area
            label={STRINGS.area}
            onDrop={async (event) => {
              const dropped: File[] = [];
              for (const item of event.items)
                if (item.kind === "file") dropped.push(await item.getFile());
              add(listed(dropped));
            }}
          >
            <UiPro.DropZone.Icon />
            <UiPro.DropZone.Label>{STRINGS.prompt}</UiPro.DropZone.Label>
            <UiPro.DropZone.Description>{STRINGS.hint}</UiPro.DropZone.Description>
            <UiPro.DropZone.Trigger>{STRINGS.trigger}</UiPro.DropZone.Trigger>
          </UiPro.DropZone.Area>
          <UiPro.DropZone.Input
            label={STRINGS.input}
            multiple
            onSelect={(selected) => add(listed(Array.from(selected)))}
          />
          <UiPro.DropZone.FileList>
            {files.map((file) => (
              <UiPro.DropZone.FileItem key={file.id} status={file.status}>
                <UiPro.DropZone.FileFormatIcon
                  color={FORMAT_COLORS[extensionOf(file.name)] ?? "gray"}
                  format={extensionOf(file.name).toUpperCase()}
                />
                <UiPro.DropZone.FileInfo>
                  <UiPro.DropZone.FileName>{file.name}</UiPro.DropZone.FileName>
                  <UiPro.DropZone.FileMeta>
                    <bdi>
                      {file.status === "failed"
                        ? `${sizeOf(file.size)} | ${STRINGS.failed}`
                        : `${sizeOf(file.size)} | ${file.progress}%`}
                    </bdi>
                  </UiPro.DropZone.FileMeta>
                  {file.status === "uploading" && (
                    <UiPro.DropZone.FileProgress
                      aria-label={STRINGS.progress(file.name)}
                      value={file.progress}
                    >
                      <UiPro.DropZone.FileProgressTrack>
                        <UiPro.DropZone.FileProgressFill />
                      </UiPro.DropZone.FileProgressTrack>
                    </UiPro.DropZone.FileProgress>
                  )}
                </UiPro.DropZone.FileInfo>
                {file.status === "failed" && (
                  <UiPro.DropZone.FileRetryTrigger aria-label={STRINGS.retry(file.name)} />
                )}
                <UiPro.DropZone.FileRemoveTrigger
                  aria-label={STRINGS.remove(file.name)}
                  onPress={() =>
                    setFiles((current) => current.filter((item) => item.id !== file.id))
                  }
                />
              </UiPro.DropZone.FileItem>
            ))}
          </UiPro.DropZone.FileList>
        </UiPro.DropZone>
      </section>
      <section aria-labelledby="disabled-heading" className="grid max-w-lg gap-3">
        <h2 id="disabled-heading" className="type-h2">
          {STRINGS.disabled}
        </h2>
        <UiPro.DropZone>
          <UiPro.DropZone.Area label={STRINGS.disabledArea} isDisabled>
            <UiPro.DropZone.Icon />
            <UiPro.DropZone.Label>{STRINGS.disabledPrompt}</UiPro.DropZone.Label>
            <UiPro.DropZone.Description>{STRINGS.disabledHint}</UiPro.DropZone.Description>
            <UiPro.DropZone.Trigger isDisabled>{STRINGS.trigger}</UiPro.DropZone.Trigger>
          </UiPro.DropZone.Area>
          <UiPro.DropZone.Input label={STRINGS.disabledArea} isDisabled />
        </UiPro.DropZone>
      </section>
    </article>
  );
}
