/**
 * Stackra file contract:
 * Purpose: `searchRulesOf`, the ranking rules of one index for one phrase, read from the `search.rankingRules` setting
 *          text: the pins and hides of that phrase, every boost and the recency decay.
 * Boundary: pure, internal to this package. A pin or hide applies when its phrase normalises (`searchWordsOf`) to the
 *           read's words in the same order. A boost value `true` or `false` is a boolean, a number is a number,
 *           anything else a string; a factor is above 0 and at most 10, and a recency's days above 0, else the line is
 *           skipped. The last recency line wins. Lines that break `SEARCH_RULE_LINE` are skipped (the setting's schema
 *           refuses them on write). Caps (`MAX_PINNED`, `MAX_HIDDEN`, `MAX_BOOSTS`) bound the query one phrase causes.
 * Runtime: isomorphic
 * Governing contract: ADR 0221; ADR 0307 (rules 22 to 24); data-layer gap se11 (stackra-326).
 */
import type { SearchBoost, SearchFilterValue, SearchRecency } from "#contracts/index";
import { SEARCH_RULE_LINE } from "#core/constants/search-rule-line.constant";
import { searchWordsOf } from "#core/functions/search-words-of.function";
import type { SearchRules } from "#core/types/search-rules.type";

/** The most pinned rows of one phrase. */
const MAX_PINNED = 10;

/** The most hidden rows of one phrase. */
const MAX_HIDDEN = 100;

/** The most boosts of one index. */
const MAX_BOOSTS = 10;

/** The highest boost factor. */
const MAX_FACTOR = 10;

/** The value a boost line names, typed. */
function valueOf(text: string): SearchFilterValue {
  if (text === "true" || text === "false") return text === "true";
  return /^-?\d+(?:\.\d+)?$/.test(text) ? Number(text) : text;
}

/**
 * The rules for `words` (the read's normalised words) of `indexes` (the names the index answers to).
 *
 * @example
 * searchRulesOf("products pin linen shirt: prd_9\nproducts boost featured=true: 2", ["products"], ["linen", "shirt"]);
 * // { pinned: ["prd_9"], hidden: [], boosts: [{ path: "featured", value: true, factor: 2 }] }
 */
export function searchRulesOf(
  text: string,
  indexes: readonly string[],
  words: readonly string[],
): SearchRules {
  const phrase = words.join(" ");
  const pinned: string[] = [];
  const hidden: string[] = [];
  const boosts: SearchBoost[] = [];
  let recency: SearchRecency | undefined;
  for (const line of text.split("\n")) {
    const groups = SEARCH_RULE_LINE.exec(line);
    if (groups === null) continue;
    const [
      ,
      listIndex,
      verb,
      rulePhrase,
      ids,
      boostIndex,
      path,
      value,
      factor,
      recencyIndex,
      datePath,
      days,
    ] = groups;
    if (listIndex !== undefined && indexes.includes(listIndex)) {
      if (searchWordsOf(rulePhrase ?? "").join(" ") !== phrase) continue;
      const list = verb === "pin" ? pinned : hidden;
      for (const id of (ids ?? "").split(",").map((one) => one.trim()))
        if (id !== "" && !list.includes(id)) list.push(id);
    } else if (boostIndex !== undefined && indexes.includes(boostIndex)) {
      const scale = Number(factor);
      if (path !== undefined && value !== undefined && scale > 0 && scale <= MAX_FACTOR)
        boosts.push({ path, value: valueOf(value.trim()), factor: scale });
    } else if (recencyIndex !== undefined && indexes.includes(recencyIndex)) {
      const halfLifeDays = Number(days);
      if (datePath !== undefined && halfLifeDays > 0) recency = { path: datePath, halfLifeDays };
    }
  }
  return {
    pinned: pinned.filter((id) => !hidden.includes(id)).slice(0, MAX_PINNED),
    hidden: hidden.slice(0, MAX_HIDDEN),
    boosts: boosts.slice(0, MAX_BOOSTS),
    ...(recency === undefined ? {} : { recency }),
  };
}
