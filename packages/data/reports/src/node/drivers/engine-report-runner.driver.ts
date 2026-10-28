/**
 * Stackra file contract:
 * Purpose: `EngineReportRunnerDriver`, the `engine` driver of the `ReportRunner` port each generated report query
 *          injects: it reads the report's declaration from its `report` kind record, finds its source model, takes the
 *          running call's time zone, and hands the run to the configured `ReportEngine`.
 * Boundary: implements the port only; it compiles and reads nothing itself. The engine is whichever driver
 *           `ReportsConfig.engine` selects in generated wiring (`postgres` today). The source model comes from
 *           `registerReportSources` (generated wiring), looked up on the class and its ancestors. The time zone is the
 *           call's (`ContextStorage`), UTC outside a call.
 * Runtime: node
 * Governing contract: ADR 0470 (decisions 3 and 8); ADR 0142 (drivers behind a port); ADR 0294 (decisions 16 and 25);
 *                     ADR 0305 (rule 5: the partner is the type argument).
 */
import type { ContextStorage } from "@stackra/actions/contracts";
import { Driver, kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

import type { ReportEngine } from "#contracts/ports/report-engine.port";
import { ReportRunner } from "#core/ports/report-runner.port";
import type { ReportClass } from "#core/types/report-class.type";
import type { ReportDeclaration } from "#core/types/report-declaration.type";
import type { ReportRequest } from "#core/types/report-request.type";
import type { ReportResult } from "#core/types/report-result.type";
import { REPORT_SOURCES } from "#node/constants/report-sources.constant";

/**
 * Runs reports through the configured engine.
 *
 * @example
 * // generated wiring: { port: ReportRunner, candidates: { engine: … }, deps: { engine: [ReportEngine, ContextStorage] } }
 */
export class EngineReportRunnerDriver extends Driver(ReportRunner) {
  /** The configured report engine. */
  private readonly engine: ReportEngine;

  /** The running call, for its time zone. */
  private readonly storage: ContextStorage;

  /**
   * @param engine - the report engine `ReportsConfig.engine` selects.
   * @param storage - the running call's context.
   */
  constructor(engine: ReportEngine, storage: ContextStorage) {
    super();
    this.engine = engine;
    this.storage = storage;
  }

  /**
   * Implements `ReportRunner.run`, documented there.
   *
   * @throws TypeError for a class that is no report, or one with no registered source model.
   */
  run(report: ReportClass, request: ReportRequest): Promise<ReportResult> {
    const record = kindOf(report);
    if (record?.kind !== "report")
      throw new TypeError(`${report.name} extends no Report<S>({ key, dimensions, measures })`);
    const declaration = record.options as unknown as ReportDeclaration;
    const source = this.sourceOf(report);
    const context = this.storage.current() as { readonly timeZone?: string } | undefined;
    return this.engine.run({
      declaration,
      source,
      request,
      timeZone: context?.timeZone ?? "UTC",
    });
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
