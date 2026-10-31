/**
 * Stackra file contract:
 * Purpose: `mockTamoText`, the offline mock's text work: the built-in actions (rewrite, shorten, expand, fix grammar,
 *          translate, two tones), continue and draft, by plain deterministic rules in English and Arabic.
 * Boundary: demo only: no model, the same output for the same input every time; never shipped as a writing aid.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (a deterministic mock provider for the playground).
 */
/** Arabic letters. */
const ARABIC = /[\u0600-\u06FF]/u;

/** The demo phrases the mock translates both ways. */
const PHRASES: readonly (readonly [string, string])[] = [
  ["Your order has shipped and will arrive on Thursday.", "تم شحن طلبك وسيصل يوم الخميس."],
  ["Thank you for your order.", "شكرًا لطلبك."],
  ["We are sorry for the delay.", "نعتذر عن التأخير."],
  ["A soft cotton shirt for every day.", "قميص قطني ناعم لكل يوم."],
];
/** Words the mock rewrite swaps. */
const SWAPS: readonly (readonly [RegExp, string])[] = [
  [/\bvery good\b/giu, "excellent"],
  [/\bget\b/giu, "receive"],
  [/\bbuy\b/giu, "order"],
  [/\bASAP\b/gu, "as soon as possible"],
];

/** Tidies spacing, capitals and the closing stop. */
function fixGrammar(text: string): string {
  const tidy = text
    .replaceAll(/\s+/gu, " ")
    .replaceAll(/\s+([,.!?،])/gu, "$1")
    .replaceAll(/([,،])(?=\S)/gu, "$1 ")
    .replaceAll(/\bi\b/gu, "I")
    .trim();
  if (tidy === "") return tidy;
  const capital = ARABIC.test(tidy[0] ?? "") ? tidy : tidy.charAt(0).toUpperCase() + tidy.slice(1);
  const sentences = capital.replaceAll(
    /([.!?]) +([a-z])/gu,
    (_, stop: string, letter: string) => `${stop} ${letter.toUpperCase()}`,
  );
  return /[.!?؟]$/u.test(sentences) ? sentences : `${sentences}.`;
}

/** Runs one text action. */
export function mockTamoText(action: string, text: string): string {
  const isArabic = ARABIC.test(text);
  switch (action) {
    case "fix_grammar": {
      return fixGrammar(text);
    }
    case "shorten": {
      const words = text.trim().split(/\s+/u);
      const first = text.split(/(?<=[.!?؟])\s/u)[0] ?? text;
      return first.length < text.length
        ? first.trim()
        : `${words.slice(0, Math.max(3, Math.ceil(words.length * 0.6))).join(" ")}…`;
    }
    case "expand": {
      return `${fixGrammar(text)} ${isArabic ? "ويسعدنا أن نساعدك في أي وقت إذا احتجت إلى المزيد." : "If you need anything else, we are happy to help at any time."}`;
    }
    case "translate": {
      const found = PHRASES.find(([en, ar]) => en === text.trim() || ar === text.trim());
      if (found) return isArabic ? found[0] : found[1];
      return isArabic ? `(English) ${text.trim()}` : `(بالعربية) ${text.trim()}`;
    }
    case "formal": {
      return isArabic
        ? `عميلنا العزيز، ${fixGrammar(text)} مع خالص التحية.`
        : `Dear customer, ${fixGrammar(text).replaceAll(/\b(can't|won't|don't)\b/giu, (word: string) => ({ "can't": "cannot", "won't": "will not", "don't": "do not" })[word.toLowerCase()] ?? word)} Kind regards.`;
    }
    case "friendly": {
      return isArabic
        ? `أهلًا! ${fixGrammar(text)} شكرًا جزيلًا!`
        : `Hi there! ${fixGrammar(text)} Thanks so much!`;
    }
    case "rewrite": {
      const swapped = SWAPS.reduce(
        (result, [pattern, word]) => result.replace(pattern, word),
        text,
      );
      const fixed = fixGrammar(swapped);
      if (fixed !== fixGrammar(text)) return fixed;
      return isArabic ? `بعبارة أوضح: ${fixed}` : `Put more clearly: ${fixed}`;
    }
    default: {
      return `${fixGrammar(text)} (${action})`;
    }
  }
}
