/**
 * Stackra file contract:
 * Purpose: `macroHint(message, macros)`, what a migration's compile refusal adds when the migration calls a blueprint
 *          method no macro supplied (`t.belongsToTenant is not a function`): the macros gen did collect, and where a
 *          missing one usually went.
 * Boundary: pure; returns `""` for any other compile error, so the refusal reads as before.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (macros of a migration); STA-2006.
 */

/**
 * The hint for a compile error `message`, given the macro classes gen collected.
 *
 * @example
 * macroHint("t.belongsToTenant is not a function", [DataClassificationMacro]);
 * // " (no macro supplied `t.belongsToTenant`; gen collected DataClassificationMacro. ...)"
 */
export function macroHint(message: string, macros: readonly unknown[]): string {
  const missing = /\bt\.(\w+) is not a function/.exec(message)?.[1];
  if (missing === undefined) return "";
  const names = macros
    .map((macro) => (typeof macro === "function" ? macro.name : ""))
    .filter((name) => name !== "");
  return (
    ` (no macro supplied \`t.${missing}\`; gen collected ${names.length === 0 ? "no macro" : names.join(", ")}. ` +
    "A macro is missing when its package's ./node does not load (see the migration_load_failed above) or is not a " +
    "declared dependency)"
  );
}
