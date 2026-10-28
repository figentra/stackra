/**
 * Stackra file contract:
 * Purpose: `ConsentRegime`, the rule a region's visitors get while they have not decided: opt-out (`ccpa`), or opt-in
 *          under the EU GDPR (`gdpr`), Brazil's LGPD (`lgpd`), Saudi Arabia's PDPL (`pdpl_sa`), the UAE's PDPL
 *          (`pdpl_ae`) or India's DPDP Act (`dpdp`). `ConsentConfig.regionDefaults` maps a region to one.
 * Boundary: an `Enum.of` value plus the type of the same name. Every regime but `ccpa` is opt-in; the separate codes
 *           keep the law a region falls under on record (and labelled) for consent proofs and reports. A region with no
 *           regime, and no `default` entry, is treated as `gdpr`: decline by default. Global Privacy Control refuses
 *           under every regime.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1, 2 and 4); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/**
 * The pre-decision rule of a region.
 *
 * @example
 * override regionDefaults: Record<string, ConsentRegime> = {
 *   default: ConsentRegime.Gdpr,
 *   US: ConsentRegime.Ccpa,
 *   BR: ConsentRegime.Lgpd,
 *   SA: ConsentRegime.PdplSa,
 * };
 */
export const ConsentRegime = Enum.of({
  /** Opt-in: every optional category is undecided, so refused, until the visitor grants it. */
  Gdpr: "gdpr",
  /** Opt-out: an optional category with `defaultGranted` is granted until the visitor refuses it. */
  Ccpa: "ccpa",
  /** Opt-in, Brazil's Lei Geral de Proteção de Dados. */
  Lgpd: "lgpd",
  /** Opt-in, Saudi Arabia's Personal Data Protection Law. */
  PdplSa: "pdpl_sa",
  /** Opt-in, the UAE's Personal Data Protection Law (Federal Decree-Law 45 of 2021). */
  PdplAe: "pdpl_ae",
  /** Opt-in, India's Digital Personal Data Protection Act 2023. */
  Dpdp: "dpdp",
});

/** One of the codes above. */
export type ConsentRegime = Enum.Value<typeof ConsentRegime>;
