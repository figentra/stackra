/**
 * Stackra file contract:
 * Purpose: `checkSubmodules(text, declared)`, the `submodules` part of the `layout` rule: `git clone --recursive`
 *          fetches every submodule, so a repository others clone carries only submodules it declares in package.json
 *          `stackra.layout.submodules` (path to the reason anyone can clone it), each reachable without credentials
 *          (no ssh or local URL); a declaration with no submodule behind it is stale.
 * Boundary: pure; `text` is the root `.gitmodules` (undefined when absent), `declared` the package.json map.
 * Runtime: node
 * Governing contract: ADR 0526 (decision 4: a root difference is declared with its reason).
 */
import { submodulesOf } from "#node/functions/submodules-of.function";

/**
 * A URL an anonymous clone cannot fetch, or one that carries a credential: ssh (`git@host:`, `ssh://`, `git+ssh://`),
 * `file://`, a local path, or user info before the host (`https://user:token@host/…`).
 */
const CREDENTIALED_URL =
  /^(?:[\w.-]+@[\w.-]+:|(?:git\+)?ssh:\/\/|file:\/\/|\/|~|[a-z][\w+.-]*:\/\/[^/]*@)/i;

/** A URL fit to print: any user info before the host masked, so a finding never echoes a credential. */
const shown = (url: string): string =>
  url === "" ? "no url" : url.replace(/:\/\/[^/]*@/, "://***@");

/**
 * The submodule findings of a repository.
 *
 * @param text - the root `.gitmodules`, or undefined when there is none.
 * @param declared - package.json `stackra.layout.submodules`: a submodule path and the reason it is public.
 * @example
 * checkSubmodules('[submodule "x"]\n\tpath = x\n\turl = https://example.com/x.git\n', {}); // one finding
 */
export function checkSubmodules(
  text: string | undefined,
  declared: Readonly<Record<string, string>> = {},
): string[] {
  const modules = text === undefined ? [] : submodulesOf(text);
  const out: string[] = [];
  for (const { path, url } of modules) {
    const reason = Object.hasOwn(declared, path) ? declared[path]?.trim() : undefined;
    if (!reason)
      out.push(
        `.gitmodules: submodule ${path} (${shown(url)}) is not declared; \`git clone --recursive\` fetches every submodule, so remove it, or declare its path in package.json stackra.layout.submodules with the reason anyone can clone it (ADR 0526 d4)`,
      );
    else if (url === "" || CREDENTIALED_URL.test(url))
      out.push(
        `.gitmodules: submodule ${path} needs a URL an anonymous clone can fetch (https or a relative path), not ${shown(url)} (ADR 0526 d4)`,
      );
  }
  const paths = new Set(modules.map((module) => module.path));
  for (const path of Object.keys(declared))
    if (!paths.has(path))
      out.push(
        `package.json: stackra.layout.submodules declares ${path}, but .gitmodules has no such submodule; remove the declaration (ADR 0526 d4)`,
      );
  return out;
}
