/**
 * Stackra file contract:
 * Purpose: `ResolvedBlock`, a template block with its data filled in, ready for any renderer.
 * Boundary: a type only. Each per-locale array is in the template's `locales` order; table cells are formatted in the
 *           primary locale.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */
import type { ImageAsset } from "#core/types/image-asset.type";
import type { QrMatrix } from "#core/types/qr-matrix.type";
import type { TextPart } from "#core/types/text-part.type";

/** Logical alignment of a block. */
type Align = "start" | "center" | "end";

/** A block of a resolved document. */
export type ResolvedBlock =
  | {
      readonly type: "text";
      readonly role: "title" | "heading" | "body" | "note";
      readonly align: Align;
      readonly texts: readonly (readonly TextPart[])[];
    }
  | {
      readonly type: "table";
      readonly columns: readonly { readonly headers: readonly string[]; readonly align: Align }[];
      readonly rows: readonly (readonly string[])[];
    }
  | {
      readonly type: "qr";
      readonly matrix: QrMatrix;
      readonly sizeMm: number;
      readonly align: Align;
    }
  | {
      readonly type: "image";
      readonly image: ImageAsset;
      readonly widthMm: number;
      readonly heightMm: number;
      readonly align: Align;
    }
  | {
      readonly type: "signature";
      readonly image: ImageAsset;
      readonly labels: readonly string[];
      readonly widthMm: number;
      readonly heightMm: number;
      readonly align: Align;
    }
  | { readonly type: "amount-in-words"; readonly texts: readonly string[]; readonly align: Align };
