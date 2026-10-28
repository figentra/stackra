/**
 * Stackra file contract:
 * Purpose: `formulaSql(formula, operand)`, the SQL expression of a `formula` measure: each measure name becomes the
 *          expression `operand` returns for it, numbers stay numeric literals, and a division by zero yields null
 *          (`a / nullif(b, 0)`) instead of failing the statement.
 * Boundary: internal; pure. The formula is checked by `formulaNames` first, so only numbers, camelCase names,
 *           `+ - * /` and parentheses reach the text; a number matches `\d+(\.\d+)?` and is safe as a literal.
 * Runtime: node
 * Governing contract: ADR 0470 (decision 2: a formula over other measures from a closed grammar); ADR 0154; ADR 0160.
 */
import { formulaNames } from "#core/functions/formula-names.function";

/** One token: a number, a camelCase name or an operator (the grammar of `formulaNames`). */
const TOKEN = /\s*(?:(\d+(?:\.\d+)?)|([a-z][A-Za-z0-9]*)|([-+*/()]))/y;

/**
 * The SQL of `formula`.
 *
 * @param formula - the measure's formula.
 * @param operand - the SQL expression of a measure name.
 * @throws TypeError when the formula is outside the grammar.
 * @example
 * formulaSql("paid / orders", (name) => `(${name})::numeric`); // "(paid)::numeric / nullif((orders)::numeric, 0)"
 */
export function formulaSql(formula: string, operand: (name: string) => string): string {
  formulaNames(formula);
  const tokens: string[] = [];
  TOKEN.lastIndex = 0;
  while (TOKEN.lastIndex < formula.length && formula.slice(TOKEN.lastIndex).trim() !== "") {
    const match = TOKEN.exec(formula);
    tokens.push(match?.[1] ?? match?.[2] ?? match?.[3] ?? "");
  }
  let at = 0;
  const factor = (): string => {
    const token = tokens[at] ?? "";
    at += 1;
    if (token === "-") return `(-${factor()})`;
    if (token === "(") {
      const inner = sum();
      at += 1; // the closing parenthesis formulaNames checked
      return `(${inner})`;
    }
    return /^\d/.test(token) ? token : operand(token);
  };
  const product = (): string => {
    let left = factor();
    while (tokens[at] === "*" || tokens[at] === "/") {
      const operator = tokens[at];
      at += 1;
      const right = factor();
      left = operator === "*" ? `${left} * ${right}` : `${left} / nullif(${right}, 0)`;
    }
    return left;
  };
  const sum = (): string => {
    let left = product();
    while (tokens[at] === "+" || tokens[at] === "-") {
      const operator = tokens[at];
      at += 1;
      left = `${left} ${operator} ${product()}`;
    }
    return left;
  };
  return sum();
}
