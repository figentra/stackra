/**
 * Stackra file contract:
 * Purpose: `AssetTree`, the shape `assets()` takes: module key, then kind folder, then the leaf name gen derives from
 *          the snake-cased file name with its extension (`Assets.orders.public.logo_svg`).
 * Boundary: type only; three levels, as gen writes them.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decisions 2 and 5); ADR 0261 (the generated `#stackra/assets`).
 */
import type { AssetEntry } from "#core/types/asset-entry.type";

/**
 * Assets by module, kind folder and leaf name.
 *
 * @example
 * const tree: AssetTree = {
 *   web: { public: { logo_svg: { key: "web::public/logo.svg", file: "assets/public/logo.svg", overridable: true } } },
 * };
 */
export type AssetTree = Readonly<
  Record<string, Readonly<Record<string, Readonly<Record<string, AssetEntry>>>>>
>;
