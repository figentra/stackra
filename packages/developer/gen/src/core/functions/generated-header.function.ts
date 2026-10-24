/**
 * Stackra file contract:
 * Purpose: `generatedHeader`, the docblock every generated TypeScript file opens with: the generated notice and its
 *          sources, then the file contract (purpose, boundary, runtime) in the house form.
 * Boundary: pure; wraps lines at 116 columns so the output passes the formatter unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 10); the house docblock rule (owner decision R-11, 2026-10-24).
 */
import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";

/** The widest line of a generated docblock, so oxfmt leaves it alone. */
const WIDTH = 116;

/** Wraps `text` after `label`, indenting continuation lines under the text. */
function wrap(label: string, text: string): string[] {
  const indent = " ".repeat(label.length);
  const lines: string[] = [];
  let line = label;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line.trim() === label.trim() ? `${label}${word}` : `${line} ${word}`;
    if (candidate.length > WIDTH && line.trim() !== label.trim()) {
      lines.push(line);
      line = `${indent}${word}`;
    } else line = candidate;
  }
  lines.push(line);
  return lines;
}

/**
 * The opening docblock of a generated file.
 *
 * @example
 * generatedHeader({ from: "src/node", purpose: "the wiring", boundary: "no logic", runtime: "node" });
 */
export function generatedHeader(contract: {
  readonly from: string;
  readonly purpose: string;
  readonly boundary: string;
  readonly runtime: "isomorphic" | "node";
}): string {
  const lines = [
    ...wrap(" * ", `${GENERATED_NOTICE}; from ${contract.from}`),
    ...wrap(" * Purpose: ", contract.purpose),
    ...wrap(" * Boundary: ", contract.boundary),
    ` * Runtime: ${contract.runtime}`,
  ];
  return ["/**", ...lines, " */"].join("\n");
}
