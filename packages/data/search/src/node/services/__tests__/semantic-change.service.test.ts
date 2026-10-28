/**
 * Stackra file contract:
 * Purpose: unit tests of `SemanticChangeService`: a transient service; a changed row of a registered semantic model is
 *          embedded and stored under `<Model>:<id>` in its own scope with
 *          its row and content hash; a long row is chunked (`#1`, ...) and loses its trailing slots; a matching stored
 *          hash skips the embedder unless the scope moved; a deleted or vanished row, and one with no text,
 *          leaves the index; a non-semantic or unregistered model is ignored; an `ai: never` field and a row without
 *          scope columns are refused before anything is embedded.
 * Boundary: test only; the embedder, the vector index and the database are stand-ins recording calls, and the
 *           registry entry is set directly and cleared after each case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0380 (decisions 2 and 3); ADR 0221 (decision 5); STA-1326; stackra-301.
 */
import { Lifetime, Service } from "@stackra/container";
import type { Database } from "@stackra/database";
import {
  AiAudience,
  Classify,
  DataClass,
  ExportLabel,
  Model,
  Searchable,
  SearchSnippet,
  SupportAccess,
} from "@stackra/model";
import { RowChangeKind } from "@stackra/outbox/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { SearchConfig } from "#config/search.config";
import type { Embedder, VectorIndex, VectorItem } from "#contracts/index";
import { SEARCHABLE_MODELS } from "#node/constants/searchable-models.constant";
import { passageIdsOf } from "#node/functions/passage-ids-of.function";
import { SemanticChangeService } from "#node/services/semantic-change.service";

class SecretDataClass extends DataClass({
  key: "secret_note",
  ai: AiAudience.Never,
  support: SupportAccess.Hidden,
  search: SearchSnippet.NoSnippet,
  export: ExportLabel.Labelled,
}) {}

@Searchable({
  text: ["body"],
  semantic: true,
})
class CaseNote extends Model.with() {
  id = "";

  body = "";

  scopeId = "scp_01j9z3k4m5n6p7q8r9s0t1v2w1";

  scopePath = "root.acme";
}

@Searchable({
  text: ["secret"],
  semantic: true,
})
class Vault extends Model.with() {
  @Classify(SecretDataClass)
  secret = "x";

  id = "vlt_1";

  scopeId = "scp_01j9z3k4m5n6p7q8r9s0t1v2w1";

  scopePath = "root.acme";
}

@Searchable({ text: ["title"] })
class Article extends Model.with() {}

/** A note with the given fields. */
const noteWith = (fields: Partial<CaseNote>): CaseNote => Object.assign(new CaseNote(), fields);

/** The search configuration the service reads: the embedder's model and the passage size. */
const CONFIG = {
  embedder: {
    url: null,
    model: "e5",
    dimensions: 2,
    tokenSecret: null,
    passageCharacters: 20,
    passageOverlap: 0,
  },
} as SearchConfig;

/** A service over stand-ins; `found` is what the database finds for the row, `stored` the vector metadata held. */
function setup(found: object | null, stored = new Map<string, VectorItem["metadata"]>()) {
  const embedder = {
    dimensions: 2,
    embed: vi.fn(async (texts: readonly string[]) => texts.map(() => [0.1, 0.9])),
  };
  const vectors = {
    upsert: vi.fn(async (_items: readonly VectorItem[]) => undefined),
    remove: vi.fn(async (_ids: readonly string[]) => undefined),
    metadataOf: vi.fn(async (_ids: readonly string[]) => stored),
  };
  const findOne = vi.fn(async () => found);
  const populate = vi.fn(async () => undefined);
  const em = {
    findOne,
    populate,
    getMetadata: () => ({ primaryKeys: ["id"], properties: {} }),
  };
  const database = { em: () => em } as unknown as Database;
  const service = new SemanticChangeService(
    embedder as unknown as Embedder,
    vectors as unknown as VectorIndex,
    database,
    CONFIG,
  );
  return { embedder, vectors, findOne, service };
}

afterEach(() => {
  SEARCHABLE_MODELS.clear();
});

describe(SemanticChangeService, () => {
  it("is a transient service, so boot never builds the embedder", () => {
    expect(setup(null).service).toBeInstanceOf(Service);
    expect(Lifetime.on(SemanticChangeService)).toBe(Lifetime.Transient);
  });

  it("embeds a changed row and stores it in the row's scope", async () => {
    SEARCHABLE_MODELS.set("CaseNote", CaseNote);
    const row = noteWith({ id: "cnt_1", body: "Unpaid invoice" });
    const { embedder, vectors, findOne, service } = setup(row);
    await service.consume({
      model: "CaseNote",
      id: "cnt_1",
      kind: RowChangeKind.Updated,
      fields: ["body"],
    });
    expect(findOne).toHaveBeenCalledWith(CaseNote, "cnt_1");
    expect(embedder.embed).toHaveBeenCalledWith(["unpaid invoice"]);
    expect(vectors.upsert).toHaveBeenCalledWith([
      {
        id: "CaseNote:cnt_1",
        scope: { id: row.scopeId, path: "root.acme" },
        vector: [0.1, 0.9],
        text: "unpaid invoice",
        metadata: {
          source: "search",
          model: "CaseNote",
          row: "cnt_1",
          hash: expect.stringMatching(/^[0-9a-f]{64}$/),
        },
      },
    ]);
    expect(vectors.remove).toHaveBeenCalledWith(passageIdsOf(CaseNote, "cnt_1", 1));
  });

  it("cuts a long row into chunks, one passage each, and drops the slots past the last", async () => {
    const row = noteWith({ id: "cnt_4", body: "alpha beta gamma delta epsilon zeta" });
    const { embedder, vectors, service } = setup(null);
    await service.index(CaseNote, [row]);
    expect(embedder.embed).toHaveBeenCalledWith(["alpha beta gamma", "delta epsilon zeta"]);
    const items = vectors.upsert.mock.calls[0]?.[0] ?? [];
    expect(items.map((item) => item.id)).toEqual(["CaseNote:cnt_4", "CaseNote:cnt_4#1"]);
    expect(items[0]?.metadata["hash"]).toBe(items[1]?.metadata["hash"]);
    expect(vectors.remove).toHaveBeenCalledWith(passageIdsOf(CaseNote, "cnt_4", 2));
  });

  it("embeds nothing when the stored hash matches, and again when the scope moved", async () => {
    const row = noteWith({ id: "cnt_5", body: "Unpaid invoice" });
    const first = setup(null);
    await first.service.index(CaseNote, [row]);
    const metadata = first.vectors.upsert.mock.calls[0]?.[0]?.[0]?.metadata ?? {};
    const same = setup(null, new Map([["CaseNote:cnt_5", metadata]]));
    await same.service.index(CaseNote, [row]);
    expect(same.vectors.metadataOf).toHaveBeenCalledWith(["CaseNote:cnt_5"]);
    expect(same.embedder.embed).not.toHaveBeenCalled();
    expect(same.vectors.upsert).not.toHaveBeenCalled();
    const moved = setup(null, new Map([["CaseNote:cnt_5", metadata]]));
    await moved.service.index(CaseNote, [Object.assign(row, { scopePath: "root.acme.branch" })]);
    expect(moved.embedder.embed).toHaveBeenCalledWith(["unpaid invoice"]);
  });

  it("removes the passage of a deleted row, a vanished row and a row with no text", async () => {
    SEARCHABLE_MODELS.set("CaseNote", CaseNote);
    const gone = setup(null);
    await gone.service.consume({
      model: "CaseNote",
      id: "cnt_1",
      kind: RowChangeKind.Deleted,
      fields: [],
    });
    expect(gone.findOne).not.toHaveBeenCalled();
    await gone.service.consume({
      model: "CaseNote",
      id: "cnt_1",
      kind: RowChangeKind.Updated,
      fields: [],
    });
    expect(gone.vectors.remove).toHaveBeenCalledTimes(2);
    expect(gone.vectors.remove).toHaveBeenCalledWith(passageIdsOf(CaseNote, "cnt_1"));
    const blank = setup(noteWith({ id: "cnt_2" }));
    await blank.service.consume({
      model: "CaseNote",
      id: "cnt_2",
      kind: RowChangeKind.Updated,
      fields: ["body"],
    });
    expect(blank.vectors.remove).toHaveBeenCalledWith(passageIdsOf(CaseNote, "cnt_2"));
    expect(blank.embedder.embed).not.toHaveBeenCalled();
  });

  it("ignores an unregistered model and a model that is not semantic", async () => {
    SEARCHABLE_MODELS.set("Article", Article);
    const { findOne, service } = setup(null);
    for (const model of ["Article", "Order"])
      await service.consume({ model, id: "x_1", kind: RowChangeKind.Created, fields: [] });
    expect(findOne).not.toHaveBeenCalled();
    await expect(service.index(Article, [])).rejects.toThrow(TypeError);
  });

  it("refuses an ai: never field and a row without scope columns before embedding anything", async () => {
    const { embedder, vectors, service } = setup(null);
    await expect(service.index(Vault, [new Vault()])).rejects.toThrow(
      /searchable_semantic_ai_never/,
    );
    const unscoped = Object.assign(noteWith({ id: "cnt_3", body: "text" }), {
      scopeId: undefined,
    });
    await expect(service.index(CaseNote, [unscoped])).rejects.toThrow(/scopeId and scopePath/);
    expect(vectors.upsert).not.toHaveBeenCalled();
    expect(embedder.embed).not.toHaveBeenCalled();
  });
});
