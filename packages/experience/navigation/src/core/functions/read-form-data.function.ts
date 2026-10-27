/**
 * Stackra file contract:
 * Purpose: `readFormData(request)`, the body behind `ctx.formData()`: a JSON body as it is, or form fields as one
 *          object with dotted names nested (`lines.0.quantity` is `{ lines: [{ quantity }] }`) and a repeated name
 *          collected into a list, ready for `validate(Shape, ...)`.
 * Boundary: a trust boundary: the result is untrusted input that the route validates. Names that would reach an
 *           object's prototype (`__proto__`, `constructor`, `prototype`) are dropped, and so is a list index above
 *           `MAX_INDEX` (a sparse list a billion long would stall the validator) or a name segment under a list.
 *           Files stay `File`s.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0055 (forms validate with the shape's schema).
 */

/** Path segments that could reach a prototype. */
const UNSAFE = new Set(["__proto__", "constructor", "prototype"]);

/** A whole, non-negative list index. */
const INDEX = /^(?:0|[1-9]\d*)$/;

/** The highest list index a form may name. */
const MAX_INDEX = 999;

/** Puts `value` at `path` inside `root`, making objects and lists on the way. */
function place(root: Record<string, unknown>, path: readonly string[], value: unknown): void {
  let node: Record<string, unknown> | unknown[] = root;
  for (const [position, segment] of path.entries()) {
    if (Array.isArray(node) && !INDEX.test(segment)) return;
    const key: string | number = Array.isArray(node) ? Number(segment) : segment;
    const slot = node as Record<string | number, unknown>;
    if (position === path.length - 1) {
      const current = slot[key];
      if (current === undefined) slot[key] = value;
      else
        slot[key] = Array.isArray(current) ? [...(current as unknown[]), value] : [current, value];
      return;
    }
    const next = path[position + 1] ?? "";
    const child = slot[key];
    if (typeof child !== "object" || child === null) slot[key] = INDEX.test(next) ? [] : {};
    node = slot[key] as Record<string, unknown> | unknown[];
  }
}

/**
 * The submitted body as one object.
 *
 * @throws SyntaxError when a JSON body is not JSON.
 * @example
 * const form = validate(QuickOrderForm, await readFormData(request));
 */
export async function readFormData(request: Request): Promise<Record<string, unknown>> {
  if ((request.headers.get("Content-Type") ?? "").includes("application/json")) {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  }
  const out: Record<string, unknown> = {};
  // The ./native entry pulls react-native's global `FormData` class into this program, and it declares no iterator;
  // every fetch runtime's FormData iterates its entries, which is what the DOM type says.
  const fields = (await request.formData()) as unknown as Iterable<[string, FormDataEntryValue]>;
  for (const [name, value] of fields) {
    const path = name.split(".");
    const isRefused = (segment: string) =>
      segment === "" || UNSAFE.has(segment) || (INDEX.test(segment) && Number(segment) > MAX_INDEX);
    if (path.some(isRefused)) continue;
    place(out, path, value);
  }
  return out;
}
