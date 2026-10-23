/**
 * Stackra file contract:
 * Purpose: the shape of the name of an icon a module or app brings itself: `<namespace>::<name>`, for example
 *          `loyalty::points-badge`, the namespace being the module that owns the drawing.
 * Boundary: types only; whether a name of this shape is registered is the registry's question, not the type's.
 * Runtime: isomorphic
 * Governing contract: ADR 0303 (decision 10); ADR 0231 (namespace lookups use `<module>::<path>`).
 */

/** The name of a custom icon: a namespace and a name joined by `::`. */
export type CustomIconName = `${string}::${string}`;
