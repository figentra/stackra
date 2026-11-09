/**
 * Stackra file contract:
 * Purpose: the "verify" demo of the web TerminalDemo: a `stackra verify` session shown on its last frame
 *          (`autoplay="never"`), every check at once, under its own label.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. Terminal text is
 *           code (left-to-right, never translated); the label comes from the catalogues.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-2041.
 */
import { TerminalDemo, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TERMINAL_DEMO_KEYS } from "#src/demos/free/terminal-demo/terminal-demo-keys.constant";

/** The demo's keys. */
const K = TERMINAL_DEMO_KEYS.terminal_demo;

/** The recorded session (code, never translated). */
const LINES = [
  { kind: "command", text: "stackra verify" },
  { kind: "output", text: "gen: manifest unchanged" },
  { kind: "output", text: "lint: 0 problems" },
  { kind: "output", text: "typecheck: 0 errors" },
  { kind: "output", text: "test: 128 passed" },
  { kind: "success", text: "verify: green" },
] as const;

/** TerminalDemo: stackra verify. */
export default function Verify() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <TerminalDemo
      command="stackra verify"
      label={t(K.verify_label)}
      lines={LINES}
      autoplay="never"
      copyLabel={t(K.copy)}
      className="w-full max-w-xl"
    />
  );
}
