/**
 * Stackra file contract:
 * Purpose: the "composer" demo of the web PromptInput: a composer with an attached file, an attach button and a footer; files dropped on it attach too.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (component gaps, owner approval 2026-10-31).
 */
import { AttachmentCard, IconButton, PromptInput, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { PROMPT_INPUT_KEYS } from "#src/demos/free/prompt-input/prompt-input-keys.constant";

/** The demo's keys. */
const K = PROMPT_INPUT_KEYS.prompt_input.composer;

/** PromptInput: a composer with an attached file, an attach button and a footer; files dropped on it attach too. */
export default function Composer() {
  const t = useCatalogueText(MESSAGES.en);
  const [files, setFiles] = useState<readonly string[]>([t(K.file)]);
  const [sent, setSent] = useState("");
  return (
    <div className="grid w-full max-w-xl gap-2">
      <PromptInput
        onSubmit={(text) => setSent(text)}
        onFilesDrop={(dropped) =>
          setFiles((names) => [...names, ...dropped.map((file) => file.name)])
        }
        attachments={
          files.length > 0
            ? files.map((name) => (
                <AttachmentCard
                  key={name}
                  name={name}
                  onRemove={() => setFiles((names) => names.filter((other) => other !== name))}
                />
              ))
            : null
        }
        startActions={<IconButton icon="plus" label={t(K.attach)} size="sm" variant="ghost" />}
        footer={t(K.footer)}
      />
      <Text type="small" tone="muted" role="status">
        {sent ? t(K.sent, { text: sent }) : ""}
      </Text>
    </div>
  );
}
