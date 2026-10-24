/**
 * Stackra file contract:
 * Purpose: `Link<T>`, an id-only reference to a model another module owns (`variant!: Link<Variant>`): `link.id`
 *          needs no load, a filter takes the raw id, and `link.load()` runs the owning module's generated read.
 * Boundary: a value, never an ORM reference: it has no `unwrap()`, so the ORM never offers to populate it and never
 *           joins the other module's table. The three declared brands are the ORM's custom-type shape, so a filter
 *           types the raw id. `load()` goes through the resolver the generated wiring installs with
 *           `Link.useResolver`; it never reads the target's table.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 28); ADR 0104 (links and the query graph); the STA-335 entity-schema spike.
 */

/** Loads one model by its key and public id through the owning module's read. */
type LinkResolver = (model: string, id: string) => Promise<object>;

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
