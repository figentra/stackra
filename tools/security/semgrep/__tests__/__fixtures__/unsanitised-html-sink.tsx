/**
 * Stackra file contract:
 * Purpose: Semgrep test fixture for `stackra.unsanitised-html-sink` (`ruleid:` lines must match, `ok:` must not).
 * Boundary: never imported or run; `semgrep --test` reads it (`pnpm security:sast --test`).
 * Runtime: none
 * Governing contract: tools/security/semgrep/rules/unsanitised-html-sink.yml; ADR 0187 decision 3; STA-2821.
 */
import { sanitizeHtml } from "@stackra/csp";

declare const body: string;
declare const node: HTMLElement;

export function Unsafe() {
  // ruleid: stackra.unsanitised-html-sink
  return <div dangerouslySetInnerHTML={{ __html: body }} />;
}

export function Safe() {
  // ok: stackra.unsanitised-html-sink
  return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }} />;
}

export function dom(): void {
  // ruleid: stackra.unsanitised-html-sink
  node.innerHTML = body;
  // ruleid: stackra.unsanitised-html-sink
  node.insertAdjacentHTML("beforeend", body);
  // ok: stackra.unsanitised-html-sink
  node.innerHTML = "";
  // ok: stackra.unsanitised-html-sink
  node.innerHTML = sanitizeHtml(body);
  // ok: stackra.unsanitised-html-sink
  node.textContent = body;
}
