/**
 * Stackra file contract:
 * Purpose: the page of the ChatAttachment route: `@stackra/ui-pro`'s ChatAttachment as a group of file chips with their
 *          kind, name and size (a PDF, an archive, a spreadsheet, a source file) and a button that removes each, and
 *          ChatAttachmentInput as the attach button and drop zone of a prompt composer that lists the files picked.
 * Boundary: presentation only; the files are local and nothing is uploaded. The remove and attach buttons carry their own
 *          names. A picked file's name is isolated (`<bdi>`) so a right-to-left page keeps it readable.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { DemoIcon } from "#src/components/demo-icon";
import { ProChatAttachmentRoute } from "#src/routes/pro-chat-attachment/pro-chat-attachment.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-chat-attachment.*` keys.
const STRINGS = {
  documentTitle: `${ProChatAttachmentRoute.title} · Stackra Playground`,
  intro:
    "File chips for a message or a composer: the kind of file, its name and its size, and a button that removes it. The attach button and the drop zone share one file picker.",
  chips: "Attached files",
  remove: (name: string) => `Remove ${name}`,
  composer: "Composer",
  attach: "Attach file",
  send: "Send message",
  messageLabel: "Message about your files",
  placeholder: "Ask about your files...",
  picked: "Files picked",
  none: "No files picked yet.",
} as const;

/** One file chip: a file name and size, and its type when it is not told by the name. */
interface FileEntry {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly mimeType?: string;
}

const FILES: readonly FileEntry[] = [
  { id: "brief", name: "project-brief.pdf", size: 824_120, mimeType: "application/pdf" },
  { id: "assets", name: "design-assets.zip", size: 15_204_352, mimeType: "application/zip" },
  { id: "report", name: "quarterly-report.xlsx", size: 98_400 },
  { id: "index", name: "index.tsx", size: 3_820 },
];

/** The ChatAttachment page. */
export function ProChatAttachment() {
  const [files, setFiles] = useState<readonly FileEntry[]>(FILES);
  const [picked, setPicked] = useState<readonly FileEntry[]>([]);

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProChatAttachmentRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="chips-heading" className="grid max-w-3xl gap-3">
        <h2 id="chips-heading" className="type-h2">
          {STRINGS.chips}
        </h2>
        <UiPro.ChatAttachmentGroup>
          {files.map((file) => (
            <UiPro.ChatAttachment
              key={file.id}
              name={file.name}
              size={file.size}
              {...(file.mimeType === undefined ? {} : { mimeType: file.mimeType })}
            >
              <UiPro.ChatAttachment.Preview />
              <UiPro.ChatAttachment.Info />
              <UiPro.ChatAttachment.Remove
                label={STRINGS.remove(file.name)}
                onPress={() => setFiles((current) => current.filter((item) => item.id !== file.id))}
              />
            </UiPro.ChatAttachment>
          ))}
        </UiPro.ChatAttachmentGroup>
      </section>
      <section aria-labelledby="composer-heading" className="grid max-w-xl gap-3">
        <h2 id="composer-heading" className="type-h2">
          {STRINGS.composer}
        </h2>
        <UiPro.PromptInput>
          <UiPro.ChatAttachmentInput
            onFilesSelected={(selected: File[]) =>
              setPicked((current) => [
                ...current,
                ...selected.map((file, index) => ({
                  id: `${file.name}-${current.length}-${index}`,
                  name: file.name,
                  size: file.size,
                })),
              ])
            }
          >
            <UiPro.ChatAttachmentInput.Dropzone
              render={(dropzoneProps) => (
                <UiPro.PromptInput.Shell {...dropzoneProps}>
                  <UiPro.PromptInput.Content>
                    <UiPro.PromptInput.TextArea
                      label={STRINGS.messageLabel}
                      placeholder={STRINGS.placeholder}
                    />
                  </UiPro.PromptInput.Content>
                  <UiPro.PromptInput.Toolbar>
                    <UiPro.PromptInput.ToolbarStart>
                      <UiPro.ChatAttachmentInput.Trigger
                        label={STRINGS.attach}
                        render={(triggerProps) => (
                          <UiPro.PromptInput.Action {...triggerProps} label={STRINGS.attach}>
                            <DemoIcon name="doc" />
                          </UiPro.PromptInput.Action>
                        )}
                      />
                    </UiPro.PromptInput.ToolbarStart>
                    <UiPro.PromptInput.ToolbarEnd>
                      <UiPro.PromptInput.Send label={STRINGS.send}>
                        <DemoIcon name="search" />
                      </UiPro.PromptInput.Send>
                    </UiPro.PromptInput.ToolbarEnd>
                  </UiPro.PromptInput.Toolbar>
                </UiPro.PromptInput.Shell>
              )}
            />
          </UiPro.ChatAttachmentInput>
        </UiPro.PromptInput>
        <p className="text-sm text-muted" aria-live="polite">
          <bdi>
            {STRINGS.picked}:{" "}
            {picked.length === 0 ? STRINGS.none : picked.map((file) => file.name).join(", ")}
          </bdi>
        </p>
      </section>
    </article>
  );
}
