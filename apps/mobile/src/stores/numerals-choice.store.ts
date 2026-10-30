/**
 * Stackra file contract:
 * Purpose: `numeralsChoice`, the digits the showcase writes numbers, money and dates in (the customer's setting in a
 *          product; the viewer's Display pick here): Latin by default (ADR 0192), Arabic-Indic when picked, remembered
 *          in `displayPrefs` across launches.
 * Boundary: module state with a subscribe/getSnapshot pair for `useSyncExternalStore`; any other value is ignored. The
 *           formatting is @stackra/i18n's, which the app's `I18nProvider` takes the choice from (`app.tsx`).
 * Runtime: react-native
 * Governing contract: ADR 0192 (decision 2, as amended 2026-10-28: the digits are a per-customer setting); ADR 0256.
 */
import { NumberingSystem } from "@stackra/i18n";

import { displayPrefs } from "./display-prefs.store";

/** The digits on offer, the default first. */
const OFFERED = [NumberingSystem.Latn, NumberingSystem.Arab] as const;

/** One of them. */
type Offered = (typeof OFFERED)[number];

let numerals: Offered | undefined;
const listeners = new Set<() => void>();

/** The showcase's digits. */
export const numeralsChoice = {
  /** The digits on offer, the default first. */
  offered: OFFERED,
  /** The digits now: the remembered pick, else Latin. */
  getSnapshot(): Offered {
    numerals ??= OFFERED.find((system) => system === displayPrefs.get("numerals")) ?? OFFERED[0];
    return numerals;
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
  /** Writes `next` from now on and remembers it; anything not on offer changes nothing. */
  set(next: string) {
    const picked = OFFERED.find((system) => system === next);
    if (picked === undefined || picked === numeralsChoice.getSnapshot()) return;
    numerals = picked;
    displayPrefs.set("numerals", picked);
    for (const listener of listeners) listener();
  },
};
