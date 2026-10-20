// Does a path (or glob) reach ~/Secrets-inbox/ or the import confirm key? Shared by guard-bash and
// guard-paths. An ACCIDENT guard, not a security boundary (ADR 0257): it stops an agent opening the inbox
// by habit; the guarantee is that `pnpm secrets:import` never outputs a value.
import { homedir } from "node:os";
import { resolve } from "node:path";

const INBOX = "Secrets-inbox";
const KEY = "secrets-confirm.key";
const GLOB = /[*?[\]{}]/;

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

/** True when a segment names the inbox or the key, literally or by a glob that is not just `*`. */
export function namesInbox(seg) {
  if (!GLOB.test(seg)) return seg.toLowerCase() === INBOX.toLowerCase() || seg === KEY;
  if (/^[*?]+$/.test(seg)) return false; // a bare wildcard is handled by the ancestor rule
  return segmentRx(seg).test(INBOX) || segmentRx(seg).test(KEY);
}

/**
 * `p` reaches the inbox when a segment names it, or when `p` is the home directory (or an ancestor of it)
 * and `recursive` (a Grep root) or the rest of the glob descends (`**`, or `*` right below home).
 */
export function reachesInbox(p, { recursive = false, home = homedir() } = {}) {
  if (typeof p !== "string" || !p) return false;
  const expanded = p.trim().replace(/^(~|\$HOME|\$\{HOME\})(?=\/|$)/, home);
  const segs = expanded.split("/").filter(Boolean);
  if (segs.some(namesInbox)) return true;
  if (!expanded.startsWith("/")) return false;
  const target = resolve(home, INBOX).split("/").filter(Boolean);
  for (let i = 0; i < segs.length; i++) {
    if (segs[i] === "**") return true;
    if (i >= target.length) return true;
    if (!segmentRx(segs[i]).test(target[i])) return false;
  }
  // Every inbox segment matched (a glob like `~/*`), or `p` is home / an ancestor and searched recursively.
  return segs.length >= target.length || recursive;
}
