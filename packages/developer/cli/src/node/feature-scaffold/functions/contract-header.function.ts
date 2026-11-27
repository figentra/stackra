/**
 * Stackra file contract:
 * Purpose: `contractHeader(contract)`, the Stackra file contract block that opens every file the feature scaffold
 *          writes (Purpose, Boundary, Runtime, Governing contract), each field wrapped at 120 columns under its label.
 * Boundary: pure; returns text.
 * Runtime: node
 * Governing contract: the file contract standard (AGENTS.md); ADR 0126 (scaffold templates).
 */

/** The widest line of a header. */
const WIDTH = 120;

/** Wraps `text` after `label`, continuation lines aligned under the text. */
function field(label: string, text: string): string[] {
  const lead = ` * ${label}: `;
  const indent = ` *${" ".repeat(lead.length - 2)}`;
  const lines: string[] = [];
  let line = lead;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const fresh = line === lead || line === indent;
    if (!fresh && line.length + 1 + word.length > WIDTH) {
      lines.push(line);
      line = indent + word;
    } else line = fresh ? line + word : `${line} ${word}`;
  }
  lines.push(line);
  return lines;
}

/**
 * The file contract block of a scaffolded file.
 *
 * @param contract - the four fields.
 * @example
 * contractHeader({ purpose: "`Order`, ...", boundary: "data only.", runtime: "node", contract: "ADR 0294." });
 */
export function contractHeader(contract: {
  readonly purpose: string;
  readonly boundary: string;
  readonly runtime: string;
  readonly contract: string;
}): string {
  return [
    "/**",
    " * Stackra file contract:",
    ...field("Purpose", contract.purpose),
    ...field("Boundary", contract.boundary),
    ...field("Runtime", contract.runtime),
    ...field("Governing contract", contract.contract),
    " */",
  ].join("\n");
}
