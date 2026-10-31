/**
 * Stackra file contract:
 * Purpose: the "inline" demo of the web Code: a command and a file name inside a sentence.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap build, owner approval 2026-10-31).
 */
import { Code, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CODE_KEYS } from "#src/demos/free/code/code-keys.constant";

/** The demo's keys. */
const K = CODE_KEYS.code.inline;

/** Code is never translated. */
const INSTALL = "pnpm install";

/** Code is never translated. */
const CONFIG = "stackra.config.ts";

/** Code: a command and a file name inside a sentence. */
export default function Inline() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Text>
      {t(K.before)} <Code>{INSTALL}</Code> {t(K.between)} <Code>{CONFIG}</Code> {t(K.after)}
    </Text>
  );
}
