/**
 * Stackra file contract:
 * Purpose: the `TransferCheck` port: whether a legal entity may release one item of a kind to a tenant in another
 *          region or deployment, under that entity's data-transfer rules.
 * Boundary: an abstract class that is its own token. The rules are market-pack data of the entity's jurisdiction
 *           (decision 4 names KSA PDPL and Egypt's Law 151 as examples); the OS driver reads them, this package names
 *           no law and no country. An unreachable rule source throws, so a release fails closed.
 * Runtime: isomorphic
 * Governing contract: ADR 0343 (decision 4); ADR 0370 (market packs); ADR 0363 (configuration over code).
 */
import { Port, type PublicId } from "@stackra/contracts";

/**
 * Checks a cross-region release.
 *
 * @example
 * export class PackTransferCheckDriver extends Driver(TransferCheck) {
 *   async mayRelease(entity, receiver, kind) { return this.rules.allows(entity, receiver, kind); }
 * }
 */
export abstract class TransferCheck extends Port {
  /**
   * Whether `legalEntity` may release an item of `kind` to `receiver`.
   *
   * @throws Error when the rules cannot be read.
   */
  abstract mayRelease(
    legalEntity: PublicId,
    receiver: PublicId<"scp">,
    kind: string,
  ): Promise<boolean>;
}
