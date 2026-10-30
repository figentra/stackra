/**
 * Stackra file contract:
 * Purpose: proves the free demos' catalogues agree: every English key of `demo_free` has an Arabic twin with the same
 *          placeholders, and the keys the toast, tooltip, typography and use-confirmation demos read resolve in both.
 * Boundary: the two JSON catalogues and the keys constants only; no component renders.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) sections 4 and 12 (Arabic hard gate); ADR 0022 (test placement).
 */
import { describe, expect, it } from "vitest";

import ar from "../../../../assets/lang/ar/demo_free.json";
import en from "../../../../assets/lang/en/demo_free.json";
import { TOAST_DEMO_KEYS } from "../toast/toast-demo-keys.constant";
import { TOOLTIP_DEMO_KEYS } from "../tooltip/tooltip-demo-keys.constant";
import { TYPOGRAPHY_DEMO_KEYS } from "../typography/typography-demo-keys.constant";
import { USE_CONFIRMATION_DEMO_KEYS } from "../use-confirmation/use-confirmation-demo-keys.constant";

/** Every leaf of a catalogue as `path → text`. */
function leaves(node: unknown, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (typeof value === "string") out.set(prefix + key, value);
    else for (const [path, text] of leaves(value, `${prefix}${key}.`)) out.set(path, text);
  }
  return out;
}

/** The argument names a message reads (`{name}` and `{count, plural, …}`), not the words inside plural branches. */
function placeholders(text: string): string[] {
  return [
    ...new Set(
      [
        ...text.matchAll(
          /\{([A-Za-z_]+)(?:\}|,\s*(?:plural|selectordinal|select|number|date|time)\b)/g,
        ),
      ].flatMap((match) => match[1] ?? []),
    ),
  ].sort();
}

/** The key strings of a typed key tree (`demo_free::toast.live.show`) as catalogue paths. */
function keyPaths(node: unknown): string[] {
  return Object.values(node as Record<string, unknown>).flatMap((value) =>
    typeof value === "string" ? [value.replace("demo_free::", "")] : keyPaths(value),
  );
}

const english = leaves(en);
const arabic = leaves(ar);

describe("demo_free catalogues", () => {
  it("gives every English key an Arabic text with the same placeholders", () => {
    for (const [path, text] of english) {
      expect(arabic.has(path), path).toBe(true);
      expect(placeholders(arabic.get(path) ?? ""), path).toEqual(placeholders(text));
    }
    expect([...arabic.keys()].filter((path) => !english.has(path))).toEqual([]);
  });

  it("resolves every key the converted demos read", () => {
    const keys = [
      TOAST_DEMO_KEYS,
      TOOLTIP_DEMO_KEYS,
      TYPOGRAPHY_DEMO_KEYS,
      USE_CONFIRMATION_DEMO_KEYS,
    ].flatMap(keyPaths);
    expect(keys.length).toBeGreaterThan(0);
    for (const path of keys) expect(english.has(path), path).toBe(true);
  });
});
