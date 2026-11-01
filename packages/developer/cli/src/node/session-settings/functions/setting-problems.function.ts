/**
 * Stackra file contract:
 * Purpose: `settingProblems(text, options)`, the two rules of the session-setting check over one file's text (moved
 *          from `tools/scripts/session-settings.mjs`). (1) The session form is a problem everywhere: a set_config call
 *          whose third argument is not the literal `true`, a SET, SET LOCAL or SET SESSION statement of an `app` setting
 *          (also with `"app"` quoted), and a `-c` startup option of an `app` setting. (2) With `outsideAllowed`, any
 *          set_config call whose name is an `app.*` literal or not a literal at all is a problem too.
 * Boundary: pure; reads comments and strings alike. The check scans this package as well, so this file names the forms
 *           only in words and splices `app` into the texts it reports.
 * Runtime: node
 * Governing contract: ADR 0495 (decision 3); STA-1699.
 */

/** One problem of a file: its 1-based line and a short description. */
type SettingProblem = { readonly line: number; readonly text: string };

/** The setting namespace the rules guard, kept out of literal forms so this file passes its own check. */
const APP = "app";

/**
 * The top-level arguments of the call whose `(` is at `open` in `text`, split on commas outside quotes and nested
 * brackets; stops at the matching `)`.
 * shortcut: no template-literal nesting or regex literals; a call this misreads is allow-listed or rewritten.
 */
function argumentsAt(text: string, open: number): string[] {
  const args: string[] = [];
  let depth = 0;
  let quote = "";
  let current = "";
  for (let at = open + 1; at < text.length; at += 1) {
    const char = text[at] ?? "";
    if (quote !== "") {
      current += char;
      if (char === "\\") {
        at += 1;
        current += text[at] ?? "";
      } else if (char === quote) quote = "";
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      current += char;
    } else if (char === "(" || char === "[" || char === "{") {
      depth += 1;
      current += char;
    } else if (char === ")" && depth === 0) {
      args.push(current);
      return args;
    } else if (char === ")" || char === "]" || char === "}") {
      depth -= 1;
      current += char;
    } else if (char === "," && depth === 0) {
      args.push(current);
      current = "";
    } else current += char;
  }
  return args;
}

/**
 * The problems of one file's `text`: each as a short description with its 1-based line.
 *
 * @param text - the file's text.
 * @param options - `outsideAllowed` (default true): whether rule 2 applies to the file.
 * @example
 * settingProblems(sql); // [{ line: 1, text: "set_config with ..." }]
 */
export function settingProblems(
  text: string,
  { outsideAllowed = true }: { readonly outsideAllowed?: boolean } = {},
): SettingProblem[] {
  const problems: SettingProblem[] = [];
  const lineOf = (at: number): number => text.slice(0, at).split("\n").length;
  for (const match of text.matchAll(/set_config\s*\(/gi)) {
    const args = argumentsAt(text, match.index + match[0].length - 1);
    if (args.length >= 3 && args[2]?.trim().toLowerCase() !== "true")
      problems.push({
        line: lineOf(match.index),
        text: "set_config with a third argument other than the literal true sets a session-level setting",
      });
    const name = (args[0] ?? "").trim();
    const literal = /^(['"`])([^'"`]*)\1$/.exec(name);
    if (outsideAllowed && (literal === null || (literal[2] ?? "").toLowerCase().startsWith(`${APP}.`)))
      problems.push({
        line: lineOf(match.index),
        text: `set_config of an ${APP}.* setting (or of a name that is not a literal) outside the isolation driver; use CallIsolation`,
      });
  }
  for (const match of text.matchAll(/\bSET\s+(?:LOCAL\s+|SESSION\s+)?"?app"?\./gi))
    problems.push({
      line: lineOf(match.index),
      text: `\`${match[0]}\` sets an ${APP}.* setting by statement; use select set_config${"("}name, value, true) in the isolation driver`,
    });
  for (const match of text.matchAll(/-c\s*app\./gi))
    problems.push({
      line: lineOf(match.index),
      text: `a startup option -c ${APP}.* sets an ${APP}.* setting for every session of the pool`,
    });
  return problems;
}
