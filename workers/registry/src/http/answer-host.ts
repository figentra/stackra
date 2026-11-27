/**
 * Stackra file contract:
 * Purpose: `answerHost`: the settings one request is answered with, `host` set to the host the request came in on
 *          when the Worker serves it (REGISTRY_HOST or one of REGISTRY_ALIAS_HOSTS), else left at the main host. So
 *          package metadata read on `npm.stackra.figentra.com` names tarballs on that host, and an existing `.npmrc`,
 *          lockfile or auth line for it keeps working while new installs use `npm.figentra.com` (STA-2892).
 * Boundary: pure; only a listed host is ever echoed back, so a forged Host header cannot put another host into a URL.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 1 and 19); ADR 0025 (npm.figentra.com).
 */
import type { RegistrySettings } from "#src/interfaces/registry-settings.interface";

/**
 * `settings` for a request to `url`.
 *
 * @example
 * answerHost(settings, new URL("https://npm.stackra.figentra.com/@stackra/core")).host; // "npm.stackra.figentra.com"
 */
export function answerHost(settings: RegistrySettings, url: URL): RegistrySettings {
  const host = url.hostname.toLowerCase();
  return host !== settings.host && settings.hosts.includes(host) ? { ...settings, host } : settings;
}
