/**
 * Stackra file contract:
 * Purpose: `CHART_CONTEXT_SHARE`, the share of a mark's colour in the soft fill a context mark stands back in (the
 *          columns beside the emphasised one), the rest the card's surface, so the emphasised mark keeps clear of
 *          them. The fill alone is under 3:1 on the card; the context mark's 1px outline in the field border (the
 *          theme's softest neutral held at 3:1) carries its edge, as WCAG 1.4.11 asks of a graphical object.
 * Boundary: a value only; the web writes it into `color-mix(in oklab, …)`, native into its own mix.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0340 (decision 9); WCAG 2.2 (1.4.11); STA-1371.
 */

/** 0 to 1: how much of the mark's colour the soft fill keeps; measured per brand by the playground's matrix. */
export const CHART_CONTEXT_SHARE = 0.35;
