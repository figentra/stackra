/**
 * Stackra file contract:
 * Purpose: `sentryPlugin`, the source map upload after a build through `@sentry/vite-plugin`: the hidden maps go to
 *          the runway's Sentry project and are deleted from the output after the upload, so they are never served.
 * Boundary: names the project only. The organisation and the upload token are the release job's environment
 *           (`SENTRY_ORG`, `SENTRY_AUTH_TOKEN`), read by the Sentry plugin itself; this package never reads or passes
 *           a secret. Telemetry of the Sentry plugin is off.
 * Runtime: node
 * Governing contract: ADR 0184 (telemetry), ADR 0173 (no secret in a tool config), ADR 0295 (decision 5).
 */
import type { PluginOption } from "vite";

import type { ViteConfigOptions } from "#core/types/vite-config-options.type";

/**
 * The source map upload plugin.
 *
 * @param sourcemaps - the upload target and the runway's Sentry project.
 * @example
 * await sentryPlugin({ upload: "sentry", project: "acme-console" });
 */
export async function sentryPlugin(
  sourcemaps: NonNullable<ViteConfigOptions["sourcemaps"]>,
): Promise<PluginOption> {
  const { sentryVitePlugin } = await import("@sentry/vite-plugin");
  return sentryVitePlugin({
    project: sourcemaps.project,
    telemetry: false,
    sourcemaps: { filesToDeleteAfterUpload: ["**/*.map"] },
  });
}
