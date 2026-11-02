/**
 * Stackra file contract:
 * Purpose: `workerSettingsOf(settings, memberKey)`, the settings one Worker member deploys with: the built-in base,
 *          the member's preset, the target's `defaults`, then the member's own keys, later layers winning key by key.
 *          The target's `compatibilityDate` (the root's) is the fallback under every layer.
 * Boundary: pure; reads parsed `targets.cloudflare-workers` settings. The environment layer arrives with the renderer.
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decisions 1 and 2); STA-1988.
 */
import { WORKER_BASE } from "#core/constants/worker-base.constant";
import { WORKER_PRESETS } from "#core/constants/worker-presets.constant";
import { WORKER_SETTINGS_SCHEMA } from "#core/constants/worker-settings-schema.constant";
import type { WorkerPreset } from "#core/enums/worker-preset.enum";
import type { WorkerSettings } from "#core/types/worker-settings.type";

/** What this function reads of the target. */
type Target = {
  readonly compatibilityDate?: string;
  readonly defaults?: WorkerSettings;
  readonly members: Readonly<Record<string, { readonly preset?: WorkerPreset } & WorkerSettings>>;
};

const isObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

/** Merges plain objects key by key, `over` winning; arrays and scalars replace. */
function merge(under: WorkerSettings, over: WorkerSettings): WorkerSettings {
  const out: Record<string, unknown> = { ...under };
  for (const [key, value] of Object.entries(over)) {
    const before = out[key];
    out[key] =
      isObject(value) && isObject(before)
        ? merge(before, value)
        : value === undefined
          ? before
          : value;
  }
  return out as WorkerSettings;
}

/**
 * The merged settings of `memberKey`.
 *
 * @example
 * workerSettingsOf({ compatibilityDate: "2026-10-01", members: { api: { preset: "api" } } }, "api")
 *   .compatibilityDate; // "2026-10-01"
 */
export function workerSettingsOf(target: Target, memberKey: string): WorkerSettings {
  const own = target.members[memberKey] ?? {};
  // The member also holds path, kind, ids and the like; only the operational keys are settings.
  const member = Object.fromEntries(
    Object.entries(own).filter(([key]) => key in WORKER_SETTINGS_SCHEMA.shape),
  ) as WorkerSettings;
  const root = target.compatibilityDate ? { compatibilityDate: target.compatibilityDate } : {};
  return [
    root,
    WORKER_BASE,
    own.preset ? WORKER_PRESETS[own.preset] : {},
    target.defaults ?? {},
    member,
  ].reduce<WorkerSettings>((acc, layer) => merge(acc, layer), {});
}
