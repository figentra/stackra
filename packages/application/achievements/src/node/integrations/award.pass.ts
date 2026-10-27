/**
 * Stackra file contract:
 * Purpose: `AwardPass`, the award wallet pass (`award`): the kind's name as title and the level as subtitle, the
 *          level, period, grant date and short verify code as fields, the award's public id as serial and its verify
 *          URL as the QR code, and the brand kit's colours and logo.
 * Boundary: a pass kind (`Pass({ key })` of @stackra/integrations, ADR 0348 decision 5); it builds content only, from
 *           `AwardService#certificateOf`. Labels are lang keys of `assets/lang/<locale>/achievements.json`
 *           (`passes.award.*`), resolved by the host into the issue request's `labels`; the grant date is written as an
 *           ISO date. The `WalletPassIssuer` drivers of `@stackra/integrations/node` sign and issue it. A revoked award
 *           is refused before this runs (`certificateOf`); voiding an issued pass is not built yet (STA-791).
 * Runtime: node
 * Governing contract: ADR 0348 (decision 5); ADR 0368 (decision 6); ADR 0432 (decisions 2 and 4); ADR 0231.
 */
import { Pass, type PassContent } from "@stackra/integrations";

import type { AwardPassSource } from "#node/integrations/award-pass-source.type";

/**
 * The award pass.
 *
 * @example
 * const { template: _t, verifyQr: _q, ...award } = await awards.certificateOf(awardId, verifyBaseUrl);
 * const content = new AwardPass().content(award);
 */
export class AwardPass extends Pass({ key: "award" }) {
  /** The pass of one award. */
  content(award: AwardPassSource): PassContent {
    const fields: { label: string; value: string }[] = [];
    if (award.level !== null)
      fields.push({ label: "achievements::passes.award.level", value: award.level });
    if (award.period !== null)
      fields.push({ label: "achievements::passes.award.period", value: award.period });
    fields.push({
      label: "achievements::passes.award.granted",
      value: award.grantedAt.toISOString().slice(0, 10),
    });
    if (award.verifyCode !== null)
      fields.push({ label: "achievements::passes.award.code", value: award.verifyCode });
    return {
      serial: award.awardId,
      title: award.kindName,
      ...(award.level === null ? {} : { subtitle: award.level }),
      fields,
      barcode: { format: "qr", value: award.verifyUrl },
      ...(award.brand?.colors === undefined ? {} : { colors: award.brand.colors }),
      ...(award.brand?.logo === undefined ? {} : { logo: award.brand.logo }),
    };
  }
}
