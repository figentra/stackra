/**
 * Stackra file contract:
 * Purpose: `formulaNames`, the closed formula grammar of a `formula` measure: numbers, measure names, `+ - * /`, unary
 *          minus and parentheses. It parses a formula and returns the measure names it reads, or throws.
 * Boundary: pure; a recursive-descent check, never an evaluator. Nothing else (functions, field paths, SQL, other
 *           operators) parses, so a formula cannot reach past the report's own measures (ADR 0154). Whether each name
 *           is a declared measure is the caller's check.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 2: a formula over other measures from a closed grammar); ADR 0154.
 */

/** One token: a number, a camelCase name or an operator. */
const TOKEN = /\s*(?:(\d+(?:\.\d+)?)|([a-z][A-Za-z0-9]*)|([-+*/()]))/y;

/** The longest formula read. */
const MAX_LENGTH = 500;

/**
 * The measure names `formula` reads, in first-use order.
 *
 * @throws TypeError when the formula is empty, too long, or outside the grammar.
 * @example
 * formulaNames("(paid - refunded) / orders"); // ["paid", "refunded", "orders"]
 */
export function formulaNames(formula: string): readonly string[] {
  if (typeof formula !== "string" || formula.trim() === "" || formula.length > MAX_LENGTH)
    throw new TypeError(
      `A report formula is 1 to ${MAX_LENGTH} characters of arithmetic over measure names`,
    );
  const tokens: string[] = [];
  const names: string[] = [];
  TOKEN.lastIndex = 0;
  while (TOKEN.lastIndex < formula.length && formula.slice(TOKEN.lastIndex).trim() !== "") {
    const match = TOKEN.exec(formula);
    if (match === null)
      throw new TypeError(
        `A report formula is numbers, measure names, + - * / and parentheses, got ${JSON.stringify(formula)}`,
      );
    tokens.push(match[1] ?? match[2] ?? match[3] ?? "");
    if (match[2] !== undefined && !names.includes(match[2])) names.push(match[2]);
  }
  let at = 0;
  const fail = (): never => {
    throw new TypeError(
      `The report formula ${JSON.stringify(formula)} does not parse near token ${at + 1}`,
    );
  };
  const factor = (): void => {
    const token = tokens[at];
    if (token === "-") {
      at += 1;
      factor();
    } else if (token === "(") {
      at += 1;
      sum();
      if (tokens[at] !== ")") fail();
      at += 1;
    } else if (token !== undefined && /^[\da-z]/.test(token)) at += 1;
    else fail();
  };
  const product = (): void => {
    factor();
    while (tokens[at] === "*" || tokens[at] === "/") {
      at += 1;
      factor();
    }
  };
  const sum = (): void => {
    product();
    while (tokens[at] === "+" || tokens[at] === "-") {
      at += 1;
      product();
    }
  };
  sum();
  if (at !== tokens.length) fail();
  return names;
}
