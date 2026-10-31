/**
 * Stackra file contract:
 * Purpose: `ARABIC_FORMS`, the joining data of the basic Arabic letters (U+0621 to U+064A): the code point of each
 *          letter's isolated presentation form (U+FE80 to U+FEF4) and whether it joins on both sides (final, initial
 *          and medial forms follow the isolated one) or on the right only (the final form follows the isolated one).
 * Boundary: data only, from the Unicode Arabic Presentation Forms-B block; letters outside it are left as they are.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-026; Unicode ArabicShaping.txt.
 */

/** Joining data of one letter: its isolated form and whether it joins on both sides. */
type Forms = readonly [isolated: number, dual: boolean];

/** Joining data by letter. */
export const ARABIC_FORMS: ReadonlyMap<number, Forms> = new Map<number, Forms>([
  [0x06_21, [0xfe_80, false]],
  [0x06_22, [0xfe_81, false]],
  [0x06_23, [0xfe_83, false]],
  [0x06_24, [0xfe_85, false]],
  [0x06_25, [0xfe_87, false]],
  [0x06_26, [0xfe_89, true]],
  [0x06_27, [0xfe_8d, false]],
  [0x06_28, [0xfe_8f, true]],
  [0x06_29, [0xfe_93, false]],
  [0x06_2a, [0xfe_95, true]],
  [0x06_2b, [0xfe_99, true]],
  [0x06_2c, [0xfe_9d, true]],
  [0x06_2d, [0xfe_a1, true]],
  [0x06_2e, [0xfe_a5, true]],
  [0x06_2f, [0xfe_a9, false]],
  [0x06_30, [0xfe_ab, false]],
  [0x06_31, [0xfe_ad, false]],
  [0x06_32, [0xfe_af, false]],
  [0x06_33, [0xfe_b1, true]],
  [0x06_34, [0xfe_b5, true]],
  [0x06_35, [0xfe_b9, true]],
  [0x06_36, [0xfe_bd, true]],
  [0x06_37, [0xfe_c1, true]],
  [0x06_38, [0xfe_c5, true]],
  [0x06_39, [0xfe_c9, true]],
  [0x06_3a, [0xfe_cd, true]],
  [0x06_41, [0xfe_d1, true]],
  [0x06_42, [0xfe_d5, true]],
  [0x06_43, [0xfe_d9, true]],
  [0x06_44, [0xfe_dd, true]],
  [0x06_45, [0xfe_e1, true]],
  [0x06_46, [0xfe_e5, true]],
  [0x06_47, [0xfe_e9, true]],
  [0x06_48, [0xfe_ed, false]],
  [0x06_49, [0xfe_ef, false]],
  [0x06_4a, [0xfe_f1, true]],
]);
