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
  const expanded = p.trim().replace(/^(~|\$HOME|\$\{HOME\})(?=\/|$)/, home);
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
/** Commands whose first positional argument (or `-e` value) is a pattern or a program, not a path. */
const PATTERN_FIRST = new Set(["grep", "egrep", "fgrep", "rg", "ag", "sed", "awk", "gawk", "perl"]);
/** Flags whose value is prose (an issue title, a commit message), never a path. */
const PROSE_FLAG = /^(?:--title|--body|--message|-m)$/;
const URL = /^[a-z][a-z0-9+.-]*:\/\//i;
const RECURSIVE =
  /\b(?:rg|ag|find|tar|zip|rsync|du)\b|\bgrep\b.*\s(?:-\w*[rR]\w*|--recursive|--directories=recurse|-d\s*recurse)\b|\bcp\b.*\s(?:-\w*[rRa]\w*|--recursive|--archive)\b/;

/** The words of a segment that could be paths: patterns, programs, prose values and URLs dropped. */
function pathWords(words) {
  let i = 0;
  while (i < words.length && (PREFIX.has(words[i]) || /^\w+=/.test(words[i]))) i++;
  const name = (words[i] ?? "").split("/").pop();
  const kept = [];
  let patternSeen = false;
  for (let j = i; j < words.length; j++) {
    const w = words[j];
    if (PROSE_FLAG.test(w) || (name === "perl" && /^-[a-zA-Z]*[eE]$/.test(w))) {
      j++; // the value is prose or a perl program
      if (name === "perl") patternSeen = true;
    } else if (/^(?:--title|--body|--message)=/.test(w) || URL.test(w)) continue;
    else if (PATTERN_FIRST.has(name) && /^(?:-e|--regexp|--expression)$/.test(w)) {
      j++;
      patternSeen = true;
    } else if (PATTERN_FIRST.has(name) && /^(?:-[FvdD]|-[ABCm]|--include|--exclude)$/.test(w)) {
      kept.push(w, words[++j] ?? ""); // a flag value: keep it, but it is not the pattern
    } else if (PATTERN_FIRST.has(name) && j > i && !patternSeen && !w.startsWith("-")) {
      patternSeen = true; // the first positional is the regex or the sed/awk program
      if (name === "perl") kept.push(w); // without -e, perl's first argument is a script file
    } else kept.push(w);
  }
  return { name, kept };
}

/**
 * True when a shell command could reach the inbox: a path-like token (after unquoting) that names it, or a
 * home-rooted glob or recursive read that could match it. `cwd` is the shell's directory; a `cd` moves it.
 */
export function commandReachesInbox(cmd, { cwd, home = homedir() } = {}) {
  let dir = cwd;
  for (const words of lex(cmd)) {
    const { name, kept } = pathWords(words);
    const recursive = RECURSIVE.test(kept.join(" "));
    const tokens = kept.flatMap((w) => w.split(/[\s=<>()+;|&`'"]+/)).filter(Boolean);
    const opts = { recursive, home, cwd: dir };
    if (tokens.some((t) => !URL.test(t) && reachesInbox(t, opts))) return true;
    if (name === "cd" || name === "pushd") {
      const to = kept.slice(1).find((w) => !/^-[LP]$/.test(w)) ?? "~";
      const expanded = to.replace(/^(~|\$HOME|\$\{HOME\})(?=\/|$)/, home);
      dir =
        /^[~$]/.test(expanded) || (!expanded.startsWith("/") && !dir)
          ? undefined
          : resolve(dir ?? "/", expanded);
    }
  }
  return false;
}
