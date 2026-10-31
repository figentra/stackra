/**
 * Stackra file contract:
 * Purpose: `mockTamoDraft`, the offline mock's first draft from the person's words, in English or Arabic.
 * Boundary: demo only: no model, the same output for the same input every time.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (a deterministic mock provider for the playground).
 */
/** Arabic letters. */
const ARABIC = /[\u0600-\u06FF]/u;

/** A first draft from the person's words. */
export function mockTamoDraft(prompt: string, locale: string): string {
  const topic = prompt.trim().replace(/[.!?؟]+$/u, "");
  return locale.startsWith("ar") || ARABIC.test(prompt)
    ? `مرحبًا،\n\nبخصوص ${topic}: يسعدنا إبلاغك بأننا نعمل على ذلك وسنعود إليك قريبًا.\n\nمع التحية`
    : `Hello,\n\nAbout ${topic}: we are on it and will get back to you shortly.\n\nBest regards`;
}
