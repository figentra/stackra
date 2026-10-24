/**
 * Stackra file contract:
 * Purpose: `SkillClass`, the class type `Skill({...})` returns and every skill class fits, so a consumer's declaration
 *          emit can name it.
 * Boundary: a type only (ADR 0294 decision 25: each factory returns an exported, named class type). Its constructor
 *           takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25); ADR 0305 (rule 43).
 */
import type { Skill } from "#core/bases/skill.base";

/** A skill class. */
export type SkillClass = abstract new () => Skill;
