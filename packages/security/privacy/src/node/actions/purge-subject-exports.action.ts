/**
 * Stackra file contract:
 * Purpose: `PurgeSubjectExportsAction`, `privacy.subject_export.purge@1`: the nightly job that deletes the DSAR export
 *          zips older than `PrivacyConfig.exportTtlDays`, so an export never outlives its link.
 * Boundary: a system job, unique per scope, five minutes at most, at 04:00 UTC once per scope. It lists only
 *           `PrivacyConfig.exportFolder`; a file whose age the disk cannot tell is deleted, since it can no longer be
 *           shown to be within the window.
 * Runtime: node
 * Governing contract: ADR 0189 (decision 1); ADR 0305 (rule 28: the job surface); ADR 0148 (queue and scheduler);
 *                     STA-1375.
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import type { FileSystem } from "@stackra/filesystem/contracts";

import type { PrivacyConfig } from "#config/privacy.config";
import type { PurgeSubjectExportsInput } from "#node/schemas/purge-subject-exports-input.schema";
import { PurgeSubjectExportsOutput } from "#node/schemas/purge-subject-exports-output.schema";

/** Milliseconds in a day. */
const DAY = 86_400_000;

/**
 * Deletes expired exports.
 *
 * @example
 * const { deleted } = await pipeline.execute(PurgeSubjectExportsAction, {}, { actor: systemActor });
 */
export class PurgeSubjectExportsAction extends Action({
  key: "subject_export.purge",
  actors: [ActorKind.System],
  job: { unique: true, timeout: "5m", cron: { schedule: "0 4 * * *", perScope: true } },
}) {
  /** The disk exports are written to. */
  private readonly files: FileSystem;

  /** The export window and folder, read at run time so an override applies on the next tick. */
  private readonly config: PrivacyConfig;

  /**
   * @param files - the disk exports are written to.
   * @param config - the export window and folder.
   */
  constructor(files: FileSystem, config: PrivacyConfig) {
    super();
    this.files = files;
    this.config = config;
  }

  /** Deletes every zip in the export folder written more than `exportTtlDays` before the call's instant. */
  async handle(
    _input: PurgeSubjectExportsInput,
    ctx: ActionContext,
  ): Promise<PurgeSubjectExportsOutput> {
    const cutoff = ctx.now().getTime() - this.config.exportTtlDays * DAY;
    let deleted = 0;
    for (const path of await this.files.list(`${this.config.exportFolder}/`)) {
      const { lastModified } = await this.files.stat(path);
      if (lastModified !== null && lastModified.getTime() >= cutoff) continue;
      if (await this.files.delete(path)) deleted += 1;
    }
    return PurgeSubjectExportsOutput.create({ deleted });
  }
}
