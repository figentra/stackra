/**
 * Stackra file contract:
 * Purpose: unit tests of the synonym actions and query: each is its kind under its key and permission (tools by default,
 *          so none sets `tool`), `synonym.create` creates the row and answers its view, `synonym.update` replaces the
 *          terms, `synonym.delete` removes the row and is not-found for an unknown one, and `synonym.list` filters by index
 *          and language and answers views.
 * Boundary: test only; the actions are called directly with a stand-in synonym service and a fake action context.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0098; ADR 0360 (decision 4); ADR 0492 (decision 5).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SynonymPermissions } from "#core/access/synonym.permissions";
import { CreateSynonymAction } from "#node/actions/create-synonym.action";
import { DeleteSynonymAction } from "#node/actions/delete-synonym.action";
import { UpdateSynonymAction } from "#node/actions/update-synonym.action";
import { Synonym } from "#node/models/synonym.model";
import { ListSynonymsQuery } from "#node/queries/list-synonyms.query";
import { CreateSynonymInput } from "#node/schemas/create-synonym-input.schema";
import { DeleteSynonymInput } from "#node/schemas/delete-synonym-input.schema";
import { ListSynonymsInput } from "#node/schemas/list-synonyms-input.schema";
import { UpdateSynonymInput } from "#node/schemas/update-synonym-input.schema";
import type { SynonymService } from "#node/services/synonym.service";

const synonymId = "syn_01ja0000000000000000000011" as PublicId<"syn">;

/** A stored row. */
const row = (terms: string[]) =>
  Object.assign(new Synonym(), { id: synonymId, indexName: "products", language: "en", terms });

describe("the synonym actions and query", () => {
  it("are the synonym kinds under their permissions, for users and agents", () => {
    const actors = [ActorKind.User, ActorKind.Agent];
    expect(kindOf(CreateSynonymAction)?.options).toMatchObject({
      key: "synonym.create",
      permission: SynonymPermissions.create,
      actors,
    });
    expect(kindOf(UpdateSynonymAction)?.options).toMatchObject({
      key: "synonym.update",
      permission: SynonymPermissions.update,
      actors,
    });
    expect(kindOf(DeleteSynonymAction)?.options).toMatchObject({
      key: "synonym.delete",
      permission: SynonymPermissions.delete,
      actors,
    });
    expect(kindOf(ListSynonymsQuery)?.options).toMatchObject({
      key: "synonym.list",
      permission: SynonymPermissions.read,
      actors,
    });
    for (const type of [
      CreateSynonymAction,
      UpdateSynonymAction,
      DeleteSynonymAction,
      ListSynonymsQuery,
    ])
      expect(kindOf(type)?.options).not.toHaveProperty("tool");
  });

  it("creates a set and answers its view", async () => {
    const create = vi.fn((data: object) => Object.assign(row(["sofa", "couch"]), data));
    const action = new CreateSynonymAction({ create } as unknown as SynonymService);
    const output = await action.handle(
      CreateSynonymInput.create({
        indexName: "products",
        language: "en",
        terms: ["sofa", "couch"],
      }),
      fakeActionContext(),
    );
    expect(create).toHaveBeenCalledWith({
      indexName: "products",
      language: "en",
      terms: ["sofa", "couch"],
    });
    expect({ ...output }).toEqual({
      id: synonymId,
      indexName: "products",
      language: "en",
      terms: ["sofa", "couch"],
    });
  });

  it("replaces a set's terms", async () => {
    const update = vi.fn(async (_where: object, data: { terms: string[] }) => row(data.terms));
    const output = await new UpdateSynonymAction({ update } as unknown as SynonymService).handle(
      UpdateSynonymInput.create({ synonymId, terms: ["a", "b", "c"] }),
      fakeActionContext(),
    );
    expect(update).toHaveBeenCalledWith({ id: synonymId }, { terms: ["a", "b", "c"] });
    expect(output.terms).toEqual(["a", "b", "c"]);
  });

  it("removes a set, and refuses one that is not there", async () => {
    const remove = vi.fn(async () => 1);
    const action = new DeleteSynonymAction({ delete: remove } as unknown as SynonymService);
    expect({
      ...(await action.handle(DeleteSynonymInput.create({ synonymId }), fakeActionContext())),
    }).toEqual({
      synonymId,
    });
    const none = new DeleteSynonymAction({ delete: async () => 0 } as unknown as SynonymService);
    await expect(
      none.handle(DeleteSynonymInput.create({ synonymId }), fakeActionContext()),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lists the sets matching the input as views", async () => {
    const find = vi.fn(async () => [row(["a", "b"])]);
    const query = new ListSynonymsQuery({ find } as unknown as SynonymService);
    const output = await query.handle(
      ListSynonymsInput.create({ indexName: "products", language: "en" }),
      fakeActionContext() as never,
    );
    expect(find).toHaveBeenCalledWith(
      { indexName: "products", language: "en" },
      { orderBy: { createdAt: "asc", id: "asc" } },
    );
    expect(output.items).toEqual([
      { id: synonymId, indexName: "products", language: "en", terms: ["a", "b"] },
    ]);
    await query.handle(ListSynonymsInput.create({}), fakeActionContext() as never);
    expect(find.mock.calls[1]?.[0]).toEqual({});
  });
});
