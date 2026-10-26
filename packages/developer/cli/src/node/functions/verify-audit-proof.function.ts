/**
 * Stackra file contract:
 * Purpose: `verifyAuditProof`, the offline check of an audit proof bundle (JSON Lines): every link hashes to the hash
 *          it carries (SHA-256 of its canonical JSON), follows the link before it by sequence and `previousHash` (the
 *          first one from the genesis hash or a checkpoint), and every checkpoint is signed by a trusted key and
 *          agrees with the link at its sequence.
 * Boundary: pure apart from Web Crypto. Bundle lines are `{"key": SignerPublicKey}`, `{"link": {...}, "hash": "…"}`
 *           and `{"checkpoint": {"sequence", "hash", "takenAt"}, "signature": Signature}`; anything else is a
 *           problem. With `trusted` keys only those count; without, the bundle's own keys are used and the report
 *           says so. Collects every problem and never throws on bad input.
 * Runtime: node
 * Governing contract: ADR 0212 (decision 3: hash chain, signed checkpoints, `stackra audit:verify`); ADR 0416.
 */
import { type Signature, type SignerPublicKey, verifySignature } from "@stackra/contracts";
import { canonicalHash, canonicalJson } from "@stackra/support";

import { GENESIS_HASH } from "#node/constants/genesis-hash.constant";
import type { AuditProofReport } from "#node/types/audit-proof-report.type";

/** A plain object. */
type Fields = Record<string, unknown>;

const isObject = (value: unknown): value is Fields =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isHash = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{64}$/.test(value);

const isSequence = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 1;

/**
 * The report of `text`, a proof bundle.
 *
 * @param text - the bundle, one JSON value per line.
 * @param trusted - the caller's own public keys; when empty, the keys in the bundle are used.
 * @example
 * const report = await verifyAuditProof(readFileSync("proof.jsonl", "utf8"), [auditKey]);
 */
export async function verifyAuditProof(
  text: string,
  trusted: readonly SignerPublicKey[],
): Promise<AuditProofReport> {
  const problems: string[] = [];
  const broken: number[] = [];
  const bundleKeys: SignerPublicKey[] = [];
  const links: { line: number; sequence: number; previousHash: string; hash: string }[] = [];
  const checkpoints: { line: number; checkpoint: Fields; signature: Signature }[] = [];
  const lines = text.split("\n");
  for (const [index, raw] of lines.entries()) {
    const line = index + 1;
    if (raw.trim() === "") continue;
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      problems.push(`line ${line}: not JSON`);
      continue;
    }
    if (isObject(value) && isObject(value["key"])) {
      bundleKeys.push(value["key"] as SignerPublicKey);
    } else if (isObject(value) && isObject(value["link"])) {
      const link = value["link"];
      const hash = value["hash"];
      if (!isSequence(link["sequence"]) || !isHash(link["previousHash"]) || !isHash(hash)) {
        problems.push(`line ${line}: a link needs a sequence, a previousHash and a hash`);
        continue;
      }
      if ((await canonicalHash(link)) !== hash) {
        problems.push(`line ${line}: link ${link["sequence"]} does not hash to its hash`);
        broken.push(link["sequence"]);
      }
      links.push({ line, sequence: link["sequence"], previousHash: link["previousHash"], hash });
    } else if (isObject(value) && isObject(value["checkpoint"]) && isObject(value["signature"])) {
      checkpoints.push({
        line,
        checkpoint: value["checkpoint"],
        signature: value["signature"] as Signature,
      });
    } else {
      problems.push(`line ${line}: neither a key, a link nor a signed checkpoint`);
    }
  }

  const keys = trusted.length > 0 ? trusted : bundleKeys;
  const linkHashes = new Map(links.map((link) => [link.sequence, link.hash]));
  const anchors = new Map<number, string>();
  let signed = 0;
  for (const { line, checkpoint, signature } of checkpoints) {
    const { sequence, hash } = checkpoint;
    if (!isSequence(sequence) || !isHash(hash)) {
      problems.push(`line ${line}: a checkpoint needs a sequence and a hash`);
      continue;
    }
    const key = keys.find((candidate) => candidate.keyId === signature.keyId);
    const message = new TextEncoder().encode(canonicalJson(checkpoint));
    if (key === undefined || !(await verifySignature(key, message, signature))) {
      problems.push(
        `line ${line}: checkpoint ${sequence} is not signed by a ${trusted.length > 0 ? "trusted" : "bundled"} key (${String(signature.keyId)})`,
      );
      broken.push(sequence);
      continue;
    }
    signed += 1;
    anchors.set(sequence, hash);
    const held = linkHashes.get(sequence);
    if (held !== undefined && held !== hash) {
      problems.push(`line ${line}: checkpoint ${sequence} does not match link ${sequence}`);
      broken.push(sequence);
    }
  }

  for (const [index, link] of links.entries()) {
    const before = links[index - 1];
    if (before === undefined) {
      const anchor = link.sequence === 1 ? GENESIS_HASH : anchors.get(link.sequence - 1);
      if (anchor === undefined)
        problems.push(
          `line ${link.line}: link ${link.sequence} starts the bundle with no signed checkpoint at ${link.sequence - 1}`,
        );
      else if (anchor !== link.previousHash) {
        problems.push(`line ${link.line}: link ${link.sequence} does not follow its anchor`);
        broken.push(link.sequence);
      }
      continue;
    }
    if (link.sequence !== before.sequence + 1) {
      problems.push(`line ${link.line}: link ${link.sequence} follows link ${before.sequence}`);
      broken.push(Math.min(link.sequence, before.sequence + 1));
    } else if (link.previousHash !== before.hash) {
      problems.push(
        `line ${link.line}: link ${link.sequence} does not follow link ${before.sequence}`,
      );
      broken.push(link.sequence);
    }
  }

  return Object.freeze({
    ok: problems.length === 0,
    links: links.length,
    signedCheckpoints: signed,
    trustedKeys: trusted.length > 0,
    brokenAt: broken.length === 0 ? null : Math.min(...broken),
    problems,
  });
}
