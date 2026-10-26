/**
 * Stackra file contract:
 * Purpose: `answerProbe`, the health routes of the server app: `GET /healthz` (liveness, 200 until a drain starts)
 *          and `GET /readyz` (runs every `HealthIndicator` with a timeout; 200 when none is down).
 * Boundary: no HTTP of its own; Encore serves and hands the method and path here. An indicator that throws or does not
 *           answer in time counts as `down`; `degraded` still serves, so it is ready. The body carries each status by
 *           name, never an indicator's detail. Any other route answers `undefined`.
 * Runtime: node
 * Governing contract: registry gap R-27 (owner decision 23); ADR 0295 (decision 8); ADR 0184.
 */
import { HealthStatus } from "@stackra/contracts";
import type { HealthIndicator } from "@stackra/contracts";

import { HEALTH_TIMEOUT_MS } from "#server/constants/health-timeout.constant";
import type { ProbeAnswer } from "#server/types/probe-answer.type";

/** One indicator's status, `down` when it throws or runs past the timeout. */
async function statusOf(indicator: HealthIndicator): Promise<HealthStatus> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<HealthStatus>((resolve) => {
    timer = setTimeout(() => resolve(HealthStatus.Down), HEALTH_TIMEOUT_MS);
  });
  try {
    return await Promise.race([indicator.check().then((report) => report.status), timeout]);
  } catch {
    return HealthStatus.Down;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Answers a health route, or `undefined` for any other.
 *
 * @example
 * const answer = await answerProbe("GET", "/readyz", { alive: app.ready, indicators });
 */
export async function answerProbe(
  method: string,
  path: string,
  state: { readonly alive: () => boolean; readonly indicators: readonly HealthIndicator[] },
): Promise<ProbeAnswer | undefined> {
  if (method !== "GET") return undefined;
  if (path === "/healthz") {
    return state.alive()
      ? { status: 200, body: { status: "up" } }
      : { status: 503, body: { status: "draining" } };
  }
  if (path !== "/readyz") return undefined;

  const entries = await Promise.all(
    state.indicators.map(async (indicator) => [indicator.name, await statusOf(indicator)] as const),
  );
  const body = Object.fromEntries(entries);
  const statuses = entries.map(([, status]) => status);
  const ready = state.alive() && !statuses.includes(HealthStatus.Down);
  return { status: ready ? 200 : 503, body };
}
