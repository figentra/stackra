/**
 * Stackra file contract:
 * Purpose: `ExportSubjectDataAction`, `privacy.subject.export@1`: the DSAR export job. It collects one subject's data
 *          across every registered `PersonalData` declaration and writes it as a zip behind a signed link that lives
 *          `PrivacyConfig.exportTtlDays` (seven by default).
 * Boundary: a system job (ten minutes at most, retried twice): the request flow that verified the person dispatches it
 *           and hands the link over, so it gets no endpoint and no tool. Its permission `privacy.subject.export` is
 *           derived, a system permission no role grants. The work is `SubjectExportService`'s.
 * Runtime: node
 * Governing contract: ADR 0189 (decision 1); GDPR Art. 15 and 20; PDPL Art. 4; ADR 0305 (rule 28); STA-1375.
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import type { SubjectExportService } from "#core/services/subject-export.service";
import type { ExportSubjectDataInput } from "#node/schemas/export-subject-data-input.schema";
import { ExportSubjectDataOutput } from "#node/schemas/export-subject-data-output.schema";

/**
 * Exports one subject's data.
 *
 * @example
 * const { url, expiresAt } = await pipeline.execute(ExportSubjectDataAction, { subject }, { actor: systemActor });
 */
export class ExportSubjectDataAction extends Action({
  key: "subject.export",
  actors: [ActorKind.System],
  job: { timeout: "10m", retries: 2 },
}) {
  /** Collects and writes the export. */
  private readonly exporter: SubjectExportService;

  /**
   * @param exporter - collects and writes the export.
   */
  constructor(exporter: SubjectExportService) {
    super();
    this.exporter = exporter;
  }

  /** Collects the subject's data as at the call's instant and writes the zip. */
  async handle(
    input: ExportSubjectDataInput,
    ctx: ActionContext,
  ): Promise<ExportSubjectDataOutput> {
    const link = await this.exporter.archive(await this.exporter.collect(input.subject, ctx.now()));
    return ExportSubjectDataOutput.create({ ...link });
  }
}
