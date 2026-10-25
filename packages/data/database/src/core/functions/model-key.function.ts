/**
 * Stackra file contract:
 * Purpose: `modelKey`, a model class's key inside its module (`ProductCollection` is `product_collection`), and the
 *          key of its id in an action or query input (`productCollectionId`).
 * Boundary: internal; derived from the class name the way gen derives it (ADR 0294 decision 20).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 20: derived identities); ADR 0231 (snake_case keys, camelCase JSON keys).
 */

/**
 * The model key and the input id key of the class named `name`.
 *
 * @example
 * modelKey("ProductCollection"); // { key: "product_collection", idKey: "productCollectionId" }
 */
export function modelKey(name: string): { readonly key: string; readonly idKey: string } {
  return {
    key: name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase(),
    idKey: `${name.charAt(0).toLowerCase()}${name.slice(1)}Id`,
  };
}
