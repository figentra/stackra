/**
 * Stackra file contract:
 * Purpose: the CSS colours of a dot loader's built dots and its emphasis dot for a tone.
 * Boundary: web only; not exported from `./react`.
 * Runtime: browser
 * Governing contract: .agents/specs/sta-2017-dot-loader/spec.md ("The motion": colours); brand rules §39, §41
 */
import type { TextTone } from "#contracts/enums/text-tone.enum";

const TONE_COLOR: Readonly<Record<TextTone, string>> = Object.freeze({
  default: "var(--foreground)",
  muted: "var(--muted)",
  accent: "var(--accent)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
});

/**
 * The built dots take the tone. The accent tone's last or leading dot takes the theme's emphasis, the core
 * (`--core`, Stackra's champagne), falling back to the accent in a theme without one; every other tone keeps its own.
 */
export function dotColors(tone: TextTone): { color: string; emphasis: string } {
  const color = TONE_COLOR[tone];
  return { color, emphasis: tone === "accent" ? "var(--core, var(--accent))" : color };
}
