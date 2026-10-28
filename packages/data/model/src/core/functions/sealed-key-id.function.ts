/**
 * Stackra file contract:
 * Purpose: `sealedKeyId`, the id of the data key a sealed field value names, so the key-usage report can count rows
 *          per key and the re-seal job can tell a value still on a retired key from one on the current key.
 * Boundary: reads the `FieldCipher` sealed form of @stackra/contracts' `aes-gcm` driver, `v1.<keyId>.<iv>.<body>`,
 *           without opening it. A subject's derived key keeps its scope key's id, so the id is the scope key's on
 *           both paths. shortcut: the form is the `aes-gcm` driver's, the only `FieldCipher` driver; move this to a
 *           port method when a second driver with another form ships.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17); ADR 0188 (decision 2); ADR 0465 (decision 5: a re-seal job
 *                     first); gap gov7 (stackra-312).
 */

/**
 * The key id `sealed` names.
 *
 * @returns the id; undefined when `sealed` is not in the sealed form.
 * @example
 * sealedKeyId("v1.k2.qL0.Zm9v"); // "k2"
 */
export function sealedKeyId(sealed: string): string | undefined {
  const parts = sealed.split(".");
  return parts.length === 4 && parts[0] === "v1" && parts[1] !== "" ? parts[1] : undefined;
}
