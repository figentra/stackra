/**
 * Stackra file contract:
 * Purpose: Semgrep test fixture for `stackra.dynamic-code` (`ruleid:` lines must match, `ok:` lines must not).
 * Boundary: never imported or run; `semgrep --test` reads it (`pnpm security:sast --test`).
 * Runtime: none
 * Governing contract: tools/security/semgrep/rules/dynamic-code.yml; ADR 0187 decision 3; STA-2821.
 */
import * as vm from "node:vm";

declare const expression: string;

export function examples(): unknown[] {
  return [
    // ruleid: stackra.dynamic-code
    eval(expression),
    // ruleid: stackra.dynamic-code
    new Function("a", expression),
    // ruleid: stackra.dynamic-code
    vm.runInNewContext(expression, {}),
    // ruleid: stackra.dynamic-code
    setTimeout("refresh()", 10),
    // ok: stackra.dynamic-code
    setTimeout(() => expression, 10),
    // ok: stackra.dynamic-code
    JSON.parse(expression),
  ];
}
