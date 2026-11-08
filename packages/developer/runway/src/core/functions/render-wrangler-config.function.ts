/**
 * Stackra file contract:
 * Purpose: `renderWranglerConfig(code, settings)`, the wrangler config one Worker member deploys with: the member's
 *          own `wrangler.jsonc` (the code facts) with its operational settings from `runway.yaml` added in wrangler's
 *          snake_case keys. Only a set setting is written.
 * Boundary: pure; `code` is the parsed `wrangler.jsonc`. A key in both throws: the two homes share no key (ADR 0519).
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decisions 1 and 3); STA-1989.
 */
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import type { WorkerSettings } from "#core/types/worker-settings.type";

/** Keeps the keys whose value is set. */
const defined = (entries: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(entries).filter(([, value]) => value !== undefined));

/** The `observability` block of wrangler. */
function observability(o: NonNullable<WorkerSettings["observability"]>): Record<string, unknown> {
  const block = (enabled: boolean | undefined, more: Record<string, unknown> = {}) =>
    enabled === undefined ? undefined : defined({ enabled, ...more });
  return defined({
    enabled: o.logs || o.traces ? true : undefined,
    head_sampling_rate: o.headSamplingRate,
    redact_query_string: o.redactQueryString,
    issues: block(o.issues),
    logs: block(o.logs, { invocation_logs: o.invocationLogs }),
    traces: block(o.traces),
  });
}

/**
 * The config to deploy.
 *
 * @throws RunwayInvalidError when `code` already holds a key `settings` renders.
 * @example
 * renderWranglerConfig({ name: "api" }, { workersDev: false }); // { name: "api", workers_dev: false }
 */
export function renderWranglerConfig(
  code: Readonly<Record<string, unknown>>,
  settings: WorkerSettings,
): Record<string, unknown> {
  const rendered = defined({
    compatibility_date: settings.compatibilityDate,
    compatibility_flags: settings.compatibilityFlags,
    workers_dev: settings.workersDev,
    preview_urls: settings.previewUrls,
    observability: settings.observability && observability(settings.observability),
    limits: settings.limits && { cpu_ms: settings.limits.cpuMs },
    cache: settings.cache === undefined ? undefined : { enabled: settings.cache },
    upload_source_maps: settings.uploadSourceMaps,
    keep_vars: settings.keepVars,
    routes: settings.customDomains?.map((pattern) => ({ pattern, custom_domain: true })),
  });
  const clash = Object.keys(rendered).filter((key) => key in code);
  if (clash.length > 0)
    throw new RunwayInvalidError(
      "wrangler.jsonc",
      clash.map((key) => ({ path: key, message: "An operational setting: set it in runway.yaml" })),
    );
  return { ...code, ...rendered };
}
