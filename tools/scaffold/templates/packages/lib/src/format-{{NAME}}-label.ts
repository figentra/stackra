/** Collapse whitespace and trim a label. Replace with the package's real exports. */
export function format{{PASCAL}}Label(label: string): string {
  return label.trim().replace(/\s+/g, " ");
}
