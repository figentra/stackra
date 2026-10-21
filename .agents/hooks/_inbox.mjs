// Does a path (or glob), or a shell command, reach ~/Secrets-inbox/ or the import confirm key? Shared by
// guard-bash, guard-paths and the OpenCode guard (decide.ts). An ACCIDENT guard, not a security boundary
// (ADR 0257): it stops an agent opening the inbox by habit; the guarantee is that `pnpm secrets:import` never
// outputs a value.
import { homedir } from "node:os";
import { resolve } from "node:path";

const INBOX = "Secrets-inbox";
const KEY = "secrets-confirm.key";

/** One path segment as a case-insensitive regex; glob characters become wildcards. */
function segmentRx(seg) {
  const body = seg
    .replace(/[.+^$()|\\]/g, "\\$&")
    .replace(/\*+/g, ".*")
    .replace(/\?/g, ".")
    .replace(/\{([^}]*)\}/g, (_, alts) => `(?:${alts.split(",").join("|")})`);
  try {
    return new RegExp(`^${body}$`, "i");
  } catch {
    return /^.*$/; // an unparseable glob is treated as matching anything
  }
}

/** True when a segment literally names the inbox (any case) or the key. */
export const namesInbox = (seg) => seg.toLowerCase() === INBOX.toLowerCase() || seg === KEY;

/**
 * `p` reaches the inbox when a segment literally names it, anywhere. Globs count only on a path rooted at
 * home (`~`, `$HOME`, an absolute path, or a relative one resolved against a known `cwd`): `p` reaches the
 * inbox when its segments match home then the inbox (`~/Secrets-inbo?`, `~/*`), descend with `**`, or `p` is
 * home or an ancestor of it and `recursive` (a Grep root, `grep -r`, `find`).
 */
export function reachesInbox(p, { recursive = false, home = homedir(), cwd } = {}) {
  if (typeof p !== "string" || !p) return false;
  const expanded = p
    .trim()
    .replace(/^~(?=\/|$)/, home)
    .replace(/\$\{HOME\}|\$HOME(?!\w)/g, home);
  if (expanded.split("/").some(namesInbox)) return true;
  if (/^[~$]/.test(expanded)) return false; // another user's home or an unknown variable
  if (!expanded.startsWith("/") && !cwd) return false;
  const segs = resolve(cwd ?? "/", expanded)
    .split("/")
    .filter(Boolean);
  const target = resolve(home, INBOX).split("/").filter(Boolean);
  for (let i = 0; i < segs.length; i++) {
    if (segs[i] === "**") return true;
    if (i >= target.length) return true;
    if (!segmentRx(segs[i]).test(target[i])) return false;
  }
  // Every inbox segment matched (a glob like `~/*`), or `p` is home / an ancestor and searched recursively.
  return segs.length >= target.length || recursive;
}

// ---- shell commands --------------------------------------------------------------------------------------
// shortcut: a small lexer (quotes, separators, `$(`), not a shell parser; `cd` is followed only in order, so a
// subshell's `cd` leaks into later segments. Upgrade to a real parser if a miss or a false positive slips through.

/**
 * Single-quoted spans blanked to `''`, by POSIX rules: a `'` inside double quotes or after a backslash is
 * literal, so `-m "it's $(x) it's"` keeps its `$(x)` (STA-254). An unclosed `"` runs to the end (fail closed).
 * Shared by guard-bash and the OpenCode guard.
 */
export const blankSingleQuotes = (c) =>
  c.replace(/\\[\s\S]|"(?:\\[\s\S]|[^"\\])*"?|'[^']*'/g, (m) => (m[0] === "'" ? "''" : m));

/** Split a command into segments of words; each word is its unquoted text. Separators outside quotes split. */
function lex(cmd) {
  const segs = [[]];
  let word = null;
  const end = () => {
    if (word !== null) segs.at(-1).push(word);
    word = null;
  };
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (c === "'" || c === '"') {
      const close = cmd.indexOf(c, i + 1);
      const stop = close === -1 ? cmd.length : close;
      word = (word ?? "") + cmd.slice(i + 1, stop);
      i = stop;
    } else if (c === "\\" && i + 1 < cmd.length) word = (word ?? "") + cmd[++i];
    else if (/\s/.test(c) && c !== "\n") end();
    else if (/[;&|\n()`]/.test(c)) {
      end();
      if (segs.at(-1).length) segs.push([]);
    } else word = (word ?? "") + c;
  }
  end();
  return segs.filter((s) => s.length);
}

/** Words before the command name: assignments, wrappers and shell keywords. */
const PREFIX = new Set([
  "sudo",
  "command",
  "exec",
  "time",
  "nohup",
  "do",
  "then",
  "else",
  "!",
  "{",
]);

/**
 * Per command: which flags take a value (`value`, kept as a possible path), a pattern (`pattern`), a program
 * (`program`) or a file to read (`file`, a path); and what the first positional is when no flag gave it.
 * Booleans (grep `-v`, `-F`, `-r`; sed `-n`) are not listed, so the word after them is not swallowed.
 */
const GREP = {
  value: [
    "-A",
    "-B",
    "-C",
    "-m",
    "-d",
    "-D",
    "--include",
    "--exclude",
    "--exclude-dir",
    "--max-count",
  ],
  pattern: ["-e", "--regexp"],
  file: ["-f", "--file"],
  first: "pattern",
};
const AWK = { value: ["-F", "-v"], file: ["-f"], first: "program" };
const COMMANDS = {
  grep: GREP,
  egrep: GREP,
  fgrep: GREP,
  rg: {
    ...GREP,
    value: ["-A", "-B", "-C", "-m", "-g", "--glob", "-t", "--type", "-T", "--type-not", "-j", "-M"],
  },
  ag: { value: ["-A", "-B", "-C", "-m", "-G"], first: "pattern" },
  sed: { program: ["-e", "--expression"], file: ["-f", "--file"], first: "program" },
  awk: AWK,
  gawk: AWK,
  perl: { program: /^-[a-zA-Z]*[eE]$/, first: "path" }, // `-e`, `-ne`, `-lne`; else the first word is a script
};
/** Flags whose value is prose (an issue title, a commit message), never a path, unless it runs a command. */
const PROSE_FLAG = /^(?:--title|--body|--message|-m)$/;
const PROSE_EQ = /^(?:--title|--body|--message)=/;
const RUNS = /\$\(|`/;
const LITERAL = /secrets-inbox|secrets-confirm\.key/i;
const URL = /^[a-z][a-z0-9+.-]*:\/\//i;
const RECURSIVE =
  /\b(?:rg|ag|find|tar|zip|rsync|du)\b|\bgrep\b.*\s(?:-\w*[rR]\w*|--recursive|--directories=recurse|-d\s*recurse)\b|\bcp\b.*\s(?:-\w*[rRa]\w*|--recursive|--archive)\b/;
const has = (list, w) => (list instanceof RegExp ? list.test(w) : (list ?? []).includes(w));

/**
 * Sort a segment's words: `paths` are checked as paths (literal name, home-rooted globs, recursive reads);
 * `texts` (programs, and prose that runs a command) only for the literal name; exempt: a grep/rg/ag pattern
 * and plain prose values. A pattern that starts with `~` or `$` is checked as a path.
 */
function classify(words) {
  let i = 0;
  while (i < words.length && (PREFIX.has(words[i]) || /^\w+=/.test(words[i]))) i++;
  const name = (words[i] ?? "").split("/").pop();
  const spec = COMMANDS[name];
  const paths = words.slice(0, i + 1); // assignment values (`x=~/…`) are paths too
  const texts = [];
  let firstSeen = false;
  const pattern = (v) => /^[~$]/.test(v) && paths.push(v);
  for (let j = i + 1; j < words.length; j++) {
    const w = words[j];
    if (PROSE_FLAG.test(w) || PROSE_EQ.test(w)) {
      const v = PROSE_FLAG.test(w) ? (words[++j] ?? "") : w;
      if (RUNS.test(v)) paths.push(v);
    } else if (spec && has(spec.value, w)) paths.push(w, words[++j] ?? "");
    else if (spec && has(spec.file, w)) {
      paths.push(words[++j] ?? "");
      firstSeen = true;
    } else if (spec && has(spec.pattern, w)) {
      pattern(words[++j] ?? "");
      firstSeen = true;
    } else if (spec && has(spec.program, w)) {
      texts.push(words[++j] ?? "");
      firstSeen = true;
    } else if (spec && spec.first !== "path" && !firstSeen && !w.startsWith("-")) {
      firstSeen = true;
      if (spec.first === "pattern") pattern(w);
      else texts.push(w);
    } else paths.push(w);
  }
  return { name, paths, texts, operands: paths.slice(i + 1) };
}

/** A path word's tokens: split on shell punctuation, `@file` and `file://` prefixes dropped. */
const tokensOf = (w) =>
  w
    .split(/[\s=<>()+;|&`'"]+/)
    .map((t) => t.replace(/^@/, "").replace(/^file:\/\//i, ""))
    .filter(Boolean);

/**
 * True when a shell command could reach the inbox: a word (after unquoting) that names it, except a grep
 * pattern or plain prose; or a path token whose home-rooted glob or recursive read could match it. `cwd` is
 * the shell's directory; a `cd` moves it, and a recursive read with no path operand reads it.
 */
export function commandReachesInbox(cmd, { cwd, home = homedir() } = {}) {
  let dir = cwd;
  for (const words of lex(cmd)) {
    const { name, paths, texts, operands } = classify(words);
    if (texts.some((w) => LITERAL.test(w))) return true;
    const recursive = RECURSIVE.test(paths.join(" "));
    const opts = { recursive, home, cwd: dir };
    const tokens = paths.flatMap(tokensOf);
    if (tokens.some((t) => (URL.test(t) ? LITERAL.test(t) : reachesInbox(t, opts)))) return true;
    // `cd ~ && rg x`, `du -a`: no path operand means the current directory.
    if (recursive && dir && !operands.some((w) => !w.startsWith("-")) && reachesInbox(".", opts))
      return true;
    if (name === "cd" || name === "pushd") {
      const to = operands.find((w) => !/^-[LP]$/.test(w)) ?? "~";
      const expanded = to.replace(/^(~|\$HOME|\$\{HOME\})(?=\/|$)/, home);
      dir =
        /^[~$]/.test(expanded) || (!expanded.startsWith("/") && !dir)
          ? undefined
          : resolve(dir ?? "/", expanded);
    }
  }
  return false;
}
