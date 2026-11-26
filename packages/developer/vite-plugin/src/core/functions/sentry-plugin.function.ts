/**
 * Stackra file contract:
 * Purpose: `sentryPlugin`, the source map upload after a build through `@sentry/vite-plugin`: the hidden maps go to
 *          the runway's Sentry project and are deleted from the output after the upload, so they are never served.
 *          `@sentry/vite-plugin` is an optional peer, loaded here and only here: a member without Sentry never installs it
 *          (nor the Sentry CLI binary it downloads), and with Sentry on and the peer missing one error says what to add.
 * Boundary: names the project only. The organisation and the upload token are the release job's environment
 *           (`SENTRY_ORG`, `SENTRY_AUTH_TOKEN`), read by the Sentry plugin itself; this package never reads or passes
 *           a secret. Telemetry of the Sentry plugin is off.
 * Runtime: node
 * Governing contract: ADR 0184 (telemetry), ADR 0173 (no secret in a tool config), ADR 0295 (decision 5).
 */
import type * as SentryVitePlugin from "@sentry/vite-plugin";
import type { PluginOption } from "vite";

import { importOptionalPeer } from "#core/functions/import-optional-peer.function";
import type { ViteConfigOptions } from "#core/types/vite-config-options.type";

/**
 * The source map upload plugin.
 *
 * @param sourcemaps - the upload target and the runway's Sentry project.
 * @param load - loads `@sentry/vite-plugin`; the package's own import by default.
 * @example
 * await sentryPlugin({ upload: "sentry", project: "acme-console" });
 */
export async function sentryPlugin(
  sourcemaps: NonNullable<ViteConfigOptions["sourcemaps"]>,
  load: () => Promise<typeof SentryVitePlugin> = () => import("@sentry/vite-plugin"),
): Promise<PluginOption> {
  const { sentryVitePlugin } = await importOptionalPeer(
    load,
    "@sentry/vite-plugin",
    "Uploading source maps to Sentry needs @sentry/vite-plugin, an optional peer of @stackra/vite-plugin: add it to this member (`pnpm add -D @sentry/vite-plugin`), or turn the `sourcemaps` option off",
  );
  return sentryVitePlugin({
    project: sourcemaps.project,
    telemetry: false,
    sourcemaps: { filesToDeleteAfterUpload: ["**/*.map"] },
  });
}
