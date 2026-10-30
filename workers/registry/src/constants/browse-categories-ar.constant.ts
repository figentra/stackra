/**
 * Stackra file contract:
 * Purpose: `BROWSE_CATEGORIES_AR`: the Arabic names of the package categories the registry browser groups by.
 * Boundary: a constant only; plain text (callers escape it).
 * Runtime: worker
 * Governing contract: ADR 0453; ADR 0297 (locales).
 */

/** Category names (the `stackra.category` of package.json) in Arabic; English shows the name capitalised. */
export const BROWSE_CATEGORIES_AR: Readonly<Record<string, string>> = {
  application: "التطبيق",
  commerce: "التجارة",
  communication: "الاتصال",
  "cross-cutting": "الاهتمامات المشتركة",
  data: "البيانات",
  "design-system": "نظام التصميم",
  developer: "المطوّر",
  experience: "التجربة",
  foundation: "الأساس",
  infrastructure: "البنية التحتية",
  runtime: "وقت التشغيل",
  security: "الأمان",
  state: "الحالة",
  tooling: "الأدوات",
};
