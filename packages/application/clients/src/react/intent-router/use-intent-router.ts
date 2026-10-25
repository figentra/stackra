/**
 * Stackra file contract:
 * Purpose: `useIntentRouter`, the action call proposed for free text in the command palette: the best match among the
 *          generated intent table's action intents that the session may run, by the phrases of the active locale.
 * Boundary: matching is local and synchronous (see `matchIntent`); the proposal carries an empty input, and nothing
 *           runs until the user confirms through the action runner. The phrases are the producer's phrase list, read
 *           item by item through the translator, so every locale matches its own.
 * Runtime: browser, react-native
 * Governing contract: ADR 0155 (intents); ADR 0139 (confirmation); owner decision R-12 (`intent` opt-in).
 */
import { useContainer } from "@stackra/container/react";
import type { I18nKey } from "@stackra/i18n";
import { useTranslation } from "@stackra/i18n/react";
import { useMemo } from "react";

import { ClientSession } from "#contracts/ports/client-session.port";
import { INTENT_ENTRIES } from "#core/constants/intent-entries.constant";
import { matchIntent } from "#core/functions/match-intent.function";
import type { IntentMatch } from "#react/intent-router/intent-match.type";

/** The most phrases read for one intent. */
const MAX_PHRASES = 32;

/**
 * The proposed action call for `text`, or `null`.
 *
 * @throws Error outside a `ContainerProvider` or an `I18nProvider`.
 * @example
 * const intent = useIntentRouter(query.length >= 3 ? query : "");
 * if (intent) await runAction(intent.action, intent.input);
 */
export function useIntentRouter(text: string): IntentMatch | null {
  const container = useContainer();
  const { t } = useTranslation();
  return useMemo(() => {
    const session = container.has(ClientSession) ? container.get(ClientSession) : undefined;
    const phrasesOf = (key: I18nKey): readonly string[] => {
      const phrases: string[] = [];
      // A phrase list is a JSON array, so its items are the keys `<list>.0`, `<list>.1`, ... until one is missing.
      for (let index = 0; index < MAX_PHRASES; index++) {
        try {
          phrases.push(t(`${key}.${index}` as I18nKey));
        } catch {
          break;
        }
      }
      return phrases;
    };
    const entry = matchIntent(
      text,
      INTENT_ENTRIES,
      (permission) => session?.can(permission) ?? true,
      phrasesOf,
    );
    if (entry?.ref.kind !== "action") return null;
    const [module, ...path] = entry.ref.permission.split(".");
    return {
      action: entry.ref,
      input: {},
      label: `${module}::permissions.${path.join(".")}` as I18nKey,
      ...(entry.ref.risk === undefined ? {} : { risk: entry.ref.risk }),
      icon: entry.icon,
    };
  }, [container, t, text]);
}
