/**
 * Stackra file contract:
 * Purpose: `AdPixelEvent`, one conversion handed to a browser ad pixel: the conversion name, the event id the server
 *          conversion of the same fact also carries (so the platform counts it once), the capture time and the
 *          event's properties.
 * Boundary: a type only, what an `AdPixel` receives from the `ad-pixel` analytics driver. `properties` are the
 *           delivery's (schema-declared fields minus `denyProperties`); the pixel maps them to its own parameters.
 *           It carries no visitor id: the vendor pixel keeps its own first-party ids once marketing is granted.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0472 (decision 4); ADR 0355 (decision 1); analytics gap 12
 *                     (stackra-412).
 */

/** One conversion a pixel fires. */
export interface AdPixelEvent {
  /** Our conversion name (`purchase`, `lead`), mapped by the pixel to the platform's own name. */
  readonly name: string;

  /**
   * The dedup id: the value of the conversion's `ref` property (the order's public id), which the server-side
   * `ConversionEvent` of the same fact uses too; the delivery's own `eventId` when the conversion names no `ref`.
   */
  readonly eventId: string;

  /** When the event was captured, ISO 8601. */
  readonly occurredAt: string;

  /** The analytics event's properties, as the delivery carries them. */
  readonly properties: Readonly<Record<string, unknown>>;
}
