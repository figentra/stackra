/**
 * Stackra file contract:
 * Purpose: `acceptsFile`, true when a file's MIME type or name matches one of the accepted rules (`image/*`,
 *          `application/pdf`, `.csv`), or no rule is given.
 * Boundary: pure; the DropZone's filter for dropped, pasted and picked files.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers; ADR 0302 (decision 3); STA-1371 (wave C).
 */

/** True when `file` is one of `accepted`, or nothing is listed. */
export function acceptsFile(
  accepted: readonly string[] | undefined,
  file: { readonly type?: string | undefined; readonly name: string },
): boolean {
  const type = file.type ?? "";
  return (
    !accepted?.length ||
    accepted.some((rule) =>
      rule.startsWith(".")
        ? file.name.toLowerCase().endsWith(rule.toLowerCase())
        : rule.endsWith("/*")
          ? type.startsWith(rule.slice(0, -1))
          : type === rule,
    )
  );
}
