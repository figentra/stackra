/**
 * Stackra file contract:
 * Purpose: `answerFailureOf(answer, keys, t)`, the error state of a failed read: its title, the error and a retry that
 *          refetches, in the words `keys` names (a resource page's or a widget's).
 * Boundary: internal: pure; the web and native resource pages and widget tiles spread it on their kit's `ErrorState`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307; ADR 0164 (native parity).
 */
import type { I18nKey } from "@stackra/i18n";

/**
 * The `ErrorState` props of `answer`.
 *
 * @example
 * <ErrorState {...answerFailureOf(answer, PANEL_KEYS.panel.resources, t)} />
 */
export function answerFailureOf(
  answer: { readonly error: unknown; readonly refetch: () => unknown },
  keys: { readonly failed: I18nKey; readonly retry: I18nKey },
  t: (key: I18nKey) => string,
): {
  readonly title: string;
  readonly error: unknown;
  readonly retry: { readonly label: string; readonly onPress: () => void };
} {
  return {
    title: t(keys.failed),
    error: answer.error,
    retry: { label: t(keys.retry), onPress: () => void answer.refetch() },
  };
}
