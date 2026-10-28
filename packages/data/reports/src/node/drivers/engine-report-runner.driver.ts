/**
 * Stackra file contract:
 * Purpose: `EngineReportRunnerDriver`, the `engine` driver of the `ReportRunner` port each generated report query
 *          injects: it reads the report's declaration from its `report` kind record, finds its source model, takes the
 *          running call's time zone, drops the columns the caller may not see (ADR 0470 decision 6), and hands the run
 *          to the configured `ReportEngine`.
 * Boundary: implements the port only; it compiles and reads nothing itself. The engine is whichever driver
 *           `ReportsConfig.engine` selects in generated wiring (`postgres` today). The source model comes from
 *           `registerReportSources` (generated wiring), looked up on the class and its ancestors. The time zone is the
 *           call's (`ContextStorage`), UTC outside a call. Column visibility: the decision point checks each column
 *           permission for the call's actor and scope; with no decision point bound, or outside a call, no permission
 *           is held, so every restricted or classified column is dropped (fail closed).
 * Runtime: node
 * Governing contract: ADR 0470 (decisions 3, 6 and 8); ADR 0142 (drivers behind a port); ADR 0294 (decisions 16 and 25);
 *                     ADR 0305 (rule 5: the partner is the type argument).
 */
import type { ContextStorage } from "@stackra/actions/contracts";
import { Driver, kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { Actor, ScopeRef } from "@stackra/contracts";
import { type Permission, permissionKey, type PolicyDecisionPointService } from "@stackra/iam";

import type { ReportEngine } from "#contracts/ports/report-engine.port";
import { hiddenReportColumns } from "#core/functions/hidden-report-columns.function";
import { ReportRunner } from "#core/ports/report-runner.port";
import type { ReportClass } from "#core/types/report-class.type";
import type { ReportDeclaration } from "#core/types/report-declaration.type";
import type { ReportRequest } from "#core/types/report-request.type";
import type { ReportResult } from "#core/types/report-result.type";
import { REPORT_SOURCES } from "#node/constants/report-sources.constant";
import { visibleRequest } from "#node/functions/visible-request.function";

/** What the runner reads from the running call. */
type CallValues = {
  readonly timeZone?: string;
  readonly actor?: Actor;
  readonly scope?: ScopeRef;
};

/**
 * Runs reports through the configured engine.
 *
 * @example
 * // generated wiring: { port: ReportRunner, candidates: { engine: … }, deps: { engine: [ReportEngine, ContextStorage, PolicyDecisionPointService] } }
 */
export class EngineReportRunnerDriver extends Driver(ReportRunner) {
  /** The configured report engine. */
  private readonly engine: ReportEngine;

  /** The running call, for its time zone, actor and scope. */
  private readonly storage: ContextStorage;

  /** Decides column permissions; absent when the host binds none, which holds none. */
  private readonly policy: PolicyDecisionPointService | undefined;

  /**
   * @param engine - the report engine `ReportsConfig.engine` selects.
   * @param storage - the running call's context.
   * @param policy - the decision point column permissions are checked with.
   */
  constructor(engine: ReportEngine, storage: ContextStorage, policy?: PolicyDecisionPointService) {
    super();
    this.engine = engine;
    this.storage = storage;
    this.policy = policy;
  }

  /**
   * Implements `ReportRunner.run`, documented there.
   *
   * @throws TypeError for a class that is no report, or one with no registered source model.
   * @throws ForbiddenError when the request filters on a column the caller may not see, or every measure it names is
   *         hidden.
   */
  async run(report: ReportClass, request: ReportRequest): Promise<ReportResult> {
    const record = kindOf(report);
    if (record?.kind !== "report")
      throw new TypeError(`${report.name} extends no Report<S>({ key, dimensions, measures })`);
    const declaration = record.options as unknown as ReportDeclaration;
    const source = this.sourceOf(report);
    const context = this.storage.current() as CallValues | undefined;
    const hidden = hiddenReportColumns(declaration, await this.held(declaration, context));
    return this.engine.run({
      declaration,
      source,
      request: visibleRequest(request, hidden),
      timeZone: context?.timeZone ?? "UTC",
    });
  }

  /** The column permission keys of `declaration` the call's actor holds where it acts. */
  private async held(
    declaration: ReportDeclaration,
    context: CallValues | undefined,
  ): Promise<Set<string>> {
    const keys = new Set(
      [...Object.values(declaration.dimensions), ...Object.values(declaration.measures)].flatMap(
        (column) =>
          column.permission === undefined
            ? []
            : [permissionKey(column.permission as Permission | string)],
      ),
    );
    const { policy } = this;
    const actor = context?.actor;
    if (keys.size === 0 || policy === undefined || actor === undefined) return new Set();
    const options = context?.scope === undefined ? {} : { scope: context.scope };
    const checks = await Promise.all(
      [...keys].map(async (key) => [key, await policy.check(actor, key, options)] as const),
    );
    return new Set(checks.filter(([, allowed]) => allowed).map(([key]) => key));
  }

  /**
   * The source model of `report` or its nearest ancestor.
   *
   * @throws TypeError when none is registered.
   */
  private sourceOf(report: ReportClass): AnyClass {
    for (
      let current: object | null = report;
      current !== null && current !== Function.prototype;
      current = Object.getPrototypeOf(current) as object | null
    ) {
      const model = REPORT_SOURCES.get(current);
      if (model !== undefined) return model;
    }
    throw new TypeError(
      `No source model is registered for ${report.name}: gen registers its type argument with registerReportSources`,
    );
  }
}
