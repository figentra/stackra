/**
 * Stackra file contract:
 * Purpose: `ExportRunner`, the work of a queued resource export: page through the resource's list query as the reader,
 *          drop `@Classified` columns the reader may not export, stream the rows into the format's `TabularWriter` on
 *          the host disk, sign a 24-hour link, and write one access record for it.
 * Boundary: a service a module's export action calls from its `handle`; the action carries the queue (`job`) and the
 *           `export` permission (ADR 0307 rule 4), so the work runs in a job, never in the request. Every page is a call
 *           of the list query through the action pipeline under the reader's actor and scope, so the query's permission,
 *           the visibility filter and row-level security decide each row (per-row permissions); this service reads no
 *           table itself. Classified columns stay only when the source opts them in and the reader holds the source's L2
 *           permission. At most `maxRows` rows are written; the output says when the cap cut the file short. The file
 *           name is random, so the link names no one; the disk signs the link and the bucket's lifecycle removes the file.
 *           The link's issue is access-logged against the reader, with the classes of the classified columns written
 *           (pseudonymous when none: rows still carry record ids).
 * Runtime: node
 * Governing contract: ADR 0307 (rules 4 and 10); ADR 0163 (decision 4: exports are queued and respect the reader's
 *                     permissions per row); ADR 0470 (decision 7); ADR 0212 (decision 5: access log); reporting gap 11.
 */
import type { ActionContext, ActionPipeline } from "@stackra/actions";
import type { AccessLogService } from "@stackra/access-log";
import { Service } from "@stackra/container";
import { DataClassification, Duration } from "@stackra/contracts";
import type { TabularCell } from "@stackra/data-transfer/contracts";
import type { PdfEngine } from "@stackra/documents/contracts";
import type { FileSystem } from "@stackra/filesystem/contracts";
import type { PolicyDecisionPointService } from "@stackra/iam";
import { Classified } from "@stackra/validation";

import { valueAt } from "#core/functions/value-at.function";
import type { ExportConfig } from "#node/config/export.config";
import { exportCell } from "#node/functions/export-cell.function";
import { exportColumns } from "#node/functions/export-columns.function";
import { exportWriter } from "#node/functions/export-writer.function";
import type { ExportInput } from "#node/schemas/export-input.schema";
import { ExportOutput } from "#node/schemas/export-output.schema";
import type { ExportSource } from "#node/types/export-source.type";

/** How long an export link lives (ADR 0307 rule 10). */
const LINK_TTL = Duration.hours(24);

/** One page of a list query (`CrudService.table`'s page). */
interface ListPage {
  readonly items?: readonly unknown[];
  readonly hasMore?: boolean;
  readonly nextCursor?: string;
}

/** What one export counted while its rows streamed. */
interface Tally {
  rows: number;
  truncated: boolean;
}

/**
 * Runs queued resource exports.
 *
 * @example
 * export class ExportOrdersAction extends Action({ key: "order.export", actors: [ActorKind.User], permission: OrderPermissions.export, job: { queue: "exports", timeout: "15m" } }) {
 *   async handle(input: ExportInput, ctx: ActionContext): Promise<ExportOutput> {
 *     return this.exports.run({ list: ListOrdersQuery, row: OrderRow }, input, ctx);
 *   }
 * }
 */
export class ExportRunner extends Service {
  /** Runs each page of the list query as the reader. */
  private readonly pipeline: ActionPipeline;

  /** The host disk files are written to. */
  private readonly files: FileSystem;

  /** Decides a source's classified opt-in permission. */
  private readonly policy: PolicyDecisionPointService;

  /** Records the link's issue. */
  private readonly accessLog: AccessLogService;

  /** Rows per page, row caps, folder and PDF page. */
  private readonly config: ExportConfig;

  /** Prints PDF tables; absent when the host binds no engine, which refuses only a PDF export. */
  private readonly pdf: PdfEngine | undefined;

  /**
   * @param pipeline - the action pipeline, to run the list query as the reader.
   * @param files - the disk exports are written to.
   * @param policy - the policy decision point.
   * @param accessLog - the access log.
   * @param config - the export configuration.
   * @param pdf - the PDF engine, when one is bound.
   */
  constructor(
    pipeline: ActionPipeline,
    files: FileSystem,
    policy: PolicyDecisionPointService,
    accessLog: AccessLogService,
    config: ExportConfig,
    pdf?: PdfEngine,
  ) {
    super();
    this.pipeline = pipeline;
    this.files = files;
    this.policy = policy;
    this.accessLog = accessLog;
    this.config = config;
    this.pdf = pdf;
  }

  /**
   * Writes the export `input` asks for and returns its 24-hour link.
   *
   * @throws Refusal from the list query (the reader may not list the resource) or from the writer (a PDF over its cap).
   * @throws TypeError when a PDF is asked for and no `PdfEngine` is bound.
   */
  async run(source: ExportSource, input: ExportInput, ctx: ActionContext): Promise<ExportOutput> {
    const optedIn =
      source.classified !== undefined &&
      (await this.policy.check(
        ctx.actor,
        source.classified.permission,
        ctx.scope === undefined ? {} : { scope: ctx.scope },
      ))
        ? new Set(source.classified.columns)
        : new Set<string>();
    const { columns, classes } = exportColumns(
      input.columns,
      Classified.members(source.row),
      optedIn,
    );
    const writer = exportWriter(input.format, {
      engine: this.pdf,
      page: this.config.pdfPage,
      maxRows: this.config.pdfMaxRows,
    });
    const tally: Tally = { rows: 0, truncated: false };
    const path = `${this.config.folder}/${globalThis.crypto.randomUUID()}.${input.format}`;
    await this.files.writeStream(
      path,
      writer.write([{ name: "export", rows: this.rows(source, input, columns, ctx, tally) }]),
      { contentType: writer.mediaType },
    );
    const link = await this.files.temporaryUrl(path, LINK_TTL);
    await this.accessLog.record(
      ctx.callId,
      ctx.actor,
      `${ctx.key}.export`,
      { classification: classes[0] ?? DataClassification.Pseudonymous },
      [],
    );
    return ExportOutput.create({
      link,
      expiresAt: new Date(ctx.now().getTime() + Duration.toMilliseconds(LINK_TTL)).toISOString(),
      rows: tally.rows,
      truncated: tally.truncated,
    });
  }

  /**
   * The rows of the file, page by page, until the list ends or the cap is reached.
   *
   * @yields The header, then each visible row's cells.
   */
  private async *rows(
    source: ExportSource,
    input: ExportInput,
    columns: readonly string[],
    ctx: ActionContext,
    tally: Tally,
  ): AsyncGenerator<readonly TabularCell[]> {
    yield columns;
    let cursor: string | undefined;
    do {
      const page = (await this.pipeline.execute(
        source.list,
        // reason: the list query's input is its own closed `TableInput`; its schema checks what the reader sent
        {
          filters: input.filters,
          ...(input.sort === undefined ? {} : { sort: input.sort }),
          ...(input.search === undefined ? {} : { search: input.search }),
          limit: this.config.pageSize,
          ...(cursor === undefined ? {} : { cursor }),
        } as never,
        {
          actor: ctx.actor,
          ...(ctx.scope === undefined ? {} : { scope: ctx.scope }),
          locale: ctx.locale,
          timeZone: ctx.timeZone,
          currency: ctx.currency,
          market: ctx.market,
          abortSignal: ctx.abortSignal,
        },
      )) as ListPage;
      for (const item of page.items ?? []) {
        if (tally.rows >= this.config.maxRows) {
          tally.truncated = true;
          return;
        }
        yield columns.map((column) => exportCell(valueAt(item, column)));
        tally.rows += 1;
      }
      cursor = page.hasMore === true ? page.nextCursor : undefined;
    } while (cursor !== undefined);
  }
}
