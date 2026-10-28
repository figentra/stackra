/**
 * Stackra file contract:
 * Purpose: unit tests of `ExportRunner`: the list query runs page by page as the reader with the list's filters, sort
 *          and search; classified columns are dropped unless opted in under the L2 permission; the CSV holds the header
 *          and at most `maxRows` rows (the output says it was cut short); the file lands under the configured folder
 *          with a random name; the link is signed for 24 hours and its issue is access-logged against the reader.
 * Boundary: test only; the pipeline, disk, policy and access log are in-memory stand-ins of the calls the runner makes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 4 and 10); ADR 0163 (decision 4).
 */
import type { ActionContext, ActionPipeline } from "@stackra/actions";
import type { AccessLogService } from "@stackra/access-log";
import { ActorKind, DataClassification, Duration, Realm } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import type { FileSystem, WriteStreamSource } from "@stackra/filesystem/contracts";
import type { PolicyDecisionPointService } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";
import { Classified, Schema } from "@stackra/validation";
import { vi } from "vitest";

import { ExportFormat } from "#core/enums/export-format.enum";
import type { ExportConfig } from "#node/config/export.config";
import type { ExportInput } from "#node/schemas/export-input.schema";
import { ExportRunner } from "#node/services/export-runner.service";

const ACTOR: Actor = {
  kind: ActorKind.User,
  id: "usr_ana",
  realm: Realm.Staff,
  scopeId: "scp_acme",
};
const SCOPE = { id: "scp_acme", path: "platform.acme" };
const NOW = new Date("2026-10-28T09:00:00Z");

/** The list query's item shape, with one classified field. */
class OrderRow extends Schema {
  @Classified(DataClassification.Personal)
  email!: string;

  number!: string;
}

/** The list query class the source names. */
class ListOrdersQuery {}

const ctx = {
  callId: "call_1",
  key: "orders.order.export@1",
  actor: ACTOR,
  scope: SCOPE,
  locale: "en",
  timeZone: "Asia/Riyadh",
  currency: "SAR",
  market: "sa",
  abortSignal: new AbortController().signal,
  now: () => NOW,
} as unknown as ActionContext;

/** The runner over stand-ins; `optIn` is what the policy answers for the L2 permission. */
function runnerWith(optIn = false) {
  const pages = [
    {
      items: [
        { number: "ORD-1", email: "a@x.test" },
        { number: "ORD-2", email: "b@x.test" },
      ],
      hasMore: true,
      nextCursor: "c2",
    },
    {
      items: [
        { number: "ORD-3", email: "c@x.test" },
        { number: "ORD-4", email: "d@x.test" },
      ],
      hasMore: false,
    },
  ];
  const pipeline = { execute: vi.fn(async () => pages.shift() ?? { items: [] }) };
  const written: { path: string; text: string; contentType?: string }[] = [];
  const files = {
    writeStream: vi.fn(
      async (path: string, source: WriteStreamSource, options?: { contentType?: string }) => {
        const decoder = new TextDecoder();
        let text = "";
        for await (const chunk of source as AsyncIterable<Uint8Array>)
          text += decoder.decode(chunk, { stream: true });
        written.push({
          path,
          text,
          ...(options?.contentType === undefined ? {} : { contentType: options.contentType }),
        });
      },
    ),
    temporaryUrl: vi.fn(async () => "https://disk.test/signed"),
  };
  const policy = { check: vi.fn(async () => optIn) };
  const accessLog = { record: vi.fn(async () => undefined) };
  const config = {
    pageSize: 2,
    maxRows: 3,
    folder: "exports",
    pdfPage: { widthMm: 297, heightMm: 210, marginMm: 10 },
    pdfMaxRows: 10,
  } as unknown as ExportConfig;
  const runner = new ExportRunner(
    pipeline as unknown as ActionPipeline,
    files as unknown as FileSystem,
    policy as unknown as PolicyDecisionPointService,
    accessLog as unknown as AccessLogService,
    config,
  );
  return { runner, pipeline, files, written, policy, accessLog };
}

const input = {
  format: ExportFormat.Csv,
  columns: ["number", "email"],
  filters: { status: "open" },
  search: "ORD",
} as unknown as ExportInput;

describe("ExportRunner", () => {
  it("pages the list query as the reader and writes at most maxRows rows", async () => {
    const { runner, pipeline, written } = runnerWith();
    const output = await runner.run({ list: ListOrdersQuery as never, row: OrderRow }, input, ctx);
    expect(pipeline.execute).toHaveBeenNthCalledWith(
      1,
      ListOrdersQuery,
      { filters: { status: "open" }, search: "ORD", limit: 2 },
      expect.objectContaining({ actor: ACTOR, scope: SCOPE, locale: "en" }),
    );
    expect(pipeline.execute).toHaveBeenNthCalledWith(
      2,
      ListOrdersQuery,
      { filters: { status: "open" }, search: "ORD", limit: 2, cursor: "c2" },
      expect.objectContaining({ actor: ACTOR }),
    );
    const [file] = written;
    expect(file?.path).toMatch(/^exports\/[0-9a-f-]{36}\.csv$/);
    expect(file?.text).toContain("number");
    expect(file?.text).not.toContain("email");
    expect(file?.text).toContain("ORD-3");
    expect(file?.text).not.toContain("ORD-4");
    expect(output).toMatchObject({ rows: 3, truncated: true, link: "https://disk.test/signed" });
  });

  it("signs the link for 24 hours and access-logs its issue", async () => {
    const { runner, files, accessLog } = runnerWith();
    const output = await runner.run({ list: ListOrdersQuery as never, row: OrderRow }, input, ctx);
    expect(files.temporaryUrl).toHaveBeenCalledWith(expect.any(String), Duration.hours(24));
    expect(output.expiresAt).toBe("2026-10-29T09:00:00.000Z");
    expect(accessLog.record).toHaveBeenCalledWith(
      "call_1",
      ACTOR,
      "orders.order.export@1.export",
      { classification: DataClassification.Pseudonymous },
      [],
    );
  });

  it("keeps an opted-in classified column when the reader holds the L2 permission", async () => {
    const { runner, policy, written, accessLog } = runnerWith(true);
    await runner.run(
      {
        list: ListOrdersQuery as never,
        row: OrderRow,
        classified: { columns: ["email"], permission: "orders.order.export_personal" },
      },
      input,
      ctx,
    );
    expect(policy.check).toHaveBeenCalledWith(ACTOR, "orders.order.export_personal", {
      scope: SCOPE,
    });
    expect(written[0]?.text).toContain("a@x.test");
    expect(accessLog.record).toHaveBeenCalledWith(
      "call_1",
      ACTOR,
      expect.any(String),
      { classification: DataClassification.Personal },
      [],
    );
  });

  it("refuses a PDF when no engine is bound", async () => {
    const { runner } = runnerWith();
    await expect(
      runner.run(
        { list: ListOrdersQuery as never, row: OrderRow },
        { ...input, format: ExportFormat.Pdf } as ExportInput,
        ctx,
      ),
    ).rejects.toThrow(TypeError);
  });
});
