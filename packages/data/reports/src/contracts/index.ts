/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/reports until `stackra gen` writes the entry barrels
 *          (STA-339): the `ReportEngine` port and the engine-neutral types an engine package implements.
 * Boundary: the leaf entry: names each re-export, declares nothing and imports no other entry of this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0470 (decision 8); the STA-347 stand-in barrel decision.
 */
export { ReportEngine } from "#contracts/ports/report-engine.port";
export type { ReportEngineDeclaration } from "#contracts/types/report-engine-declaration.type";
export type { ReportEngineDimension } from "#contracts/types/report-engine-dimension.type";
export type { ReportEngineMeasure } from "#contracts/types/report-engine-measure.type";
export type { ReportEngineQuery } from "#contracts/types/report-engine-query.type";
export type { ReportEngineRequest } from "#contracts/types/report-engine-request.type";
export type { ReportEngineResult } from "#contracts/types/report-engine-result.type";
