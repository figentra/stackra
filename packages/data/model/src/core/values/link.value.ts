/**
 * Stackra file contract:
 * Purpose: `Link<T>`, an id-only reference to a model another module owns (`variant!: Link<Variant>`): `link.id`
 *          needs no load, a filter takes the raw id, and `link.load()` runs the owning module's generated read.
 * Boundary: a value, never an ORM reference: it has no `unwrap()`, so the ORM never offers to populate it and never
 *           joins the other module's table. The three declared brands are the ORM's custom-type shape, so a filter
 *           types the raw id. `load()` goes through the resolver the generated wiring installs with
 *           `Link.useResolver`, and `Link.loadMany` through the batch one (`Link.useBatchResolver`, one read per target
 *           model by id set); neither reads the target's table. No batch spans requests: `loadMany` batches what its
 *           caller passes, inside the caller's context.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 28); ADR 0104 (links and the query graph); the STA-335 entity-schema spike;
 *                     ADR 0097 (decision 4: batched link loading), data-layer gap model-orm 12 (STA-1400).
 */

/** Loads one model by its key and public id through the owning module's read. */
type LinkResolver = (model: string, id: string) => Promise<object>;

/** Loads the rows of one model by key and a set of public ids through the owning module's read, in any order. */
type LinkBatchResolver = (model: string, ids: readonly string[]) => Promise<readonly object[]>;

/**
 * A reference to a row of another module's model `T`.
 *
 * @example
 * line.variant.id; // "var_01jab…", no load
 * const variant = await line.variant.load(); // catalogue's generated read
 */
export class Link<T extends { id: string }> {
  /** The resolver the generated wiring installed; undefined until then. */
  private static resolver: LinkResolver | undefined;

  /** The batch resolver the generated wiring installed; undefined until then. */
  private static batchResolver: LinkBatchResolver | undefined;

  /** ORM custom-type brand: the runtime value. */
  declare readonly __runtime?: Link<T>;

  /** ORM custom-type brand: the raw value a filter takes. */
  declare readonly __raw?: T["id"];

  /** ORM custom-type brand: the serialized value. */
  declare readonly __serialized?: T["id"];

  /** The target's model key (`catalogue.variant`). */
  readonly model: string;

  /** The target's public id; available without a load. */
  readonly id: T["id"];

  /** The loaded target; undefined until `load()` resolves. */
  private entity: T | undefined;

  constructor(model: string, id: T["id"]) {
    this.model = model;
    this.id = id;
  }

  /**
   * Installs the resolver `load()` uses; the generated wiring calls it once at start, a test may call it with a fake.
   *
   * @param resolver - loads a model by key and public id; `undefined` removes it.
   */
  static useResolver(resolver: LinkResolver | undefined): void {
    Link.resolver = resolver;
  }

  /**
   * Installs the batch resolver `loadMany` uses: one read of a model by a set of ids, so following a link from many
   * rows is one call to the owning module, not one per row (DataLoader-style).
   *
   * @param resolver - loads a model's rows by key and ids; `undefined` removes it.
   */
  static useBatchResolver(resolver: LinkBatchResolver | undefined): void {
    Link.batchResolver = resolver;
  }

  /**
   * Loads every link in `links` that is not loaded yet: one batch read per target model, each id once, through the
   * batch resolver; without one, one `load()` per distinct id. Each link then answers `load()` without a read.
   *
   * @throws Error when no resolver is installed, or the batch read did not return a row for an id.
   * @example
   * await Link.loadMany(lines.map((line) => line.variant)); // one read of catalogue.variant
   */
  static async loadMany<T extends { id: string }>(links: readonly Link<T>[]): Promise<void> {
    const pending = links.filter((link) => link.entity === undefined);
    const byModel = new Map<string, Map<string, Link<T>[]>>();
    for (const link of pending) {
      const ids = byModel.get(link.model) ?? new Map<string, Link<T>[]>();
      ids.set(link.id, [...(ids.get(link.id) ?? []), link]);
      byModel.set(link.model, ids);
    }
    const batch = Link.batchResolver;
    await Promise.all(
      [...byModel].map(async ([model, ids]) => {
        const byId = new Map<string, T>(
          batch === undefined
            ? await Promise.all(
                [...ids].map(
                  async ([id, group]) => [id, await (group[0] as Link<T>).load()] as const,
                ),
              )
            : ((await batch(model, [...ids.keys()])) as readonly T[]).map((row) => [row.id, row]),
        );
        for (const [id, group] of ids) {
          const row = byId.get(id);
          if (row === undefined)
            throw new Error(`No ${model} ${id} was returned by the batch read`);
          for (const link of group) link.entity = row;
        }
      }),
    );
  }

  /** Whether `load()` has fetched the target. */
  isInitialized(): boolean {
    return this.entity !== undefined;
  }

  /**
   * The target, fetched once through the owning module's read and kept.
   *
   * @throws Error when no resolver is installed.
   */
  async load(): Promise<T> {
    if (this.entity !== undefined) return this.entity;
    if (Link.resolver === undefined)
      throw new Error(`No link resolver is installed (loading ${this.model} ${this.id})`);
    this.entity = (await Link.resolver(this.model, this.id)) as T;
    return this.entity;
  }

  /** The id, so a link serializes as the column it is stored in. */
  toJSON(): T["id"] {
    return this.id;
  }
}
