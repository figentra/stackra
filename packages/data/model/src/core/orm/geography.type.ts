/**
 * Stackra file contract:
 * Purpose: `GeographyType`, the base of the ORM column types of the geospatial fields (`GeoPointType`,
 *          `GeoPolygonType`, `GeoLineType`): a PostGIS `geography(<shape>,4326)` column in the database, the
 *          `@stackra/contracts` shape in the model (ADR 0314).
 * Boundary: a MikroORM custom type. Writes EWKT text (`SRID=4326;POINT(lon lat)`), which a geography column accepts
 *           as is; reads the column through `ST_AsGeoJSON(...)` and maps the GeoJSON coordinates back, so no WKB
 *           parser is needed. A value read without that wrapper (a raw query) is refused with a hint.
 * Runtime: node
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07); ADR 0294 (decision 27); STA-1432.
 */
import { Type } from "@mikro-orm/core";
import type { GeographyShape } from "#core/types/geography-shape.type";

/**
 * The geography column type of one shape; a subclass names the shape and maps WKT and GeoJSON coordinates.
 *
 * @example
 * export class GeoPointType extends GeographyType<GeoPoint> { … }
 */
export abstract class GeographyType<T> extends Type<
  T | null | undefined,
  string | null | undefined
> {
  /** The PostGIS shape of the column. */
  protected abstract readonly shape: GeographyShape;

  /** A value to EWKT text in WGS 84. */
  override convertToDatabaseValue(value: T | null | undefined): string | null | undefined {
    if (value === null) return null;
    if (value === undefined) return undefined;
    return `SRID=4326;${this.wkt(value)}`;
  }

  /**
   * The GeoJSON text `ST_AsGeoJSON` returned (or the object a driver parsed) to the value.
   *
   * @throws TypeError for text that is not GeoJSON, such as the hex WKB of a raw query.
   */
  override convertToJSValue(value: T | string | null | undefined): T | null | undefined {
    if (value === null || value === undefined) return value;
    if (typeof value !== "string") return value;
    if (!value.startsWith("{"))
      throw new TypeError(
        `a geography(${this.shape}) value must be read through ST_AsGeoJSON; a raw query returned WKB instead`,
      );
    return this.fromCoordinates((JSON.parse(value) as { coordinates: unknown }).coordinates);
  }

  /** Reads the column as GeoJSON text. */
  override convertToJSValueSQL(key: string): string {
    return `ST_AsGeoJSON(${key})`;
  }

  /** Two values are equal when their EWKT text is. */
  override compareAsType(): string {
    return "string";
  }

  /** The column type, `geography(<shape>,4326)`. */
  override getColumnType(): string {
    return `geography(${this.shape},4326)`;
  }

  /** The value as WKT without the SRID, for example `POINT(46.67 24.71)`. */
  protected abstract wkt(value: T): string;

  /** The value from the `coordinates` of its GeoJSON. */
  protected abstract fromCoordinates(coordinates: unknown): T;
}
