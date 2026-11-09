/**
 * Stackra file contract:
 * Purpose: the "create" demo of the web TerminalDemo: a recorded `stackra create` session played a line at a time once
 *          it scrolls into view, ending on the new app running in a window frame.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. Terminal text is
 *           code (left-to-right, never translated); the result's sentence comes from the catalogues.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-2041.
 */
import { Frame, Text, TerminalDemo, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TERMINAL_DEMO_KEYS } from "#src/demos/free/terminal-demo/terminal-demo-keys.constant";

/** The demo's keys. */
const K = TERMINAL_DEMO_KEYS.terminal_demo;

/** The recorded session (code, never translated). */
const LINES = [
  { kind: "command", text: "stackra create billing-demo" },
  { kind: "prompt", text: "Which surfaces?" },
  { kind: "choice", text: "web, mobile" },
  { kind: "output", text: "Writing 42 files" },
  { kind: "output", text: "Installing dependencies" },
  { kind: "success", text: "Created billing-demo. Next: cd billing-demo && pnpm dev" },
] as const;

/** TerminalDemo: stackra create. */
export default function Create() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <TerminalDemo
      command="stackra create billing-demo"
      lines={LINES}
      copyLabel={t(K.copy)}
      className="w-full max-w-xl"
      result={
        <Frame title="localhost:5173">
          <Text tone="success" className="p-4">
            {t(K.running)}
          </Text>
        </Frame>
      }
    />
  );
}
