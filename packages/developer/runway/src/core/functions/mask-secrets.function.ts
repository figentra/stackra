/**
 * Stackra file contract:
 * Purpose: `maskSecrets(text, secrets)`, `text` with every secret value in it replaced by `***`, so a line a deploy
 *          prints (a CLI's streamed output, a phase line, an error) never carries one.
 * Boundary: pure; isomorphic. A value is matched as written, longest first, so a secret that contains another is
 *           masked whole; a multi-line value (a PEM key) is also masked line by line, since output is masked one line
 *           at a time. An empty value masks nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (no secret in a log line); STA-2860.
 */

/** What a secret is replaced with. */
const MASK = "***";

/** The shortest line of a multi-line secret masked on its own: shorter lines ("-----", "}") are not secret. */
const MIN_PART = 4;

/**
 * Replaces every value of `secrets` found in `text` with `***`.
 *
 * @example
 * maskSecrets("token=s3cr3t ok", ["s3cr3t"]); // "token=*** ok"
 */
export function maskSecrets(text: string, secrets: Iterable<string>): string {
  const values = new Set<string>();
  for (const secret of secrets) {
    if (secret === "") continue;
    values.add(secret);
    if (!secret.includes("\n")) continue;
    for (const part of secret.split(/\r?\n/)) {
      const line = part.trim();
      if (line.length >= MIN_PART) values.add(line);
    }
  }
  let masked = text;
  for (const value of [...values].toSorted((a, b) => b.length - a.length))
    masked = masked.replaceAll(value, MASK);
  return masked;
}
