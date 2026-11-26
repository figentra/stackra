/**
 * Stackra file contract:
 * Purpose: `encoreDaemonSocketPath(platform, env)`, where the current user's Encore daemon listens for its CLI:
 *          `encored.sock` in the `encore` folder of Go's `os.UserCacheDir()` (`~/Library/Caches` on macOS,
 *          `$XDG_CACHE_HOME` or `~/.cache` elsewhere on Unix, `%LocalAppData%` on Windows). `undefined` when Go would
 *          find no cache folder either (no home, or a relative `XDG_CACHE_HOME`), so no daemon can be listening there.
 * Boundary: pure; reads only the values it is given.
 * Runtime: node
 * Governing contract: STA-2794 (a second `stackra dev` reuses the user's own Encore daemon).
 */
import { isAbsolute, join } from "node:path";

/**
 * The current user's Encore daemon socket.
 *
 * @param platform - the operating system (`process.platform`).
 * @param env - the environment the daemon was started with (`process.env`).
 * @example
 * encoreDaemonSocketPath("darwin", { HOME: "/Users/a" }); // "/Users/a/Library/Caches/encore/encored.sock"
 */
export function encoreDaemonSocketPath(
  platform: NodeJS.Platform,
  env: Readonly<Record<string, string | undefined>>,
): string | undefined {
  const cache = (() => {
    if (platform === "win32") return env["LocalAppData"] || env["LOCALAPPDATA"] || undefined;
    const home = env["HOME"];
    if (platform === "darwin") return home ? join(home, "Library", "Caches") : undefined;
    const xdg = env["XDG_CACHE_HOME"];
    if (xdg) return isAbsolute(xdg) ? xdg : undefined;
    return home ? join(home, ".cache") : undefined;
  })();
  return cache === undefined ? undefined : join(cache, "encore", "encored.sock");
}
