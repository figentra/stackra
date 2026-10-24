/**
 * Stackra file contract:
 * Purpose: unit tests of `ScopeNodeService`: the root is added at the first level with the configured root label; a
 *          child's path is its parent's and its label; a level added as data is accepted with no code change; a bad
 *          label, a root with another label, an unknown parent and a level the parent does not take are refused; the
 *          ancestor and descendant reads are parameterised raw `ltree` conditions in path order.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decisions 2, 3 and 9); ADR 0160.
 */
import { buildConfig } from "@stackra/config";
import { Database, registerModelPartners } from "@stackra/database";
import { isRefusal, NotFoundError } from "@stackra/errors";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ScopeConfig, ScopeLabelInvalidError, ScopeLevelInvalidError } from "#core/index";
import { ScopeNode } from "#node/models/scope-node.model";
import { ScopeNodeService } from "#node/services/scope-node.service";

registerModelPartners([[ScopeNodeService, ScopeNode]]);

/** A stored node at `path` and `level`. */
function nodeAt(path: string, level: string): ScopeNode {
  return Object.assign(new ScopeNode(), { scopePath: path, level, name: path });
}

/** Connects a recording entity manager whose `findOneOrFail` answers `parent` (or fails). */
function connect(parent?: ScopeNode) {
  const em = {
    find: vi.fn(async () => [] as ScopeNode[]),
    findOneOrFail: vi.fn(
      async (_model: unknown, _where: unknown, options: { failHandler: () => Error }) => {
        if (parent === undefined) throw options.failHandler();
        return parent;
      },
    ),
    create: vi.fn((_model: unknown, data: object) => Object.assign(new ScopeNode(), data)),
    flush: vi.fn(async () => undefined),
    transactional: vi.fn(async (work: (manager: unknown) => Promise<unknown>) => work(em)),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  return em;
}

/** The service over the default levels, or a deployment's values layer. */
const serviceOf = (values: Record<string, unknown> = {}) =>
  new ScopeNodeService(buildConfig(ScopeConfig, { values: values as never }));

/** The raw condition of a filter: its one symbol key, described as `raw('<sql>')`. */
const conditionOf = (where: object) => Object.getOwnPropertySymbols(where)[0]?.description;

afterEach(() => {
  vi.restoreAllMocks();
});

describe(ScopeNodeService, () => {
  it("adds the root at the first level with the configured label", async () => {
    connect();
    const root = await serviceOf().add({ level: "platform", label: "platform", name: "Platform" });
    expect(root).toMatchObject({ level: "platform", scopePath: "platform", name: "Platform" });
    expect(root.id).toMatch(/^scp_/);
  });

  it("adds a child under its parent's path", async () => {
    const em = connect(nodeAt("platform", "platform"));
    const parent = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w0", path: "platform" } as const;
    const child = await serviceOf().add({ parent, level: "product", label: "acme", name: "Acme" });
    expect(child.scopePath).toBe("platform.acme");
    expect(em.findOneOrFail.mock.calls[0]?.[1]).toEqual({ id: parent.id });
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it("accepts a level added as data, nested under itself", async () => {
    connect(nodeAt("platform.acme.eu", "store"));
    const service = serviceOf({
      levels: [
        { key: "platform", recursive: false },
        { key: "product", recursive: false },
        { key: "store", recursive: true },
      ],
    });
    const parent = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2", path: "platform.acme.eu" } as const;
    const child = await service.add({ parent, level: "store", label: "riyadh", name: "Riyadh" });
    expect(child.scopePath).toBe("platform.acme.eu.riyadh");
  });

  it("refuses a bad label and a root with another label", async () => {
    connect();
    for (const label of ["Acme", "acme.eu", "", "acme-eu"]) {
      const refused = await serviceOf()
        .add({ level: "platform", label, name: "X" })
        .catch((error: unknown) => error);
      expect(isRefusal(refused, ScopeLabelInvalidError)).toBe(true);
    }
    const root = await serviceOf()
      .add({ level: "platform", label: "global", name: "Global" })
      .catch((error: unknown) => error);
    expect(isRefusal(root, ScopeLabelInvalidError)).toBe(true);
  });

  it("refuses an unknown parent and a level the parent does not take", async () => {
    connect();
    const parent = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w0", path: "platform" } as const;
    const missing = await serviceOf()
      .add({ parent, level: "product", label: "acme", name: "Acme" })
      .catch((error: unknown) => error);
    expect(isRefusal(missing, NotFoundError)).toBe(true);
    connect(nodeAt("platform", "platform"));
    const wrong = await serviceOf()
      .add({ parent, level: "platform", label: "acme", name: "Acme" })
      .catch((error: unknown) => error);
    expect(isRefusal(wrong, ScopeLevelInvalidError)).toBe(true);
    expect((wrong as ScopeLevelInvalidError).details).toEqual({
      level: "platform",
      allowed: ["product"],
    });
  });

  it("reads ancestors and descendants with parameterised ltree conditions in path order", async () => {
    const em = connect();
    const scope = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" } as const;
    await serviceOf().ancestorsOf(scope);
    await serviceOf().descendantsOf(scope);
    const [ancestors, descendants] = em.find.mock.calls as unknown as [
      [unknown, object, unknown],
      [unknown, object, unknown],
    ];
    expect(ancestors[0]).toBe(ScopeNode);
    expect(conditionOf(ancestors[1])).toContain("scope_path @> ?::ltree");
    expect(conditionOf(descendants[1])).toContain("scope_path <@ ?::ltree");
    expect(conditionOf(descendants[1])).not.toContain("platform.acme");
    expect(ancestors[2]).toEqual({ orderBy: { scopePath: "asc" } });
  });
});
